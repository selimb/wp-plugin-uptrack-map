import { z } from "zod/mini";

export function zFallback<O, I>(
  schema: z.ZodMiniType<O, I>,
  fallback: I,
): z.ZodMiniType<O, I> {
  return z.transform((value, ctx): O => {
    let result = schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    let valueFallback = structuredClone(value);
    for (const issue of result.error.issues) {
      if (issue.path.length === 0) {
        // If the top-level value is invalid, we can't do anything smart, so we just return the fallback.
        valueFallback = fallback;
        break;
      }
      setDeep(valueFallback, issue.path, getDeep(fallback, issue.path));
    }

    result = schema.safeParse(valueFallback);
    if (result.success) {
      return result.data;
    }

    for (const issue of result.error.issues) {
      ctx.issues.push({ ...issue, input: (issue.input ?? value) as never });
    }
    return z.NEVER;
  });
}

function getDeep(obj: unknown, path: PropertyKey[]): unknown {
  let current: unknown = obj;
  try {
    for (const segment of path) {
      current = (current as Record<PropertyKey, unknown>)[segment];
    }
  } catch {
    return undefined;
  }
  return current;
}

function setDeep(obj: unknown, path: PropertyKey[], value: unknown): unknown {
  const lastSegment = path.at(-1);
  if (lastSegment === undefined) {
    return value;
  }

  const lastObject = getDeep(obj, path.slice(0, -1));
  if (lastObject != null) {
    (lastObject as Record<PropertyKey, unknown>)[lastSegment] = value;
  }
  return obj;
}
