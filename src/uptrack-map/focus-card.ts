import { err, log } from "../logging";
import { clamp } from "../utils";
import type { RouteInfo, UptrackMapShortcodeInput } from "./types";

function buildAlpineData(
  routeInfo: RouteInfo,
  options?: { pretty?: boolean },
): string {
  const pretty = options?.pretty;
  return [
    "{",
    `  route: ${JSON.stringify(routeInfo, null, pretty ? 4 : undefined)},`,
    // [evt-focus-card-close]
    `  card: { close() { $dispatch('focus-card:close') } },`,
    // [evt-focus-card-ready]
    `  init() { this.$nextTick(() => this.$dispatch('focus-card:ready')) },`,
    "}",
  ].join(pretty ? "\n" : "");
}

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
  public onReady: (() => void) | undefined = undefined;
  public elem: HTMLElement | undefined = undefined;

  private readonly templateElem: HTMLTemplateElement;
  private readonly targetElem: HTMLElement;
  private readonly document: Document;
  private readonly swipeDistancePx: number;

  private routeInfo: RouteInfo | undefined = undefined;
  private dragState: DragState | undefined = undefined;

  constructor(
    focusCardHtml: UptrackMapShortcodeInput["focus_card_html"],
    /**
     * Target element to append the focus card to.
     * @default document.body
     */
    target?: HTMLElement,
  ) {
    if (target) {
      this.targetElem = target;
      this.document = target.ownerDocument;
    } else {
      this.document = window.document;
      this.targetElem = window.document.body;
    }
    this.swipeDistancePx = computeFocusCardSwipeDistancePx(window);
    this.templateElem = this.document.createElement("template");
    this.templateElem.innerHTML = focusCardHtml;
  }

  static buildAlpineData = buildAlpineData;

  show(info: RouteInfo, options?: { alpineData?: string }): void {
    if (info.id === this.routeInfo?.id) {
      return;
    }

    this.hide();

    const alpineData = options?.alpineData ?? buildAlpineData(info);

    this.routeInfo = info;
    this.elem = this._render(alpineData);
    this._correctAdminBarMargin(this.elem);
  }

  hide(): void {
    this.routeInfo = undefined;
    if (this.elem) {
      this.elem.remove();
      this.elem = undefined;
    }

    this.document.removeEventListener("keyup", this._handleDocumentKeyup);
  }

  _render(alpineData: string): HTMLElement {
    const $fragment = this.templateElem.content.cloneNode(
      true,
    ) as DocumentFragment;
    const $child = $fragment.firstElementChild;
    if (!$child) {
      const message = "FocusCard: HTML template must have a root element";
      log("error", message, $fragment);
      throw err(message);
    }
    const $elem = $child as HTMLElement;

    $elem.setAttribute("x-data", alpineData);

    this.targetElem.append($elem);

    // [evt-focus-card-close]
    $elem.addEventListener("focus-card:close", () => {
      this.onClose?.();
    });
    // [evt-focus-card-ready]
    $elem.addEventListener("focus-card:ready", () => {
      this.onReady?.();
    });

    $elem.addEventListener("touchstart", this._handleTouchStart);
    $elem.addEventListener("touchmove", this._handleTouchMove);
    $elem.addEventListener("touchend", this._handleTouchEnd);
    $elem.addEventListener("touchcancel", this._handleTouchCancel);

    this.document.addEventListener("keyup", this._handleDocumentKeyup);

    return $elem;
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
    if (Math.abs(delta) > this.swipeDistancePx) {
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
    const $root = this.elem;
    if (!$root) {
      return;
    }

    this.dragState = dragState;

    const style = $root.style;
    if (dragState) {
      const { delta } = dragState;
      const opacity = 1 - Math.abs(delta) / this.swipeDistancePx;

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
    const $adminBar = this.document.querySelector("#wpadminbar");
    if (!$adminBar) {
      return;
    }
    const adminBarHeight = $adminBar.clientHeight;
    // 10px is the default marginBottom
    const offset = adminBarHeight + 10;
    $container.style.marginBottom = `${offset}px`;
  }
}

function computeFocusCardSwipeDistancePx(win: Window): number {
  const smallestDimension = Math.min(win.innerWidth, win.innerHeight);
  const distance = smallestDimension * 0.4;
  return clamp(distance, 150, 400);
}
