import { Transform } from "class-transformer";

/**
 * Transforms comma-separated string to array
 * Example: "ACTIVE,PENDING" -> ["ACTIVE", "PENDING"]
 */
export function TransformStringArray() {
  return Transform(({ value }: { value: string | string[] | undefined }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(",").map((v: string) => v.trim());
    }
    return [value];
  });
}
