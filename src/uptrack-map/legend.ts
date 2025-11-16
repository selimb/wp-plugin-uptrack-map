import L from "leaflet";

import { RouteTypeLabel } from "../enums";
import { err } from "../logging";
import type { RouteType } from "../settings";
import { ROUTE_TYPE_PROPS } from "./constants";

/**
 * Reuses the built-in Layers control, with some customized styling to get colored checkboxes,
 * but exposes the built-in click handlers so that we can manage our own damn state.
 * The built-in Layers control doesn't play well with our route focusing logic.
 */
export class Legend extends L.Control.Layers {
  onInputClick: ((routeType: RouteType) => void) | undefined = undefined;

  static create(map: L.Map): Legend {
    const data = Object.fromEntries(
      Object.entries(ROUTE_TYPE_PROPS).map(([type_, props]) => {
        const type = type_ as RouteType;
        const html = `<span data-route-type="${type}" data-color="${props.color}" class="uptrack-legend-text">${RouteTypeLabel[type]}</span>`;
        // Create dummy groups to populate the legend.
        return [html, L.featureGroup().addTo(map)];
      }),
    );

    const control = new Legend(undefined, data, {
      collapsed: true,
      position: "topleft",
    });
    control.addTo(map);
    return control;
  }

  onAdd(map: L.Map): HTMLElement {
    const container = super.onAdd?.(map);
    if (!container) {
      throw err("Expected L.Control.Layers.onAdd to return a container");
    }

    for (const elem of container.querySelectorAll(".uptrack-legend-text")) {
      const span = /** @type {HTMLSpanElement} */ elem;
      const input = span.parentElement?.parentElement?.querySelector("input");

      input?.style.setProperty("color", span.getAttribute("data-color"));

      // SAFETY: We populate data-route-type programmatically in `create`, so this is safe.
      const routeType = span.getAttribute("data-route-type") as RouteType;
      input?.addEventListener("click", () => {
        this.onInputClick?.(routeType);
      });
    }

    return container;
  }

  disableInputs(disabled: boolean): void {
    const container = this.getContainer();
    container?.classList.toggle("hidden", disabled);

    // container?.querySelectorAll('input').forEach((input) => {
    //   input.disabled = disabled;
    // });
  }

  _checkDisabledLayers(): void {
    // No-op to disable built-in disabling logic.
  }
}
