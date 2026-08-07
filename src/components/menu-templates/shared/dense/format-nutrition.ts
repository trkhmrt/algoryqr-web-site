export function formatNutritionValue(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  return String(value);
}
