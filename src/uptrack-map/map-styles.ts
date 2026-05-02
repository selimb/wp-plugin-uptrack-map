import * as z from "zod/mini";

function zCatchObject<TShape extends z.core.$ZodLooseShape>(
  shape: TShape,
): z.ZodMiniCatch<z.ZodMiniObject<TShape>> {
  const schema = z.object(shape);
  return z.catch(schema, () => schema.parse({}));
}

export const zMapStyles = zCatchObject({
  canvasTolerance: z.catch(z.number(), 14),
  routeStyles: zCatchObject({
    normal: zCatchObject({
      opacity: z.catch(z.number(), 1),
      weight: z.catch(z.number(), 3),
    }),
    focus: zCatchObject({
      opacity: z.catch(z.number(), 0.2),
      weight: z.catch(z.number(), 12),
    }),
    fade: zCatchObject({
      opacity: z.catch(z.number(), 0.3),
      weight: z.catch(z.number(), 3),
    }),
  }),
  markerRadiusPx: z.catch(z.number(), 6),
  markerWeightPx: z.catch(z.number(), 2),
  markerColor: z.catch(z.string(), "black"),
  markerFillOpacity: z.catch(z.number(), 1),
  markerStartFillColor: z.catch(z.string(), "limegreen"),
  markerEndFillColor: z.catch(z.string(), "orangered"),
  markerRoundtripFillColor: z.catch(z.string(), "black"),
  roundtripEpsilon: z.catch(z.number(), 50),
  routeTypeProps: zCatchObject({
    ski_touring: zCatchObject({
      color: z.catch(z.string(), "blue"),
    }),
    mountaineering: zCatchObject({
      color: z.catch(z.string(), "red"),
    }),
    hiking: zCatchObject({
      color: z.catch(z.string(), "green"),
    }),
  }),
});

export const zMapStylesSafe = z.catch(
  zMapStyles,
  // SAFETY: Defaults are defined inline in zMapStyles catches.
  () => zMapStyles.parse({}),
);

export type MapStyles = z.infer<typeof zMapStyles>;
export type RouteStyleVariant = keyof MapStyles["routeStyles"];

export const ROUTE_STYLE_INTERACTIVE: Record<RouteStyleVariant, boolean> = {
  normal: true,
  focus: false,
  fade: true,
};
