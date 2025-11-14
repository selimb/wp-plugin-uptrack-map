import geojson from "geojson";
import L from "leaflet";

import { err, log } from "../logging";
import {
  CANVAS_TOLERANCE,
  ROUNDTRIP_EPSILON,
  ROUTE_MARKER_COLOR,
  ROUTE_MARKER_END_FILL_COLOR,
  ROUTE_MARKER_FILL_OPACITY,
  ROUTE_MARKER_RADIUS_PX,
  ROUTE_MARKER_ROUNDTRIP_FILL_COLOR,
  ROUTE_MARKER_START_FILL_COLOR,
  ROUTE_MARKER_WEIGHT_PX,
  ROUTE_STYLES,
  ROUTE_TYPE_PROPS,
  type RouteStyleVariant,
} from "./constants";
import { FocusCard } from "./focus-card";
import { Legend } from "./legend";
import type { LineCoords, RouteId, RouteInfo, RouteType } from "./types";

// ===============================================================================================
// Main Man
// ===============================================================================================

/**
 * NOTE: `undefined` is used to indicate "not computed yet", whereas `null` is used to indicate
 * "computed, but nothing to show".
 */
type Route = {
  info: RouteInfo;
  line: L.Layer;
  coords: LineCoords;
  fadeLine: L.Layer;
  marker: L.Marker | null | undefined;
  focusOutline: L.Layer | null | undefined;
  endpoints: L.Layer | null | undefined;
};

type FocusState = {
  id: RouteId;
};

type HoverState = {
  id: RouteId;
  popup: L.Popup;
};

export class UptrackMapManager {
  private readonly map: L.Map;
  private readonly renderer: L.Renderer;
  private readonly groupRoot: L.FeatureGroup;
  private readonly routes: Map<RouteInfo["id"], Route>;
  private readonly focusCard: FocusCard;
  private readonly legend: Legend;

  private focus: FocusState | undefined = undefined;
  private hover: HoverState | undefined = undefined;
  private routeTypeFilter: Record<RouteType, boolean> = {
    ski_touring: true,
    hiking: true,
    mountaineering: true,
  };

  constructor(map: L.Map) {
    this.map = map;

    this.renderer = L.canvas({ tolerance: CANVAS_TOLERANCE });

    this.groupRoot = L.featureGroup();
    this.groupRoot.addTo(this.map);

    /** @type {Map<RouteInfo['id'], Route>} */
    this.routes = new Map();

    this.focusCard = new FocusCard();
    this.focusCard.onClose = () => {
      this.unfocus();
    };

    this.legend = Legend.create(this.map);
    this.legend.onInputClick = (routeType) => {
      this.updateRouteTypeFilter(routeType);
    };
  }

  getStyle(
    info: RouteInfo,
    options: { variant?: RouteStyleVariant } = {},
  ): L.PathOptions {
    const { variant: variantKey = "normal" } = options;
    const variant = ROUTE_STYLES[variantKey];
    const color = ROUTE_TYPE_PROPS[info.type].color;
    return {
      color,
      opacity: variant.opacity,
      weight: variant.weight,
      interactive: variant.interactive,
      renderer: this.renderer,
    };
  }

  async loadRoutes(data: RouteInfo[]): Promise<void> {
    const map = this.map;

    await Promise.all(
      data.map(async (info) => {
        const { line, coords, fadeLine, marker } = await this.loadRoute(info);

        this.routes.set(info.id, {
          info,
          line,
          coords,
          fadeLine,
          marker,
          endpoints: undefined,
          focusOutline: undefined,
        });
      }),
    );

    map.fitBounds(this.groupRoot.getBounds());
  }

  async loadRoute(info: RouteInfo): Promise<{
    line: L.Layer;
    coords: L.LatLng[];
    fadeLine: L.Layer;
    marker: L.Marker | null;
  }> {
    let marker: L.Marker | null = null;

    let fadeLine_: L.Polyline | undefined;

    let coords: L.LatLng[] | undefined;

    const routeId = info.id;

    const options: L.GeoJSONOptions = {
      style: this.getStyle(info),
      onEachFeature: (_feature, createdLayer) => {
        if (!(createdLayer instanceof L.Polyline)) {
          log("warn", "Found non-Polyline feature in route.", {
            info,
            createdLayer,
          });
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Huh?
        const polyline: L.Polyline = createdLayer;

        // SAFETY: Assume we're dealing with a simple LineString.
        coords = polyline.getLatLngs() as L.LatLng[];

        polyline.on("click", (evt) => {
          this.handleRouteClick(evt, routeId);
        });
        // [mobile-mouse] For some reason these are fired on mobile, which prevents the `click` event.
        if (!L.Browser.mobile) {
          polyline.on("mouseover", (evt) => {
            this.handleRouteLineMouseover(evt, routeId, polyline);
          });
          polyline.on("mouseout", (evt) => {
            this.handleRouteLineMouseout(evt, routeId);
          });
        }

        const fadeLine = this.renderFadeLine(info, coords);
        fadeLine_ = fadeLine;

        fadeLine.on("click", (evt) => {
          this.handleRouteClick(evt, routeId);
        });
        // See [mobile-mouse].
        if (!L.Browser.mobile) {
          fadeLine.on("mouseover", (evt) => {
            this.handleRouteLineMouseover(evt, routeId, fadeLine);
          });
          fadeLine.on("mouseout", (evt) => {
            this.handleRouteLineMouseout(evt, routeId);
          });
        }

        marker = UptrackMapManager.createRouteMarker(info, coords);
        if (marker) {
          this.map.addLayer(marker);

          const popupOptions = UptrackMapManager.getPopupOptions(info);
          marker.bindPopup(popupOptions.content ?? "", popupOptions);

          marker.on("click", (evt) => {
            this.handleRouteClick(evt, routeId);
          });
          // See [mobile-mouse].
          if (!L.Browser.mobile) {
            const thisMarker = marker;
            marker.on("mouseover", (evt) => {
              this.handleRouteMarkerMouseover(evt, routeId, thisMarker);
            });
            marker.on("mouseout", (evt) => {
              this.handleRouteLineMouseout(evt, routeId);
            });
          }
        }
      },
    };

    const resp = await fetch(info.kml_url);
    const kmlText = await resp.text();
    const geoJson = UptrackMapManager.parseKml(kmlText);
    const line = L.geoJSON(geoJson, options);
    this.groupRoot.addLayer(line);

    if (!fadeLine_) {
      throw err("Failed to create fade line for route.");
    }
    if (!coords) {
      throw err("Failed to obtain line coords for route.");
    }

    return { line, coords, fadeLine: fadeLine_, marker };
  }

  static createRouteMarker(
    info: RouteInfo,
    lineCoords: LineCoords,
  ): L.Marker | null {
    if (info.marker_distance_percent < 0) {
      return null;
    }

    if (lineCoords.length === 0) {
      return null;
    }

    let markerCoords: L.LatLng;
    if (info.marker_distance_percent === 0) {
      markerCoords = lineCoords[0];
    } else if (info.marker_distance_percent >= 100) {
      // eslint-disable-next-line unicorn/prefer-at -- No.
      markerCoords = lineCoords[lineCoords.length - 1];
    } else {
      markerCoords = UptrackMapManager.computeMarkerCoords(lineCoords, info);
    }
    const marker = L.marker(markerCoords);
    return marker;
  }

  static computeMarkerCoords(
    lineCoords: L.LatLng[],
    info: RouteInfo,
  ): L.LatLng {
    const distances: number[] = [0];
    let distanceTotal = 0;
    let prevCoord = lineCoords[0];
    for (let i = 1; i < lineCoords.length; i++) {
      const coord = lineCoords[i];
      const segmentDistance = prevCoord.distanceTo(coord);
      distanceTotal += segmentDistance;
      distances.push(distanceTotal);
      prevCoord = coord;
    }

    const targetDistance = (info.marker_distance_percent / 100) * distanceTotal;

    let targetCoords: L.LatLng | undefined;

    for (let i = 1; i < distances.length; i++) {
      if (distances[i] < targetDistance) {
        continue;
      }
      const start = lineCoords[i - 1];
      const end = lineCoords[i];
      const segmentDistance = distances[i] - distances[i - 1];
      const distanceIntoSegment = targetDistance - distances[i - 1];
      const ratio = distanceIntoSegment / segmentDistance;

      const lat = start.lat + ratio * (end.lat - start.lat);
      const lng = start.lng + ratio * (end.lng - start.lng);
      targetCoords = L.latLng(lat, lng);
      return targetCoords;
    }

    log("warn", "Could not determine marker coordinates.", info);
    // Fallback to start.
    return lineCoords[0];
  }

  handleRouteClick(_evt: L.LeafletMouseEvent, routeId: RouteId): void {
    this.focusRoute(routeId);
  }

  handleRouteLineMouseover(
    evt: L.LeafletMouseEvent,
    routeId: RouteId,
    polyline: L.Polyline,
  ): void {
    this.hoverRoute(routeId, {
      type: "coord",
      coord: this.map.layerPointToLatLng(
        polyline.closestLayerPoint(evt.layerPoint),
      ),
    });
  }

  handleRouteMarkerMouseover(
    _evt: L.LeafletMouseEvent,
    routeId: RouteId,
    marker: L.Marker,
  ): void {
    this.hoverRoute(routeId, { type: "marker", marker });
  }

  handleRouteLineMouseout(_evt: L.LeafletMouseEvent, _routeId: RouteId): void {
    if (!this.hover) {
      return;
    }
    // [popup-click]
    // // Avoid unfocusing if the mouse is moving into the popup.
    // const popup = this.hover.popup;
    // const relatedTarget = evt.originalEvent.relatedTarget;
    // if (relatedTarget instanceof HTMLElement) {
    //   if (popup.getElement()?.contains(relatedTarget)) {
    //     return;
    //   }
    // }

    this.unhover();
  }

  handleRouteMarkerMouseout(
    _evt: L.LeafletMouseEvent,
    _routeId: RouteId,
    _marker: L.Marker,
  ): void {
    if (!this.hover) {
      return;
    }
    this.unhover();
  }

  focusRoute(routeId: RouteId): void {
    const route = this.routes.get(routeId);
    if (!route) {
      log("error", "Could not find route with ID", routeId);
      return;
    }

    this.unhover({ applyVisibility: false });
    if (this.focus?.id === routeId) {
      return;
    }

    if (route.endpoints === undefined) {
      route.endpoints = this.renderEndpointMarkers(route.coords);
    }
    this._showLayers(route.endpoints);

    if (route.focusOutline === undefined) {
      route.focusOutline = this.renderFocusOutline(route, route.coords);
    }
    this._showLayers(route.focusOutline);

    this.unfocus({ applyVisibility: false });
    this.focus = { id: routeId };

    this.applyVisibility();
    this.legend.disableInputs(true);
    this.focusCard.show(route.info);
  }

  unfocus(options?: { applyVisibility?: boolean }): void {
    if (!this.focus) {
      return;
    }
    const { applyVisibility = true } = options ?? {};
    const route = this.routes.get(this.focus.id);
    this._hideLayers(route?.focusOutline, route?.endpoints);
    this.focus = undefined;

    if (applyVisibility) {
      this.applyVisibility();
      this.legend.disableInputs(false);
      this.focusCard.hide(this.map);
    }
  }

  hoverRoute(
    routeId: RouteId,
    popupOption:
      | { type: "coord"; coord: L.LatLng }
      | { type: "marker"; marker: L.Marker },
  ): void {
    if (this.focus?.id === routeId) {
      return;
    }

    const route = this.routes.get(routeId);
    if (!route) {
      log("error", "Could not find route with ID", routeId);
      return;
    }

    let popup: L.Popup;
    switch (popupOption.type) {
      case "coord": {
        const { coord } = popupOption;
        popup = this.renderHoverPopup(coord, route.info);
        break;
      }
      case "marker": {
        const { marker } = popupOption;
        marker.openPopup();
        const popup_ = marker.getPopup();
        if (!popup_) {
          throw new Error("Expected marker to have a popup");
        }
        popup = popup_;
        break;
      }
    }
    this.addPopupListeners(popup, routeId);

    if (route.endpoints === undefined) {
      route.endpoints = this.renderEndpointMarkers(route.coords);
    }
    this._showLayers(route.endpoints);

    if (route.focusOutline === undefined) {
      route.focusOutline = this.renderFocusOutline(route, route.coords);
    }
    this._showLayers(route.focusOutline);

    this.unhover({ applyVisibility: false });
    this.hover = { id: routeId, popup };

    this.applyVisibility();
  }

  unhover(options?: { applyVisibility?: boolean }): void {
    if (!this.hover) {
      return;
    }
    const { applyVisibility = true } = options ?? {};

    const route = this.routes.get(this.hover.id);
    this._hideLayers(this.hover.popup, route?.focusOutline, route?.endpoints);
    this.hover = undefined;
    if (applyVisibility) {
      this.applyVisibility();
    }
  }

  renderFocusOutline(route: Route, coords: LineCoords): L.Layer {
    const focusOutline = L.polyline(
      coords,
      this.getStyle(route.info, { variant: "focus" }),
    );
    return focusOutline;
  }

  renderFadeLine(info: RouteInfo, coords: LineCoords): L.Polyline {
    const fadeLine = L.polyline(
      coords,
      this.getStyle(info, { variant: "fade" }),
    );
    return fadeLine;
  }

  renderHoverPopup(coord: L.LatLng, info: RouteInfo): L.Popup {
    const popup = L.popup(coord, UptrackMapManager.getPopupOptions(info)).addTo(
      this.map,
    );
    return popup;
  }

  static getPopupOptions(info: RouteInfo): L.PopupOptions {
    return {
      closeButton: false,
      content: info.post_title,
      // "Higher" `y` offset (default is 7) so that the popup sits above the line.
      offset: [0, 2],
      className: "uptrack-hover-popup",
    };
  }

  addPopupListeners(_popup: L.Popup, _routeId: RouteId): void {
    // [popup-click]
    // popup.getElement()?.addEventListener('click', () => {
    //   this.focusRoute(routeId);
    // });
    // popup.getElement()?.addEventListener('mouseleave', () => {
    //   this.unhover();
    // });
  }

  /**
   * @param {LineCoords} coords
   * @returns {L.FeatureGroup | null}
   */
  renderEndpointMarkers(coords: LineCoords): L.FeatureGroup | null {
    if (coords.length === 0) {
      return null;
    }

    const markers: L.CircleMarker[] = [];

    const c0 = coords[0];

    let endMarker: L.CircleMarker | undefined;
    if (coords.length > 1) {
      // eslint-disable-next-line unicorn/prefer-at -- No need to handle null, we've checked length above.
      const cN = coords[coords.length - 1];
      const isRoundtrip = c0.distanceTo(cN) <= ROUNDTRIP_EPSILON;
      if (!isRoundtrip) {
        endMarker = L.circleMarker(cN, {
          radius: ROUTE_MARKER_RADIUS_PX,
          color: ROUTE_MARKER_COLOR,
          weight: ROUTE_MARKER_WEIGHT_PX,
          fillColor: ROUTE_MARKER_END_FILL_COLOR,
          fillOpacity: ROUTE_MARKER_FILL_OPACITY,
          interactive: false,
        });
        markers.push(endMarker);
      }
    }

    const startMarker = L.circleMarker(c0, {
      radius: ROUTE_MARKER_RADIUS_PX,
      color: ROUTE_MARKER_COLOR,
      weight: ROUTE_MARKER_WEIGHT_PX,
      fillColor: endMarker
        ? ROUTE_MARKER_START_FILL_COLOR
        : ROUTE_MARKER_ROUNDTRIP_FILL_COLOR,
      fillOpacity: ROUTE_MARKER_FILL_OPACITY,
      interactive: false,
    });
    markers.push(startMarker);

    const group = L.featureGroup(markers);
    return group;
  }

  updateRouteTypeFilter(type: RouteType): void {
    const typeEnabled = !this.routeTypeFilter[type];
    this.routeTypeFilter[type] = typeEnabled;

    this.applyVisibility();
  }

  applyVisibility(): void {
    const focusId = this.focus?.id;
    const routeTypeFilter = this.routeTypeFilter;
    for (const [routeId, route] of this.routes.entries()) {
      const type = route.info.type;
      if (!routeTypeFilter[type]) {
        this._hideLayers(route.line, route.marker, route.fadeLine);
        continue;
      }

      if (focusId) {
        if (routeId === focusId) {
          this._showLayers(route.line);
          this._hideLayers(route.marker, route.fadeLine);
        } else {
          this._showLayers(route.fadeLine);
          this._hideLayers(route.marker, route.line);
        }
      } else {
        this._showLayers(route.line, route.marker);
        this._hideLayers(route.fadeLine);
      }
    }
  }

  _showLayers(...layers: Array<L.Layer | null | undefined>): void {
    const map = this.map;
    for (const layer of layers) {
      if (layer && !map.hasLayer(layer)) {
        map.addLayer(layer);
      }
    }
  }

  _hideLayers(...layers: Array<L.Layer | null | undefined>): void {
    const map = this.map;
    for (const layer of layers) {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }

  static parseKml(kmlText: string): geojson.GeoJSON {
    const xml = new DOMParser().parseFromString(kmlText, "text/xml");
    // XXX Verify
    // Modules like it's 1999!
    // @ts-expect-error -- Ditto.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Ditto.
    return window.toGeoJSON.kml(xml);
  }
}
