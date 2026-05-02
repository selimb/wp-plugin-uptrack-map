import * as z from "zod/mini";

export function clamp(v: number, min: number, max: number): number {
  // eslint-disable-next-line unicorn/prefer-math-min-max -- This is simpler.
  return v < min ? min : v > max ? max : v;
}

export function zCatchObject<TShape extends z.core.$ZodLooseShape>(
  shape: TShape,
): z.ZodMiniCatch<z.ZodMiniObject<TShape>> {
  const schema = z.object(shape);
  return zCatchObject.fromObject(schema);
}

zCatchObject.fromObject = <
  TObject extends z.ZodMiniObject<z.core.$ZodLooseShape>,
>(
  schema: TObject,
): z.ZodMiniCatch<TObject> => {
  return z.catch(schema, () => schema.parse({}));
};
