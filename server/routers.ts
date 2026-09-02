import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getLearningMapData,
  getLearningNodeData,
  getLessonData,
  submitActivityData,
} from "./db";

const getUserId = (userId: number | undefined) => userId ?? 0;

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
          if (!node) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Nó de aprendizagem não encontrado" });
          }
          return node;
        });
      }),
  }),

  lesson: router({
    get: publicProcedure
      .input(z.object({ nodeId: z.string().min(1).max(64) }))
      .query(({ ctx, input }) => {
        return getLessonData(getUserId(ctx.user?.id), input.nodeId).then((lesson) => {
          if (!lesson?.activity) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lição não encontrada" });
          }
          return lesson;
        });
      }),
    submitActivity: publicProcedure
      .input(
        z.object({
          nodeId: z.string().min(1).max(64),
          activityId: z.string().min(1).max(64),
          selectedOptionId: z.string().min(1).max(64),
          clientEventId: z.string().min(8).max(96),
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

  progression: router({
    getSummary: publicProcedure.query(async ({ ctx }) => {
      const map = await getLearningMapData(getUserId(ctx.user?.id));
      return map.userProgress;
    }),
  }),
});

export type AppRouter = typeof appRouter;
