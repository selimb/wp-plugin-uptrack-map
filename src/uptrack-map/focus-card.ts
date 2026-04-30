import { err, log } from "../logging";
import { FOCUS_CARD_SWIPE_DISTANCE_PX } from "./constants";
import type { RouteInfo, UptrackMapShortcodeInput } from "./types";

function buildAlpineData(routeInfo: RouteInfo): string {
  return [
    "{",
    `route: ${JSON.stringify(routeInfo)},`,
    // [evt-close-focus-card]
    `card: { close() { $dispatch('close-focus-card') } },`,
    "}",
  ].join(" ");
}

export const FOCUS_CARD_HTML_DEFAULT = `
  <div class="uptrack-focus-card">
    <div class="uptrack-focus-card-header">
      <a
        class="uptrack-focus-card-title"
        x-bind:href="route.url || false"
        x-text="route.title"
        x-bind:class="route.url ? '' : 'no-link'"
      ></a>
      <button
        type="button"
        aria-label="Close"
        class="uptrack-focus-card-close-button"
        x-on:click="card.close()"
      >&#10005;</button>
    </div>
    <div>
      <ul>
        <li> <span>Duration:</span> <span x-text="route.duration"></span>  <span>days</span> </li>
        <li> <span>Distance:</span> <span x-text="route.distance"></span> <span>km</span> </li>
        <li> <span>Elevation:</span> <span x-text="route.elevation"></span> <span>m</span> </li>
      </ul>
    <div>
  </div>
`;

type DragState = {
  delta: number;
  x0: number;
};

/**
 * Focus card control.
 * This is *not* implemented as a Leaflet Control because:
 * - We want it to take the full width and it's awkward to do that with Leaflet's CSS and DOM hierarchy.
 * - We don't want to be able to drag the map "through" the card, which prevents things like
 *   text selection.
 */
export class FocusCard {
  public onClose: (() => void) | undefined = undefined;

  private readonly $htmlTemplate: HTMLTemplateElement;

  private $elem: HTMLElement | undefined = undefined;
  private routeInfo: RouteInfo | undefined = undefined;
  private dragState: DragState | undefined = undefined;

  constructor(focusCardHtml: UptrackMapShortcodeInput["focus_card_html"]) {
    this.$htmlTemplate = document.createElement("template");
    this.$htmlTemplate.innerHTML = focusCardHtml;
  }

  show(info: RouteInfo): void {
    if (info.id === this.routeInfo?.id) {
      return;
    }

    this.routeInfo = info;

    this.hide();
    this.$elem = this._render(info);
    this._correctAdminBarMargin(this.$elem);
  }

  hide(): void {
    if (this.$elem) {
      this.$elem.remove();
      this.$elem = undefined;
    }

    document.removeEventListener("keyup", this._handleDocumentKeyup);
  }

  _render(info: RouteInfo): HTMLElement {
    const $fragment = this.$htmlTemplate.content.cloneNode(
      true,
    ) as DocumentFragment;
    const $elem = $fragment.firstElementChild;
    if (!$elem) {
      const message = "FocusCard: HTML template must have a root element";
      log("error", message, $fragment);
      throw err(message);
    }
    const $root = $elem as HTMLElement;

    const xData = buildAlpineData(info);
    $root.setAttribute("x-data", xData);

    document.body.append($root);

    // [evt-close-focus-card]
    $root.addEventListener("close-focus-card", () => {
      this.onClose?.();
    });
    $root.addEventListener("touchstart", this._handleTouchStart);
    $root.addEventListener("touchmove", this._handleTouchMove);
    $root.addEventListener("touchend", this._handleTouchEnd);
    $root.addEventListener("touchcancel", this._handleTouchCancel);

    document.addEventListener("keyup", this._handleDocumentKeyup);

    return $root;
  }

  _handleDocumentKeyup = (evt: KeyboardEvent): void => {
    if (evt.key === "Escape") {
      this.onClose?.();
    }
  };

  _handleTouchStart = (evt: TouchEvent): void => {
    this._updateDrag({ delta: 0, x0: evt.touches[0].clientX });
  };

  _handleTouchMove = (evt: TouchEvent): void => {
    if (!this.dragState) {
      return;
    }
    // Prevents map panning.
    evt.stopPropagation();

    const x0 = this.dragState.x0;
    const x1 = evt.touches[0].clientX;
    const delta = x1 - x0;
    if (delta === 0) {
      return;
    }
    this._updateDrag({ delta, x0 });
  };

  _handleTouchEnd = (_evt: TouchEvent): void => {
    if (!this.dragState) {
      return;
    }
    const { delta } = this.dragState;
    if (Math.abs(delta) > FOCUS_CARD_SWIPE_DISTANCE_PX) {
      this.onClose?.();
    }
    this._updateDrag(undefined);
  };

  _handleTouchCancel = (_evt: TouchEvent): void => {
    if (!this.dragState) {
      return;
    }
    this._updateDrag(undefined);
  };

  _updateDrag(dragState: DragState | undefined): void {
    const $root = this.$elem;
    if (!$root) {
      return;
    }

    this.dragState = dragState;

    const style = $root.style;
    if (dragState) {
      const { delta } = dragState;
      const opacity = 1 - Math.abs(delta) / FOCUS_CARD_SWIPE_DISTANCE_PX;

      style.transform = `translateX(${delta}px)`;
      style.transition = "";
      style.opacity = opacity.toString();
    } else {
      style.transform = "";
      style.transition = "transform 0.3s ease, opacity 0.3s ease";
      style.opacity = "1.0";
    }
  }

  _correctAdminBarMargin($container: HTMLElement): void {
    const $adminBar = document.querySelector("#wpadminbar");
    if (!$adminBar) {
      return;
    }
    const adminBarHeight = $adminBar.clientHeight;
    // 10px is the default marginBottom
    const offset = adminBarHeight + 10;
    $container.style.marginBottom = `${offset}px`;
  }
}
