import DEFAULT_FOCUS_CARD_HTML_ from "./focus-card.html";

export const DEFAULT_FOCUS_CARD_HTML =
  // Need to cast to string because of `node_modules/bun-types/extensions.d.ts`
  DEFAULT_FOCUS_CARD_HTML_ as unknown as string;

export { default as DEFAULT_UPTRACK_MAP_CSS } from "./uptrack-map.css";
