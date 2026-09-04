import { Pressable, Text, View } from "react-native";

export type ReviewRating = "forgot" | "hard" | "easy";

const LABELS: Record<ReviewRating, string> = { forgot: "Esqueci", hard: "Difícil", easy: "Fácil" };
const HINTS: Record<ReviewRating, string> = { forgot: "Preciso rever em breve", hard: "Lembrei com esforço", easy: "Lembrei com facilidade" };

export function RatingRow({ selected, disabled, loading, onSelect }: { selected?: ReviewRating; disabled?: boolean; loading?: ReviewRating; onSelect: (rating: ReviewRating) => void }) {
  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel="Como foi sua lembrança?">
      {(Object.keys(LABELS) as ReviewRating[]).map((rating) => {
        const isSelected = selected === rating;
        const isLoading = loading === rating;
        const tone = rating === "easy" ? "border-success bg-success/10" : rating === "forgot" ? "border-error bg-error/10" : "border-warning bg-warning/10";
        return (
          <Pressable
            key={rating}
            onPress={() => onSelect(rating)}
            disabled={disabled || Boolean(loading)}
            accessibilityRole="radio"
            accessibilityLabel={`${LABELS[rating]}: ${HINTS[rating]}`}
            accessibilityState={{ checked: isSelected, disabled: disabled || Boolean(loading), busy: isLoading }}
            className={`min-h-[52px] flex-1 items-center justify-center rounded-2xl border px-2 ${isSelected ? tone : "border-border bg-surface"} ${disabled || loading ? "opacity-55" : ""}`}
          >
            <Text className="text-sm font-bold text-foreground">{isLoading ? "…" : LABELS[rating]}</Text>
            <Text className="mt-1 text-[10px] text-muted">{HINTS[rating]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
