// @ts-check
'use strict';

/** @import L from "leaflet" */
/** @import geojson from "geojson" */

/**
 * SYNC [sync-uptrack-RouteType]
 * @typedef {"ski_touring" | "mountaineering" | "hiking"} UptrackRouteType
 */

/**
 * SYNC [sync-uptrack-RouteInfo]
 * @typedef {Object} RouteInfo
 * @property {string} id
 * @property {string} kml_url
 * @property {UptrackRouteType} type
 * @property {number} marker_distance_percent
 * @property {string} post_url
 * @property {string} post_title
 * @property {number} distance_km
 * @property {number} elevation_m
 * @property {number} duration_d
 */
/** @typedef {RouteInfo['id']} RouteId */

(function () {
  // ===============================================================================================
  // Constants
  // ===============================================================================================
  const CANVAS_TOLERANCE = 14;

  const ROUTE_STYLES = {
    normal: {
      opacity: 1.0,
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

  const ROUTE_MARKER_RADIUS_PX = 6;
  const ROUTE_MARKER_WEIGHT_PX = 2;
  const ROUTE_MARKER_COLOR = 'black';
  const ROUTE_MARKER_FILL_OPACITY = 1.0;
  const ROUTE_MARKER_START_FILL_COLOR = 'limegreen';
  const ROUTE_MARKER_END_FILL_COLOR = 'orangered';
  const ROUTE_MARKER_ROUNDTRIP_FILL_COLOR = 'black';
  const ROUNDTRIP_EPSILON = 50;

  const FOCUS_CARD_SWIPE_DISTANCE_PX = (() => {
    const smallestDimension = Math.min(window.innerWidth, window.innerHeight);
    const distance = smallestDimension * 0.4;
    // Clamp to reasonable values.
    return clamp(distance, 150, 400);
  })();

  /** @type {Record<UptrackRouteType, {label: string, color: string}>} */
  const ROUTE_TYPE_PROPS = {
    ski_touring: {
      label: 'Ski Touring',
      color: 'blue',
    },
    mountaineering: {
      label: 'Mountaineering',
      color: 'red',
    },
    hiking: {
      label: 'Hiking',
      color: 'green',
    },
  };

  // ===============================================================================================
  // Logging
  // ===============================================================================================
  /**
   * @param {'info' | 'warn' | 'error'} level
   * @param {unknown[]} args
   */
  function log(level, ...args) {
    console[level]('[UptrackMap]', ...args);
  }

  /**
   * @param {string} message
   * @param {ErrorOptions} [options]
   */
  function err(message, options) {
    return new Error(`[UptrackMap] ${message}`, options);
  }

  // ===============================================================================================
  // Utils
  // ===============================================================================================
  /**
   * @param {number} v
   * @param {number} min
   * @param {number} max
   */
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  // ===============================================================================================
  // Main Man
  // ===============================================================================================
  /**
   * @typedef {L.LatLng[]} LineCoords
   */

  /**
   * NOTE: `undefined` is used to indicate "not computed yet", whereas `null` is used to indicate
   * "computed, but nothing to show".
   * @typedef {Object} Route
   * @property {RouteInfo} info
   * @property {L.Layer} line
   * @property {LineCoords} coords
   * @property {L.Layer} fadeLine
   * @property {L.Marker | null | undefined} marker
   * @property {L.Layer | null | undefined} focusOutline
   * @property {L.Layer | null | undefined} endpoints
   */

  class UptrackMapManager {
    /**
     * @param {L.Map} map
     */
    constructor(map) {
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

      /**
       * @typedef {Object} FocusState
       * @property {RouteId} id
       */
      /** @type {FocusState | undefined} */
      this.focus = undefined;
      /**
       * @typedef {Object} HoverState
       * @property {RouteId} id
       * @property {L.Popup} popup
       */
      /** @type {HoverState | undefined} */
      this.hover = undefined;

      /** @type {Record<UptrackRouteType, boolean>} */
      this.routeTypeFilter = {
        ski_touring: true,
        hiking: true,
        mountaineering: true,
      };

      this.legend = Legend.create(this.map);
      this.legend.onInputClick = (routeType) => {
        this.updateRouteTypeFilter(routeType);
      };
    }

    /**
     * @param {RouteInfo} info
     * @param {{variant?: 'focus' | 'fade' | 'normal'}} options
     * @returns {L.PathOptions}
     */
    getStyle(info, options = {}) {
      const { variant: variantKey = 'normal' } = options;
      const variant = ROUTE_STYLES[variantKey];
      const color = ROUTE_TYPE_PROPS[info.type].color ?? 'blue';
      return {
        color,
        opacity: variant.opacity,
        weight: variant.weight,
        interactive: variant.interactive,
        renderer: this.renderer,
      };
    }

    /**
     * @param {RouteInfo[]} data
     */
    async loadRoutes(data) {
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
        })
      );

      map.fitBounds(this.groupRoot.getBounds());
    }

    /**
     * @param {RouteInfo} info
     * @returns {Promise<{line: L.Layer, coords: L.LatLng[]; fadeLine: L.Layer, marker: L.Marker | null}>}
     */
    async loadRoute(info) {
      /** @type {L.Marker | null} */
      let marker = null;

      /** @type {L.Polyline | undefined} */
      let fadeLine_;

      /** @type {L.LatLng[] | undefined} */
      let coords;

      const routeId = info.id;

      /** @type {L.GeoJSONOptions} */
      const options = {
        style: this.getStyle(info),
        onEachFeature: (_feature, createdLayer) => {
          if (!(createdLayer instanceof L.Polyline)) {
            log('warn', 'Found non-Polyline feature in route.', {
              info,
              createdLayer,
            });
            return;
          }

          // Assume we're dealing with a simple LineString.
          coords = /** @type {L.LatLng[]} */ (createdLayer.getLatLngs());

          createdLayer.on('click', (evt) => {
            this.handleRouteClick(evt, routeId);
          });
          // [mobile-mouse] For some reason these are fired on mobile, which prevents the `click` event.
          if (!L.Browser.mobile) {
            createdLayer.on('mouseover', (evt) => {
              this.handleRouteLineMouseover(evt, routeId, createdLayer);
            });
            createdLayer.on('mouseout', (evt) => {
              this.handleRouteLineMouseout(evt, routeId);
            });
          }

          const fadeLine = this.renderFadeLine(info, coords);
          fadeLine_ = fadeLine;

          fadeLine.on('click', (evt) => {
            this.handleRouteClick(evt, routeId);
          });
          // See [mobile-mouse].
          if (!L.Browser.mobile) {
            fadeLine.on('mouseover', (evt) => {
              this.handleRouteLineMouseover(evt, routeId, fadeLine);
            });
            fadeLine.on('mouseout', (evt) => {
              this.handleRouteLineMouseout(evt, routeId);
            });
          }

          marker = UptrackMapManager.createRouteMarker(info, coords);
          if (marker) {
            this.map.addLayer(marker);

            const popupOptions = UptrackMapManager.getPopupOptions(info);
            marker.bindPopup(popupOptions.content ?? '', popupOptions);

            marker.on('click', (evt) => {
              this.handleRouteClick(evt, routeId);
            });
            // See [mobile-mouse].
            if (!L.Browser.mobile) {
              const thisMarker = marker;
              marker.on('mouseover', (evt) => {
                this.handleRouteMarkerMouseover(evt, routeId, thisMarker);
              });
              marker.on('mouseout', (evt) => {
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
        throw err('Failed to create fade line for route.');
      }
      if (!coords) {
        throw err('Failed to obtain line coords for route.');
      }

      return { line, coords, fadeLine: fadeLine_, marker };
    }

    /**
     * @param {RouteInfo} info
     * @param {LineCoords} lineCoords
     * @returns {L.Marker | null}
     */
    static createRouteMarker(info, lineCoords) {
      if (info.marker_distance_percent < 0) {
        return null;
      }

      if (lineCoords.length === 0) {
        return null;
      }

      /** @type {L.LatLng} */
      let markerCoords;
      if (info.marker_distance_percent === 0) {
        markerCoords = lineCoords[0];
      } else if (info.marker_distance_percent >= 100) {
        markerCoords = lineCoords[lineCoords.length - 1];
      } else {
        markerCoords = UptrackMapManager.computeMarkerCoords(lineCoords, info);
      }
      const marker = L.marker(markerCoords);
      return marker;
    }

    /**
     * @param {L.LatLng[]} lineCoords
     * @param {RouteInfo} info
     * @returns {L.LatLng}
     */
    static computeMarkerCoords(lineCoords, info) {
      /** @type {number[]} */
      const distances = [0];
      let distanceTotal = 0;
      let prevCoord = lineCoords[0];
      for (let i = 1; i < lineCoords.length; i++) {
        const coord = lineCoords[i];
        const segmentDistance = prevCoord.distanceTo(coord);
        distanceTotal += segmentDistance;
        distances.push(distanceTotal);
        prevCoord = coord;
      }

      const targetDistance =
        (info.marker_distance_percent / 100) * distanceTotal;

      /** @type {L.LatLng | undefined} */
      let targetCoords;

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

      log('warn', 'Could not determine marker coordinates.', info);
      // Fallback to start.
      return lineCoords[0];
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     */
    handleRouteClick(evt, routeId) {
      this.focusRoute(routeId);
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     * @param {L.Polyline} polyline
     */
    handleRouteLineMouseover(evt, routeId, polyline) {
      this.hoverRoute(routeId, {
        type: 'coord',
        coord: this.map.layerPointToLatLng(
          polyline.closestLayerPoint(evt.layerPoint)
        ),
      });
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     * @param {L.Marker} marker
     */
    handleRouteMarkerMouseover(evt, routeId, marker) {
      this.hoverRoute(routeId, { type: 'marker', marker });
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     */
    handleRouteLineMouseout(evt, routeId) {
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

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     */
    handleRouteMarkerMouseout(evt, routeId, marker) {
      if (!this.hover) {
        return;
      }
      this.unhover();
    }

    /**
     * @param {RouteId} routeId
     */
    focusRoute(routeId) {
      const route = this.routes.get(routeId);
      if (!route) {
        log('error', 'Could not find route with ID', routeId);
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
      this.focusCard.show(this.map, route.info);
    }

    /**
     * @param {{applyVisibility?: boolean}} [options]
     */
    unfocus(options) {
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

    /**
     * @param {RouteId} routeId
     * @param {{type: 'coord', coord: L.LatLng} | {type: 'marker', marker: L.Marker}} popupOption
     */
    hoverRoute(routeId, popupOption) {
      if (this.focus?.id === routeId) {
        return;
      }

      const route = this.routes.get(routeId);
      if (!route) {
        log('error', 'Could not find route with ID', routeId);
        return;
      }

      /** @type {L.Popup} */
      let popup;
      switch (popupOption.type) {
        case 'coord': {
          const { coord } = popupOption;
          popup = this.renderHoverPopup(coord, route.info);
          break;
        }
        case 'marker':
          const { marker } = popupOption;
          marker.openPopup();
          const popup_ = marker.getPopup();
          if (!popup_) {
            throw new Error('Expected marker to have a popup');
          }
          popup = popup_;
          break;
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

    /**
     * @param {{applyVisibility?: boolean}} [options]
     */
    unhover(options) {
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

    /**
     * @param {Route} route
     * @param {LineCoords} coords
     * @returns {L.Layer}
     */
    renderFocusOutline(route, coords) {
      const focusOutline = L.polyline(
        coords,
        this.getStyle(route.info, { variant: 'focus' })
      );
      return focusOutline;
    }

    /**
     * @param {RouteInfo} info
     * @param {LineCoords} coords
     * @returns {L.Polyline}
     */
    renderFadeLine(info, coords) {
      const fadeLine = L.polyline(
        coords,
        this.getStyle(info, { variant: 'fade' })
      );
      return fadeLine;
    }

    /**
     * @param {L.LatLng} coord
     * @param {RouteInfo} info
     */
    renderHoverPopup(coord, info) {
      const popup = L.popup(
        coord,
        UptrackMapManager.getPopupOptions(info)
      ).addTo(this.map);
      return popup;
    }

    /**
     * @param {RouteInfo} info
     * @returns {L.PopupOptions}
     */
    static getPopupOptions(info) {
      return {
        closeButton: false,
        content: info.post_title,
        // "Higher" `y` offset (default is 7) so that the popup sits above the line.
        offset: [0, 2],
        className: 'uptrack-hover-popup',
      };
    }

    /**
     * @param {L.Popup} popup
     * @param {RouteId} routeId
     */
    addPopupListeners(popup, routeId) {
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
    renderEndpointMarkers(coords) {
      if (coords.length === 0) {
        return null;
      }

      /** @type {L.CircleMarker[]} */
      const markers = [];

      const c0 = coords[0];

      /** @type {L.CircleMarker | undefined} */
      let endMarker;
      if (coords.length > 1) {
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

    /**
     * @param {UptrackRouteType} type
     */
    updateRouteTypeFilter(type) {
      const typeEnabled = !this.routeTypeFilter[type];
      this.routeTypeFilter[type] = typeEnabled;

      this.applyVisibility();
    }

    applyVisibility() {
      const focusId = this.focus?.id;
      const hoverId = this.hover?.id;
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

    /**
     * @param {Array<L.Layer | null | undefined>} layers
     */
    _showLayers(...layers) {
      const map = this.map;
      for (const layer of layers) {
        if (layer && !map.hasLayer(layer)) {
          map.addLayer(layer);
        }
      }
    }

    /**
     * @param {Array<L.Layer | null | undefined>} layers
     */
    _hideLayers(...layers) {
      const map = this.map;
      for (const layer of layers) {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    }

    /**
     * @param {string} kmlText
     * @returns {geojson.GeoJSON}
     */
    static parseKml(kmlText) {
      const xml = new DOMParser().parseFromString(kmlText, 'text/xml');
      // @ts-ignore -- See tmcw_togeojson
      return window.toGeoJSON.kml(xml);
    }
  }

  // ===============================================================================================
  // Legend
  // ===============================================================================================

  /**
   * Reuses the built-in Layers control, with some customized styling to get colored checkboxes,
   * but exposes the built-in click handlers so that we can manage our own damn state.
   * The built-in Layers control doesn't play well with our route focusing logic.
   */
  class Legend extends L.Control.Layers {
    /** @type {((routeType: UptrackRouteType) => void) | undefined} */
    onInputClick = undefined;

    /**
     * @param {L.Map} map
     */
    static create(map) {
      const data = Object.fromEntries(
        Object.entries(ROUTE_TYPE_PROPS).map(([type, props]) => {
          const html = `<span data-route-type="${type}" data-color="${props.color}" class="uptrack-legend-text">${props.label}</span>`;
          // Create dummy groups to populate the legend.
          return [html, L.featureGroup().addTo(map)];
        })
      );

      const control = new Legend(undefined, data, {
        collapsed: true,
        position: 'topleft',
      });
      control.addTo(map);
      return control;
    }

    /**
     * @param {L.Map} map
     */
    onAdd(map) {
      const container = super.onAdd?.(map);
      if (!container) {
        throw err('Expected L.Control.Layers.onAdd to return a container');
      }

      container.querySelectorAll('.uptrack-legend-text').forEach((elem) => {
        const span = /** @type {HTMLSpanElement} */ (elem);
        const input = span.parentElement?.parentElement?.querySelector('input');

        input?.style.setProperty('color', span.getAttribute('data-color'));

        const routeType = /** @type {UptrackRouteType} */ (
          span.getAttribute('data-route-type')
        );
        input?.addEventListener('click', () => {
          this.onInputClick?.(routeType);
        });
      });

      return container;
    }

    /**
     * @param {boolean} disabled
     */
    disableInputs(disabled) {
      const container = this.getContainer();
      if (disabled) {
        container?.classList.add('hidden');
      } else {
        container?.classList.remove('hidden');
      }

      // container?.querySelectorAll('input').forEach((input) => {
      //   input.disabled = disabled;
      // });
    }

    _checkDisabledLayers() {
      // No-op to disable built-in disabling logic.
    }
  }

  // ===============================================================================================
  // Focus Card
  // ===============================================================================================
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

  /**
   * @typedef {Object} DragState
   * @property {number} delta
   * @property {number} x0
   */

  /**
   * Focus card control.
   * This is *not* implemented as a Leaflet Control because:
   * - We want it to take the full width and it's awkward to do that with Leaflet's CSS and DOM hierarchy.
   * - We don't want to be able to drag the map "through" the card, which prevents things like
   *   text selection.
   */
  class FocusCard {
    /** @type {(() => void) | undefined} */
    onClose = undefined;

    constructor() {
      this.$htmlTemplate = document.createElement('template');
      this.$htmlTemplate.innerHTML = FOCUS_CARD_HTML.trim();

      /**
       * @typedef {Object} FocusCardElements
       * @property {HTMLElement} $container
       * @property {HTMLElement} $title
       * @property {HTMLButtonElement} $closeButton
       * @property {HTMLElement} $distance
       * @property {HTMLElement} $duration
       * @property {HTMLElement} $elevation
       */
      /** @type {FocusCardElements | undefined} */
      this.$elements = undefined;

      /** @type {RouteInfo | undefined} */
      this.routeInfo = undefined;

      /** @type {undefined | DragState} */
      this.dragState = undefined;

      this.shown = false;
    }

    /**
     * @param {L.Map} map
     * @param {RouteInfo} info
     */
    show(map, info) {
      this.routeInfo = info;

      if (!this.shown) {
        const $container = this._render(map);
        this._correctAdminBarMargin($container);
      } else {
        // No need to call this above, since we call `_update` in `onAdd`.
        this._update();
      }
    }

    /**
     * @param {L.Map} map
     */
    hide(map) {
      const { $container } = this.$elements ?? {};
      if ($container) {
        $container.remove();
        this.$elements = undefined;
      }
      this.shown = false;
      document.removeEventListener('keyup', this._handleDocumentKeyup);
    }

    /**
     * @param {L.Map} map
     * @returns
     */
    _render(map) {
      /**
       * @template {keyof HTMLElementTagNameMap} T
       * @param {T} _elemType
       * @param {string} selector
       * @param {HTMLElement | DocumentFragment} $parent
       * @returns {HTMLElementTagNameMap[T]}
       */
      function getElem(_elemType, selector, $parent) {
        const $elem = $parent.querySelector(selector);
        if (!$elem) {
          log('error', 'Missing element for selector', selector, 'in', $parent);
          throw err(`Missing element for selector ${selector}`);
        } else {
          return /** @type {any} */ ($elem);
        }
      }

      const $fragment = /** @type {DocumentFragment} */ (
        this.$htmlTemplate.content.cloneNode(true)
      );
      const $container = getElem('div', '.uptrack-focus-card', $fragment);
      if (!$container) {
        throw err('Template missing .uptrack-focus-card container');
      }
      // const parent = map
      //   .getContainer()
      //   .querySelector('.leaflet-control-container');
      // if (!parent) {
      //   throw err('Map is missing .leaflet-control-container');
      // }
      // parent.appendChild($container);
      document.body.appendChild($container);

      const $title = getElem('span', '.uptrack-focus-card-title', $container);
      const $closeButton = getElem(
        'button',
        '[data-target="closeButton"]',
        $container
      );
      const $distance = getElem('span', '[data-target="distance"]', $container);
      const $elevation = getElem(
        'span',
        '[data-target="elevation"]',
        $container
      );
      const $duration = getElem('span', '[data-target="duration"]', $container);

      $closeButton.addEventListener('click', () => {
        this.onClose?.();
      });
      $container.addEventListener('touchstart', this._handleTouchStart);
      $container.addEventListener('touchmove', this._handleTouchMove);
      $container.addEventListener('touchend', this._handleTouchEnd);
      $container.addEventListener('touchcancel', this._handleTouchCancel);

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

      document.addEventListener('keyup', this._handleDocumentKeyup);

      return $container;
    }

    /** Updates most DOM elements based on the route info. */
    _update() {
      const info = this.routeInfo;
      if (!info) {
        return;
      }
      const { $title, $distance, $duration, $elevation } = this._getElements();

      $title.textContent = info.post_title;
      $title.setAttribute('href', info.post_url);

      $distance.textContent = info.distance_km.toFixed(0);
      $elevation.textContent = info.elevation_m.toFixed(0);
      $duration.textContent = info.duration_d.toFixed(0);
    }

    /**
     * @param {KeyboardEvent} evt
     */
    _handleDocumentKeyup = (evt) => {
      if (evt.key === 'Escape') {
        this.onClose?.();
      }
    };

    /**
     * @param {TouchEvent} evt
     */
    _handleTouchStart = (evt) => {
      this._updateDrag({ delta: 0, x0: evt.touches[0].clientX });
    };

    /**
     * @param {TouchEvent} evt
     */
    _handleTouchMove = (evt) => {
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

    /**
     * @param {TouchEvent} evt
     */
    _handleTouchEnd = (evt) => {
      if (!this.dragState) {
        return;
      }
      const { delta } = this.dragState;
      if (Math.abs(delta) > FOCUS_CARD_SWIPE_DISTANCE_PX) {
        this.onClose?.();
      }
      this._updateDrag(undefined);
    };

    /**
     * @param {TouchEvent} evt
     */
    _handleTouchCancel = (evt) => {
      if (!this.dragState) {
        return;
      }
      window.alert('touch cancel');
      this._updateDrag(undefined);
    };

    /**
     * @param {DragState | undefined} dragState
     */
    _updateDrag(dragState) {
      const { $container } = this._getElements();
      this.dragState = dragState;

      const style = $container.style;
      if (dragState) {
        const { delta } = dragState;
        style.transform = `translateX(${delta}px)`;
        style.transition = '';
        style.opacity = (
          1 -
          Math.abs(delta) / FOCUS_CARD_SWIPE_DISTANCE_PX
        ).toString();
      } else {
        style.transform = '';
        style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        style.opacity = '1.0';
      }
    }

    _getElements() {
      if (!this.$elements) {
        throw err('FocusCard elements not initialized');
      }
      return this.$elements;
    }

    /**
     * @param {HTMLElement} $container
     */
    _correctAdminBarMargin($container) {
      const $adminBar = document.querySelector('#wpadminbar');
      if (!$adminBar) {
        return;
      }
      const adminBarHeight = $adminBar.clientHeight;
      // 10px is the default marginBottom
      const offset = adminBarHeight + 10;
      $container.style.marginBottom = `${offset}px`;
    }
  }

  // ===============================================================================================
  // Entrypoint
  // ===============================================================================================
  /**
   * @param {RouteInfo[]} data
   */
  function renderUptrackMap(data) {
    /** @type {L.Map} */
    // @ts-ignore
    const map = window.WPLeafletMapPlugin.getCurrentMap();

    const mgr = new UptrackMapManager(map);
    void mgr.loadRoutes(data);
  }

  // @ts-ignore
  window.UptrackMapPlugin = { render: renderUptrackMap };
})();
