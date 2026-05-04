import * as z from "zod/mini";

import { zFallback } from "../utils/zod-fallback";

z.config(z.locales.en());

// [zNumber] Use this instead of `z.coerce.number()` so that `z.input` returns `string | number`, which
// simplifies form handling:
// - Intermediate values can be strings, which is what form inputs produce.
// - Final values are validated numbers.
const zNumber = z.transform<string | number, number>((input, ctx) => {
  if (typeof input === "number") {
    return input;
  }

  if (typeof input !== "string") {
    ctx.issues.push({
      code: "invalid_type",
      input,
      expected: "string or number",
      received: typeof input,
    });
    return z.NEVER;
  }

  const num = Number(input);
  if (Number.isNaN(num)) {
    ctx.issues.push({
      code: "custom",
      input,
      message: "Invalid number",
    });
    return z.NEVER;
  }
  return num;
});
const zOpacity = zNumber.check(z.minimum(0), z.maximum(1));

const zRouteStyle = z.object({
  opacity: zOpacity,
  weight: zNumber.check(z.minimum(1)),
});

const zRouteTypeProps = z.object({
  color: z.string(),
});

export const zMapStyles = z.object({
  canvasTolerance: zNumber.check(z.minimum(1)),
  routeStyles: z.object({
    normal: zRouteStyle,
    focus: zRouteStyle,
    fade: zRouteStyle,
  }),
  markerRadiusPx: zNumber.check(z.minimum(1)),
  markerWeightPx: zNumber.check(z.minimum(1)),
  markerColor: z.string(),
  markerFillOpacity: zOpacity,
  markerStartFillColor: z.string(),
  markerEndFillColor: z.string(),
  markerRoundtripFillColor: z.string(),
  roundtripEpsilon: zNumber.check(z.minimum(0)),
  routeTypeProps: z.object({
    ski_touring: zRouteTypeProps,
    mountaineering: zRouteTypeProps,
    hiking: zRouteTypeProps,
  }),
});
export type MapStyles = z.infer<typeof zMapStyles>;
export type RouteStyleVariant = keyof MapStyles["routeStyles"];

export const MAP_STYLES_DEFAULTS: MapStyles = {
  canvasTolerance: 14,
  routeStyles: {
    normal: {
      opacity: 1,
      weight: 3,
    },
    focus: {
      opacity: 0.2,
      weight: 12,
    },
    fade: {
      opacity: 0.3,
      weight: 3,
    },
  },
  markerRadiusPx: 6,
  markerWeightPx: 2,
  markerColor: "black",
  markerFillOpacity: 1,
  markerStartFillColor: "limegreen",
  markerEndFillColor: "orangered",
  markerRoundtripFillColor: "black",
  roundtripEpsilon: 50,
  routeTypeProps: {
    ski_touring: {
      color: "blue",
    },
    mountaineering: {
      color: "red",
    },
    hiking: {
      color: "green",
    },
  },
};

export const zMapStylesSafe = zFallback(zMapStyles, MAP_STYLES_DEFAULTS);

export const ROUTE_STYLE_INTERACTIVE: Record<RouteStyleVariant, boolean> = {
  normal: true,
  focus: false,
  fade: true,
};
