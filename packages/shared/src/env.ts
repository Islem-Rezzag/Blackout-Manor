import type { ZodType, z } from "zod";

export function parseEnv<Schema extends ZodType>(
  schema: Schema,
  input: unknown,
) {
  return schema.parse(input) as z.infer<Schema>;
}
