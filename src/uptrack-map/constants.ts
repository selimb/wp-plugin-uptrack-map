import type { RouteType } from "../settings";
import { clamp } from "../utils";

export const CANVAS_TOLERANCE = 14;

export const ROUTE_STYLES = {
  normal: {
    opacity: 1,
    weight: 3,
    interactive: true,
  },
  focus: {
    opacity: 0.2,
    weight: 12,
    interactive: false,
  },
  fade: {
    opacity: 0.3,
    weight: 3,
    interactive: true,
  },
};
export type RouteStyleVariant = keyof typeof ROUTE_STYLES;

export const ROUTE_MARKER_RADIUS_PX = 6;
export const ROUTE_MARKER_WEIGHT_PX = 2;
export const ROUTE_MARKER_COLOR = "black";
export const ROUTE_MARKER_FILL_OPACITY = 1;
export const ROUTE_MARKER_START_FILL_COLOR = "limegreen";
export const ROUTE_MARKER_END_FILL_COLOR = "orangered";
export const ROUTE_MARKER_ROUNDTRIP_FILL_COLOR = "black";
export const ROUNDTRIP_EPSILON = 50;

export const FOCUS_CARD_SWIPE_DISTANCE_PX = (() => {
  const smallestDimension = Math.min(window.innerWidth, window.innerHeight);
  const distance = smallestDimension * 0.4;
  // Clamp to reasonable values.
  return clamp(distance, 150, 400);
})();

export const ROUTE_TYPE_PROPS: Record<RouteType, { color: string }> = {
  ski_touring: {
    color: "blue",
  },
  mountaineering: {
    color: "red",
  },
  hiking: {
    color: "green",
  },
};
