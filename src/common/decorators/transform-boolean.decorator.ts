import { Transform } from "class-transformer";

/**
 * Transforms string to boolean
 * Example: "true" -> true, "false" -> false, "1" -> true, "0" -> false
 */
export function TransformBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return undefined;
  });
}
