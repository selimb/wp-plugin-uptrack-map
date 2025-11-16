import { err, log } from "../logging";
import { FOCUS_CARD_SWIPE_DISTANCE_PX } from "./constants";
import type { RouteInfo } from "./types";

const FOCUS_CARD_HTML = `
  <div class="uptrack-focus-card">
    <div class="uptrack-focus-card-header">
      <a class="uptrack-focus-card-title"></a>
      <button data-target="closeButton" type="button" aria-label="Close" class="uptrack-focus-card-close-button">&#10005;</button>
    </div>
    <div>
      <ul>
        <li> <span>Duration:</span>  <span data-target="duration"></span>  <span>days</span> </li>
        <li> <span>Distance:</span>  <span data-target="distance"></span> <span>km</span> </li>
        <li> <span>Elevation:</span> <span data-target="elevation"></span> <span>m</span> </li>
      </ul>
    <div>
  </div>
`;

type FocusCardElements = {
  $container: HTMLElement;
  $title: HTMLElement;
  $closeButton: HTMLButtonElement;
  $distance: HTMLElement;
  $duration: HTMLElement;
  $elevation: HTMLElement;
};

type DragState = {
  delta: number;
  x0: number;
};

function getElem<T extends keyof HTMLElementTagNameMap>(
  _elemType: T,
  selector: string,
  $parent: HTMLElement | DocumentFragment,
): HTMLElementTagNameMap[T] {
  const $elem = $parent.querySelector(selector);
  if ($elem) {
    return $elem as never;
  } else {
    log("error", "Missing element for selector", selector, "in", $parent);
    throw err(`Missing element for selector ${selector}`);
  }
}

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

  private $elements: FocusCardElements | undefined = undefined;
  private routeInfo: RouteInfo | undefined = undefined;
  private dragState: DragState | undefined = undefined;
  private shown = false;

  constructor() {
    this.$htmlTemplate = document.createElement("template");
    this.$htmlTemplate.innerHTML = FOCUS_CARD_HTML.trim();
  }

  show(info: RouteInfo): void {
    this.routeInfo = info;

    if (this.shown) {
      // No need to call this above, since we call `_update` in `onAdd`.
      this._update();
    } else {
      const $container = this._render();
      this._correctAdminBarMargin($container);
    }
  }

  hide(_map: L.Map): void {
    const { $container } = this.$elements ?? {};
    if ($container) {
      $container.remove();
      this.$elements = undefined;
    }
    this.shown = false;
    document.removeEventListener("keyup", this._handleDocumentKeyup);
  }

  _render(): HTMLElement {
    const $fragment = this.$htmlTemplate.content.cloneNode(
      true,
    ) as DocumentFragment;
    const $container = getElem("div", ".uptrack-focus-card", $fragment);
    document.body.append($container);

    const $title = getElem("span", ".uptrack-focus-card-title", $container);
    const $closeButton = getElem(
      "button",
      '[data-target="closeButton"]',
      $container,
    );
    const $distance = getElem("span", '[data-target="distance"]', $container);
    const $elevation = getElem("span", '[data-target="elevation"]', $container);
    const $duration = getElem("span", '[data-target="duration"]', $container);

    $closeButton.addEventListener("click", () => {
      this.onClose?.();
    });
    $container.addEventListener("touchstart", this._handleTouchStart);
    $container.addEventListener("touchmove", this._handleTouchMove);
    $container.addEventListener("touchend", this._handleTouchEnd);
    $container.addEventListener("touchcancel", this._handleTouchCancel);

    this.$elements = {
      $container,
      $title,
      $closeButton,
      $distance,
      $elevation,
      $duration,
    };
    this.shown = true;

    this._update();

    document.addEventListener("keyup", this._handleDocumentKeyup);

    return $container;
  }

  /** Updates most DOM elements based on the route info. */
  _update(): void {
    const info = this.routeInfo;
    if (!info) {
      return;
    }
    const { $title, $distance, $duration, $elevation } = this._getElements();

    $title.textContent = info.postTitle;
    $title.setAttribute("href", info.postUrl);

    $distance.textContent = info.distance;
    $elevation.textContent = info.elevation;
    $duration.textContent = info.duration;
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
    const { $container } = this._getElements();
    this.dragState = dragState;

    const style = $container.style;
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

  _getElements(): FocusCardElements {
    if (!this.$elements) {
      throw err("FocusCard elements not initialized");
    }
    return this.$elements;
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
