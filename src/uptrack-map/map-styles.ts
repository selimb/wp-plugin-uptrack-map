import * as z from "zod/mini";

import { zFallback } from "../utils/zod-fallback";

z.config(z.locales.en());

export const zMapStyles = z.object({
  canvasTolerance: z.number(),
  routeStyles: z.object({
    normal: z.object({
      opacity: z.number(),
      weight: z.number(),
    }),
    focus: z.object({
      opacity: z.number(),
      weight: z.number(),
    }),
    fade: z.object({
      opacity: z.number(),
      weight: z.number(),
    }),
  }),
  markerRadiusPx: z.number(),
  markerWeightPx: z.number(),
  markerColor: z.string(),
  markerFillOpacity: z.number(),
  markerStartFillColor: z.string(),
  markerEndFillColor: z.string(),
  markerRoundtripFillColor: z.string(),
  roundtripEpsilon: z.number(),
  routeTypeProps: z.object({
    ski_touring: z.object({
      color: z.string(),
    }),
    mountaineering: z.object({
      color: z.string(),
    }),
    hiking: z.object({
      color: z.string(),
    }),
  }),
});
export type MapStyles = z.infer<typeof zMapStyles>;

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

export type RouteStyleVariant = keyof MapStyles["routeStyles"];

export const ROUTE_STYLE_INTERACTIVE: Record<RouteStyleVariant, boolean> = {
  normal: true,
  focus: false,
  fade: true,
};
