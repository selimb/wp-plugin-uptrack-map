import { useEffect } from "@wordpress/element";

import { FocusCard } from "../uptrack-map/focus-card";
import type { RouteInfo } from "../uptrack-map/types";

const PREVIEW_ROUTE_INFO: RouteInfo = {
  id: "preview",
  kmlUrl: "",
  type: "ski_touring",
  marker: null,
  postUrl: "#",
  postTitle: "Example Route",
  distance: "12.5",
  elevation: "800",
  duration: "2",
};

export const FocusCardPreview: React.FC<{ htmlText: string }> = ({
  htmlText,
}) => {
  useEffect(() => {
    const card = new FocusCard(htmlText);
    card.show(PREVIEW_ROUTE_INFO);
    return () => {
      card.hide();
    };
  }, [htmlText]);

  return (
    <p style={{ color: "#666", fontStyle: "italic" }}>
      Focus card is rendered at the bottom of the screen.
    </p>
  );
};
