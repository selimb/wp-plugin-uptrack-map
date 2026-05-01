import { Button } from "@wordpress/components";
import { useEffect, useRef, useState } from "@wordpress/element";

import { FocusCard } from "../../uptrack-map/focus-card";
import type { FocusCardDataProps } from "./FocusCardData";
import type { FocusCardFormProps } from "./FocusCardForm";
import { SAMPLE_ROUTE_INFO } from "./sample-route";

type Device = "desktop" | "mobile";

export type FocusCardPreviewProps = Pick<
  FocusCardFormProps,
  "focusCardHtml" | "css" | "alpineJsUrl"
> &
  Pick<FocusCardDataProps, "alpineData">;

export const FocusCardPreview: React.FC<FocusCardPreviewProps> = ({
  focusCardHtml,
  css,
  alpineJsUrl,
  alpineData,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      return;
    }

    let cleanupResize: (() => void) | undefined;

    const init = (): void => {
      // Inject CSS
      const styleElem = iframeDoc.createElement("style");
      styleElem.textContent = css;
      iframeDoc.head.append(styleElem);

      // Inject AlpineJS
      if (alpineJsUrl) {
        const scriptElem = iframeDoc.createElement("script");
        scriptElem.src = alpineJsUrl;
        scriptElem.defer = true;
        iframeDoc.head.append(scriptElem);
      }

      const card = new FocusCard(focusCardHtml, iframeDoc.body);
      card.show(SAMPLE_ROUTE_INFO, { alpineData });
      cleanupResize = setupFocusCardIframeResize({ card, iframe, iframeDoc });
    };

    if (iframeDoc.readyState === "complete") {
      init();
    } else {
      iframe.addEventListener("load", init, { once: true });
    }

    return () => {
      cleanupResize?.();
    };
  }, [focusCardHtml, css, alpineJsUrl, alpineData]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        <Button
          icon="desktop"
          isPressed={device === "desktop"}
          label="Desktop"
          onClick={() => {
            setDevice("desktop");
          }}
        >
          Desktop
        </Button>
        <Button
          icon="smartphone"
          isPressed={device === "mobile"}
          label="Mobile"
          onClick={() => {
            setDevice("mobile");
          }}
        >
          Mobile
        </Button>
      </div>

      <iframe
        ref={iframeRef}
        style={{
          width: device === "desktop" ? "100%" : "390px",
          maxWidth: "100%",
          backgroundColor: "#f5f1e8",
          border: "1px solid #d6cfc1",
          transition: "width 160ms ease",
        }}
        title="Focus Card Preview"
      />
    </div>
  );
};

function setupFocusCardIframeResize(params: {
  card: FocusCard;
  iframe: HTMLIFrameElement;
  iframeDoc: Document;
}): () => void {
  const { card, iframe, iframeDoc } = params;

  iframeDoc.body.style.margin = "1rem";
  iframeDoc.body.style.overflow = "hidden";

  const updateHeight = (): void => {
    const contentHeight = iframeDoc.body.scrollHeight;
    iframe.style.height = `${contentHeight}px`;
  };

  card.onReady = () => {
    const elem = card.elem;
    if (elem) {
      // Undo `position:absolute` to get more predictable height measurement.
      elem.style.position = "inherit";
    }
    updateHeight();
  };

  const rafId = requestAnimationFrame(updateHeight);

  const observer = new ResizeObserver(updateHeight);
  observer.observe(iframeDoc.body);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(rafId);
  };
}
