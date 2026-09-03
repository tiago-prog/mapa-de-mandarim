import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getLearningMapData,
  getLearningNodeData,
  getLessonData,
  submitActivityData,
  getAudioAssetByHash,
  saveAudioAsset,
  saveContentImportDraft,
} from "./db";
import { getDictionaryEntry, searchDictionary, setDictionaryEntryStatus } from "./dictionary";
import { audioAssetInputSchema } from "./domain/audio";
import { generateAndUploadAudio, getAudioAssetPlan } from "./audio-service";
import { contentImportId, validateContentImport } from "./domain/content-import";
import { ensureSrsCard, getDueSrsCards, submitSrsRating } from "./srs";

const getUserId = (userId: number | undefined) => userId ?? 0;
const activityType = z.enum(["multiple_choice", "word_order", "context_choice", "fill_blank"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  today: router({
    get: publicProcedure.query(({ ctx }) => getLearningMapData(getUserId(ctx.user?.id))),
  }),

  learningMap: router({
    get: publicProcedure.query(({ ctx }) => getLearningMapData(getUserId(ctx.user?.id))),
    getNode: publicProcedure
      .input(z.object({ nodeId: z.string().min(1).max(64) }))
      .query(({ ctx, input }) => {
        return getLearningNodeData(getUserId(ctx.user?.id), input.nodeId).then((node) => {
          if (!node) throw new TRPCError({ code: "NOT_FOUND", message: "Nó de aprendizagem não encontrado" });
          return node;
        });
      }),
  }),

  lesson: router({
    get: publicProcedure
      .input(
        z.object({
          nodeId: z.string().min(1).max(64),
          stepId: z.string().min(1).max(80).optional(),
          activityId: z.string().min(1).max(64).optional(),
        }),
      )
      .query(({ ctx, input }) => {
        return getLessonData(getUserId(ctx.user?.id), input.nodeId, input.stepId, input.activityId).then((lesson) => {
          if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Etapa não encontrada" });
          return lesson;
        });
      }),
    submitActivity: publicProcedure
      .input(
        z.object({
          nodeId: z.string().min(1).max(64),
          stepId: z.string().min(1).max(80),
          activityId: z.string().min(1).max(64),
          selectedOptionId: z.string().min(1).max(255).optional(),
          selectedOrder: z.array(z.string().min(1).max(80)).max(20).optional(),
          clientEventId: z.string().min(8).max(96),
        }).superRefine((input, context) => {
          if (!input.selectedOptionId && !input.selectedOrder?.length) {
            context.addIssue({ code: "custom", message: "Selecione ou organize uma resposta", path: ["selectedOptionId"] });
          }
        }),
      )
      .mutation(({ ctx, input }) => {
        return submitActivityData(getUserId(ctx.user?.id), input).catch((error: unknown) => {
          if (error instanceof Error && error.message === "Atividade não encontrada") {
            throw new TRPCError({ code: "NOT_FOUND", message: error.message });
          }
          throw error;
        });
      }),
  }),

  review: router({
    getDue: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
      .query(({ ctx, input }) => getDueSrsCards(getUserId(ctx.user?.id), new Date(), input.limit)),
    activate: publicProcedure
      .input(z.object({ lexicalEntryId: z.string().min(1).max(64) }))
      .mutation(({ ctx, input }) => ensureSrsCard(getUserId(ctx.user?.id), input.lexicalEntryId).catch((error: unknown) => {
        if (error instanceof Error && error.message === "Palavra não encontrada") {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw error;
      })),
    submitRating: publicProcedure
      .input(z.object({
        cardId: z.string().min(1).max(96),
        rating: z.enum(["forgot", "hard", "easy"]),
        clientEventId: z.string().min(8).max(96),
      }))
      .mutation(({ ctx, input }) => submitSrsRating({
        userId: getUserId(ctx.user?.id),
        cardId: input.cardId,
        rating: input.rating,
        clientEventId: input.clientEventId,
      }).catch((error: unknown) => {
        if (error instanceof Error && error.message === "Cartão SRS não encontrado") {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw error;
      })),
  }),

  adminContent: router({
    importDraft: adminProcedure
      .input(z.object({ document: z.unknown() }))
      .mutation(async ({ ctx, input }) => {
        let document;
        try {
          document = validateContentImport(input.document);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.issues.map((issue) => issue.message).join("; ") });
          }
          throw error;
        }
        const saved = await saveContentImportDraft({
          id: contentImportId(document.path.id, document.contentVersion),
          pathId: document.path.id,
          contentVersion: document.contentVersion,
          status: "draft",
          payloadJson: JSON.stringify(document),
          validationErrorsJson: "[]",
          createdBy: ctx.user.id,
        });
        return { importId: saved?.id, status: saved?.status, pathId: saved?.pathId, contentVersion: saved?.contentVersion };
      }),
  }),

  adminAudio: router({
    generate: adminProcedure
      .input(audioAssetInputSchema)
      .mutation(async ({ input }) => {
        const plan = getAudioAssetPlan(input);
        const databasePlan = { ...plan, rate: String(plan.rate) };
        const existing = await getAudioAssetByHash(plan.textHash);
        if (existing?.status === "ready") return existing;
        await saveAudioAsset({ ...databasePlan, status: "processing", errorMessage: null });
        try {
          const generated = await generateAndUploadAudio(input);
          const asset = { ...plan, ...generated, id: plan.id, rate: String(generated.rate) };
          await saveAudioAsset(asset);
          return asset;
        } catch (error) {
          await saveAudioAsset({ ...databasePlan, status: "failed", errorMessage: error instanceof Error ? error.message : "Falha desconhecida" });
          throw error;
        }
      }),
  }),

  progression: router({
    getSummary: publicProcedure.query(async ({ ctx }) => {
      const map = await getLearningMapData(getUserId(ctx.user?.id));
      return map.userProgress;
    }),
  }),

  dictionary: router({
    search: publicProcedure
      .input(z.object({ query: z.string().max(80).default(""), limit: z.number().int().min(1).max(50).default(20) }))
      .query(({ ctx, input }) => searchDictionary(getUserId(ctx.user?.id), input.query, input.limit)),
    get: publicProcedure
      .input(z.object({ entryId: z.string().min(1).max(64) }))
      .query(({ ctx, input }) => getDictionaryEntry(getUserId(ctx.user?.id), input.entryId).then((entry) => {
        if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Palavra não encontrada" });
        return entry;
      })),
    myWords: publicProcedure
      .input(z.object({ status: z.enum(["known", "learning"]).optional() }))
      .query(async ({ ctx, input }) => {
        const entries = await searchDictionary(getUserId(ctx.user?.id), "", 50);
        return input.status ? entries.filter((entry) => entry.status === input.status) : entries.filter((entry) => entry.status !== "new");
      }),
    setStatus: publicProcedure
      .input(z.object({ entryId: z.string().min(1).max(64), status: z.enum(["new", "known", "learning"]) }))
      .mutation(({ ctx, input }) => setDictionaryEntryStatus(getUserId(ctx.user?.id), input.entryId, input.status).catch((error: unknown) => {
        if (error instanceof Error && error.message === "Palavra não encontrada") {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw error;
      })),
  }),
});

export type AppRouter = typeof appRouter;
