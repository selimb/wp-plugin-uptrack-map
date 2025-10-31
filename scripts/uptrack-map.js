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
  const ROUTE_LINE_WEIGHT = 3;
  const ROUTE_OUTLINE_WEIGHT = 12;
  const ROUTE_OUTLINE_OPACITY = 0.2;
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
   * @typedef {Object} Route
   * @property {RouteInfo} info
   * @property {L.Layer} line
   * @property {L.Marker | undefined} marker
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

      this.focusCard = new FocusCard({ position: 'bottomleft' });
      this.focusCard.onClose = () => {
        this.unfocus();
      };

      /**
       * @typedef {Object} FocusState
       * @property {RouteId} id
       * @property {L.Layer} outlineLayer
       * @property {L.Popup | undefined} popup
       * @property {"hover" | "click"} type
       */
      /** @type {FocusState | undefined} */
      this.focus = undefined;

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
     * @param {{outline?: boolean}} options
     * @returns {L.PathOptions}
     */
    static getStyle(info, options = {}) {
      const { outline = false } = options;
      const color = ROUTE_TYPE_PROPS[info.type].color ?? 'blue';
      return {
        color,
        opacity: outline ? ROUTE_OUTLINE_OPACITY : 1.0,
        weight: outline ? ROUTE_OUTLINE_WEIGHT : ROUTE_LINE_WEIGHT,
        // Set interactive `false` so that we don't have to setup click handlers.
        interactive: outline ? false : true,
      };
    }

    /**
     * @param {RouteInfo[]} data
     */
    async loadRoutes(data) {
      const map = this.map;

      await Promise.all(
        data.map(async (info) => {
          const { line, marker } = await this.loadRoute(info);

          this.routes.set(info.id, { info, line, marker });
        })
      );

      map.fitBounds(this.groupRoot.getBounds());
    }

    /**
     * @param {RouteInfo} info
     */
    async loadRoute(info) {
      /** @type {L.Marker | undefined} */
      let marker;
      const routeId = info.id;

      /** @type {L.GeoJSONOptions & {renderer: L.Renderer}} */
      const options = {
        style: UptrackMapManager.getStyle(info),
        onEachFeature: (_feature, createdLayer) => {
          if (!(createdLayer instanceof L.Polyline)) {
            log('warn', 'Found non-Polyline feature in route.', {
              info,
              createdLayer,
            });
            return;
          }

          createdLayer.on('click', (evt) => {
            this.handleRouteClick(evt, routeId, createdLayer);
          });
          // [mobile-mouse] For some reason these are fired on mobile, which prevents the `click` event.
          if (!L.Browser.mobile) {
            createdLayer.on('mouseover', (evt) => {
              this.handleRouteMouseover(evt, routeId, createdLayer);
            });
            createdLayer.on('mouseout', (evt) => {
              this.handleRouteMouseout(evt, routeId, createdLayer);
            });
          }

          marker = UptrackMapManager.createRouteMarker(info, createdLayer);
          if (marker) {
            this.map.addLayer(marker);

            marker.on('click', (evt) => {
              this.handleRouteClick(evt, routeId, createdLayer);
            });
            // See [mobile-mouse].
            if (!L.Browser.mobile) {
              marker.on('mouseover', (evt) => {
                this.handleRouteMouseover(evt, routeId, createdLayer);
              });
              marker.on('mouseout', (evt) => {
                this.handleRouteMouseout(evt, routeId, createdLayer);
              });
            }
          }
        },
        renderer: this.renderer,
      };

      const resp = await fetch(info.kml_url);
      const kmlText = await resp.text();
      const geoJson = UptrackMapManager.parseKml(kmlText);
      const line = L.geoJSON(geoJson, options);
      this.groupRoot.addLayer(line);

      return { line, marker };
    }

    /**
     * @param {RouteInfo} info
     * @param {L.Polyline} polyline
     * @returns {L.Marker | undefined}
     */
    static createRouteMarker(info, polyline) {
      if (info.marker_distance_percent < 0) {
        return undefined;
      }

      // Assume we're dealing with a simple LineString.
      const lineCoords = /** @type {L.LatLng[]} */ (polyline.getLatLngs());
      if (lineCoords.length === 0) {
        return undefined;
      }

      /** @type {L.LatLng} */
      let markerCoords;
      if (info.marker_distance_percent === 0) {
        markerCoords = lineCoords[0];
      } else if (info.marker_distance_percent >= 100) {
        markerCoords = lineCoords[lineCoords.length - 1];
      } else {
        markerCoords = UptrackMapManager.findMarkerCoords(lineCoords, info);
      }
      const marker = L.marker(markerCoords);
      return marker;
    }

    /**
     * @param {L.LatLng[]} lineCoords
     * @param {RouteInfo} info
     * @returns {L.LatLng}
     */
    static findMarkerCoords(lineCoords, info) {
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
     * @param {L.Polyline} polyline
     */
    handleRouteClick(evt, routeId, polyline) {
      this.focusRoute(
        routeId,
        polyline,
        'click',
        this.map.layerPointToLatLng(polyline.closestLayerPoint(evt.layerPoint))
      );
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     * @param {L.Polyline} polyline
     */
    handleRouteMouseover(evt, routeId, polyline) {
      if (this.focus?.type === 'click') {
        return;
      }
      this.focusRoute(
        routeId,
        polyline,
        'hover',
        this.map.layerPointToLatLng(polyline.closestLayerPoint(evt.layerPoint))
      );
    }

    /**
     * @param {L.LeafletMouseEvent} evt
     * @param {RouteId} routeId
     * @param {L.Polyline} polyline
     */
    handleRouteMouseout(evt, routeId, polyline) {
      if (this.focus?.type !== 'hover') {
        return;
      }

      // Avoid unfocusing if the mouse is moving into the popup.
      const popup = this.focus.popup;
      if (popup) {
        const relatedTarget = evt.originalEvent.relatedTarget;
        if (relatedTarget instanceof HTMLElement) {
          if (popup.getElement()?.contains(relatedTarget)) {
            return;
          }
        }
      }

      this.unfocus();
    }

    /**
     * @param {RouteId} routeId
     * @param {L.Polyline} polyline
     * @param {'hover' | 'click'} type
     * @param {L.LatLng} coord
     */
    focusRoute(routeId, polyline, type, coord) {
      const route = this.routes.get(routeId);
      if (!route) {
        log('error', 'Could not find route with ID', routeId);
        return;
      }

      if (this.focus) {
        if (this.focus.id === routeId && this.focus.type === type) {
          return;
        }
        this._hideLayers(this.focus.outlineLayer, this.focus.popup);
      }

      const popup =
        type === 'hover'
          ? this.renderHoverPopup(routeId, polyline, coord, route.info)
          : undefined;

      this.focus = {
        id: routeId,
        outlineLayer: this.renderFocusLayer(route, polyline),
        type,
        popup,
      };

      if (type === 'click') {
        this.applyVisibility();
        this.legend.disableInputs(true);
        this.focusCard.show(this.map, route.info);
      }
    }

    unfocus() {
      if (!this.focus) {
        return;
      }
      this._hideLayers(this.focus.outlineLayer, this.focus.popup);
      this.focus = undefined;

      this.applyVisibility();
      this.legend.disableInputs(false);
      this.focusCard.hide(this.map);
    }

    /**
     * @param {Route} route
     * @param {L.Polyline} polyline
     * @returns {L.Layer}
     */
    renderFocusLayer(route, polyline) {
      const map = this.map;

      const coords = polyline.getLatLngs();
      const outlineLayer = L.polyline(
        // So weird.
        /** @type {any} */ (coords),
        UptrackMapManager.getStyle(route.info, { outline: true })
      );
      map.addLayer(outlineLayer);
      return outlineLayer;
    }

    /**
     * @param {RouteId} routeId
     * @param {L.Polyline} polyline
     * @param {L.LatLng} coord
     * @param {RouteInfo} info
     */
    renderHoverPopup(routeId, polyline, coord, info) {
      const popup = L.popup(coord, {
        closeButton: false,
        content: info.post_title,
        // "Higher" `y` offset (default is 7) so that the popup sits above the line.
        offset: [0, 2],
        className: 'uptrack-hover-popup',
      }).addTo(this.map);
      popup.getElement()?.addEventListener('click', () => {
        this.focusRoute(routeId, polyline, 'click', coord);
      });
      popup.getElement()?.addEventListener('mouseleave', () => {
        this.unfocus();
      });
      return popup;
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
      const focusedId = this.focus?.id;
      const routeTypeFilter = this.routeTypeFilter;
      for (const [routeId, route] of this.routes.entries()) {
        if (focusedId !== undefined) {
          if (routeId === focusedId) {
            this._showLayers(route.line, route.marker);
          } else {
            this._hideLayers(route.line, route.marker);
          }
        } else {
          const type = route.info.type;
          if (routeTypeFilter[type]) {
            this._showLayers(route.line, route.marker);
          } else {
            this._hideLayers(route.line, route.marker);
          }
        }
      }
    }

    /**
     * @param {Array<L.Layer | undefined>} layers
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
     * @param {Array<L.Layer | undefined>} layers
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
      container?.querySelectorAll('input').forEach((input) => {
        input.disabled = disabled;
      });
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
      <li> <span>Duration:</span>  <span data-target="distance"></span>  <span>days</span> </li>
      <li> <span>Distance:</span>  <span data-target="elevation"></span> <span>km</span> </li>
      <li> <span>Elevation:</span> <span data-target="duration"></span> <span>m</span> </li>
    </ul>
  <div>
</div>
  `;

  /**
   * @typedef {Object} DragState
   * @property {number} delta
   * @property {number} x0
   */
  class FocusCard extends L.Control {
    /** @type {(() => void) | undefined} */
    onClose = undefined;

    /**
     * @param {L.ControlOptions} options
     */
    constructor(options) {
      super(options);

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
        map.addControl(this);
        // Needs to be done *after* `addControl`, so that Leaflet adds our elements to the document.
        this._correctAdminBarMargin();
      } else {
        // No need to call this above, since we call `_update` in `onAdd`.
        this._update();
      }
    }

    /**
     * @param {L.Map} map
     */
    hide(map) {
      map.removeControl(this);
    }

    /**
     * Called by base class when this control is added.
     */
    onAdd() {
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
        throw err('Missing .uptrack-focus-card container');
      }

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

    /**
     * Called by base class when this control is removed.
     */
    onRemove() {
      this.shown = false;
      document.removeEventListener('keyup', this._handleDocumentKeyup);
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

    _correctAdminBarMargin() {
      const $adminBar = document.querySelector('#wpadminbar');
      if (!$adminBar) {
        return;
      }
      const $container = this.getContainer();
      if (!$container) {
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
