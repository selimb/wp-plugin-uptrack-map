(function (L) {
  'use strict';

  function log(level, ...args) {
    console[level]("[UptrackMap]", ...args);
  }
  function err(message, options) {
    return new Error(`[UptrackMap] ${message}`, options);
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  const CANVAS_TOLERANCE = 14;
  const ROUTE_STYLES = {
    normal: {
      opacity: 1,
      weight: 3,
      interactive: true
    },
    focus: {
      opacity: 0.2,
      weight: 12,
      interactive: false
    },
    fade: {
      opacity: 0.3,
      weight: 3,
      interactive: true
    }
  };
  const ROUTE_MARKER_RADIUS_PX = 6;
  const ROUTE_MARKER_WEIGHT_PX = 2;
  const ROUTE_MARKER_COLOR = "black";
  const ROUTE_MARKER_FILL_OPACITY = 1;
  const ROUTE_MARKER_START_FILL_COLOR = "limegreen";
  const ROUTE_MARKER_END_FILL_COLOR = "orangered";
  const ROUTE_MARKER_ROUNDTRIP_FILL_COLOR = "black";
  const ROUNDTRIP_EPSILON = 50;
  const FOCUS_CARD_SWIPE_DISTANCE_PX = (() => {
    const smallestDimension = Math.min(window.innerWidth, window.innerHeight);
    const distance = smallestDimension * 0.4;
    return clamp(distance, 150, 400);
  })();
  const ROUTE_TYPE_PROPS = {
    ski_touring: {
      label: "Ski Touring",
      color: "blue"
    },
    mountaineering: {
      label: "Mountaineering",
      color: "red"
    },
    hiking: {
      label: "Hiking",
      color: "green"
    }
  };

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
  function getElem(_elemType, selector, $parent) {
    const $elem = $parent.querySelector(selector);
    if ($elem) {
      return $elem;
    } else {
      log("error", "Missing element for selector", selector, "in", $parent);
      throw err(`Missing element for selector ${selector}`);
    }
  }
  class FocusCard {
    onClose = void 0;
    $htmlTemplate;
    $elements = void 0;
    routeInfo = void 0;
    dragState = void 0;
    shown = false;
    constructor() {
      this.$htmlTemplate = document.createElement("template");
      this.$htmlTemplate.innerHTML = FOCUS_CARD_HTML.trim();
    }
    show(info) {
      this.routeInfo = info;
      if (this.shown) {
        this._update();
      } else {
        const $container = this._render();
        this._correctAdminBarMargin($container);
      }
    }
    hide(_map) {
      const { $container } = this.$elements ?? {};
      if ($container) {
        $container.remove();
        this.$elements = void 0;
      }
      this.shown = false;
      document.removeEventListener("keyup", this._handleDocumentKeyup);
    }
    _render() {
      const $fragment = this.$htmlTemplate.content.cloneNode(
        true
      );
      const $container = getElem("div", ".uptrack-focus-card", $fragment);
      document.body.append($container);
      const $title = getElem("span", ".uptrack-focus-card-title", $container);
      const $closeButton = getElem(
        "button",
        '[data-target="closeButton"]',
        $container
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
        $duration
      };
      this.shown = true;
      this._update();
      document.addEventListener("keyup", this._handleDocumentKeyup);
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
      $title.setAttribute("href", info.post_url);
      $distance.textContent = info.distance_km.toFixed(0);
      $elevation.textContent = info.elevation_m.toFixed(0);
      $duration.textContent = info.duration_d.toFixed(0);
    }
    _handleDocumentKeyup = (evt) => {
      if (evt.key === "Escape") {
        this.onClose?.();
      }
    };
    _handleTouchStart = (evt) => {
      this._updateDrag({ delta: 0, x0: evt.touches[0].clientX });
    };
    _handleTouchMove = (evt) => {
      if (!this.dragState) {
        return;
      }
      evt.stopPropagation();
      const x0 = this.dragState.x0;
      const x1 = evt.touches[0].clientX;
      const delta = x1 - x0;
      if (delta === 0) {
        return;
      }
      this._updateDrag({ delta, x0 });
    };
    _handleTouchEnd = (_evt) => {
      if (!this.dragState) {
        return;
      }
      const { delta } = this.dragState;
      if (Math.abs(delta) > FOCUS_CARD_SWIPE_DISTANCE_PX) {
        this.onClose?.();
      }
      this._updateDrag(void 0);
    };
    _handleTouchCancel = (_evt) => {
      if (!this.dragState) {
        return;
      }
      this._updateDrag(void 0);
    };
    _updateDrag(dragState) {
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
    _getElements() {
      if (!this.$elements) {
        throw err("FocusCard elements not initialized");
      }
      return this.$elements;
    }
    _correctAdminBarMargin($container) {
      const $adminBar = document.querySelector("#wpadminbar");
      if (!$adminBar) {
        return;
      }
      const adminBarHeight = $adminBar.clientHeight;
      const offset = adminBarHeight + 10;
      $container.style.marginBottom = `${offset}px`;
    }
  }

  class Legend extends L.Control.Layers {
    onInputClick = void 0;
    static create(map) {
      const data = Object.fromEntries(
        Object.entries(ROUTE_TYPE_PROPS).map(([type, props]) => {
          const html = `<span data-route-type="${type}" data-color="${props.color}" class="uptrack-legend-text">${props.label}</span>`;
          return [html, L.featureGroup().addTo(map)];
        })
      );
      const control = new Legend(void 0, data, {
        collapsed: true,
        position: "topleft"
      });
      control.addTo(map);
      return control;
    }
    onAdd(map) {
      const container = super.onAdd?.(map);
      if (!container) {
        throw err("Expected L.Control.Layers.onAdd to return a container");
      }
      for (const elem of container.querySelectorAll(".uptrack-legend-text")) {
        const span = (
          /** @type {HTMLSpanElement} */
          elem
        );
        const input = span.parentElement?.parentElement?.querySelector("input");
        input?.style.setProperty("color", span.getAttribute("data-color"));
        const routeType = span.getAttribute("data-route-type");
        input?.addEventListener("click", () => {
          this.onInputClick?.(routeType);
        });
      }
      return container;
    }
    disableInputs(disabled) {
      const container = this.getContainer();
      container?.classList.toggle("hidden", disabled);
    }
    _checkDisabledLayers() {
    }
  }

  class UptrackMapManager {
    map;
    renderer;
    groupRoot;
    routes;
    focusCard;
    legend;
    focus = void 0;
    hover = void 0;
    routeTypeFilter = {
      ski_touring: true,
      hiking: true,
      mountaineering: true
    };
    constructor(map) {
      this.map = map;
      this.renderer = L.canvas({ tolerance: CANVAS_TOLERANCE });
      this.groupRoot = L.featureGroup();
      this.groupRoot.addTo(this.map);
      this.routes = /* @__PURE__ */ new Map();
      this.focusCard = new FocusCard();
      this.focusCard.onClose = () => {
        this.unfocus();
      };
      this.legend = Legend.create(this.map);
      this.legend.onInputClick = (routeType) => {
        this.updateRouteTypeFilter(routeType);
      };
    }
    getStyle(info, options = {}) {
      const { variant: variantKey = "normal" } = options;
      const variant = ROUTE_STYLES[variantKey];
      const color = ROUTE_TYPE_PROPS[info.type].color;
      return {
        color,
        opacity: variant.opacity,
        weight: variant.weight,
        interactive: variant.interactive,
        renderer: this.renderer
      };
    }
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
            endpoints: void 0,
            focusOutline: void 0
          });
        })
      );
      map.fitBounds(this.groupRoot.getBounds());
    }
    async loadRoute(info) {
      let marker = null;
      let fadeLine_;
      let coords;
      const routeId = info.id;
      const options = {
        style: this.getStyle(info),
        onEachFeature: (_feature, createdLayer) => {
          if (!(createdLayer instanceof L.Polyline)) {
            log("warn", "Found non-Polyline feature in route.", {
              info,
              createdLayer
            });
            return;
          }
          const polyline = createdLayer;
          coords = polyline.getLatLngs();
          polyline.on("click", (evt) => {
            this.handleRouteClick(evt, routeId);
          });
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
        }
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
    static createRouteMarker(info, lineCoords) {
      if (info.marker_distance_percent < 0) {
        return null;
      }
      if (lineCoords.length === 0) {
        return null;
      }
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
    static computeMarkerCoords(lineCoords, info) {
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
      const targetDistance = info.marker_distance_percent / 100 * distanceTotal;
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
      log("warn", "Could not determine marker coordinates.", info);
      return lineCoords[0];
    }
    handleRouteClick(_evt, routeId) {
      this.focusRoute(routeId);
    }
    handleRouteLineMouseover(evt, routeId, polyline) {
      this.hoverRoute(routeId, {
        type: "coord",
        coord: this.map.layerPointToLatLng(
          polyline.closestLayerPoint(evt.layerPoint)
        )
      });
    }
    handleRouteMarkerMouseover(_evt, routeId, marker) {
      this.hoverRoute(routeId, { type: "marker", marker });
    }
    handleRouteLineMouseout(_evt, _routeId) {
      if (!this.hover) {
        return;
      }
      this.unhover();
    }
    handleRouteMarkerMouseout(_evt, _routeId, _marker) {
      if (!this.hover) {
        return;
      }
      this.unhover();
    }
    focusRoute(routeId) {
      const route = this.routes.get(routeId);
      if (!route) {
        log("error", "Could not find route with ID", routeId);
        return;
      }
      this.unhover({ applyVisibility: false });
      if (this.focus?.id === routeId) {
        return;
      }
      if (route.endpoints === void 0) {
        route.endpoints = this.renderEndpointMarkers(route.coords);
      }
      this._showLayers(route.endpoints);
      if (route.focusOutline === void 0) {
        route.focusOutline = this.renderFocusOutline(route, route.coords);
      }
      this._showLayers(route.focusOutline);
      this.unfocus({ applyVisibility: false });
      this.focus = { id: routeId };
      this.applyVisibility();
      this.legend.disableInputs(true);
      this.focusCard.show(route.info);
    }
    unfocus(options) {
      if (!this.focus) {
        return;
      }
      const { applyVisibility = true } = options ?? {};
      const route = this.routes.get(this.focus.id);
      this._hideLayers(route?.focusOutline, route?.endpoints);
      this.focus = void 0;
      if (applyVisibility) {
        this.applyVisibility();
        this.legend.disableInputs(false);
        this.focusCard.hide(this.map);
      }
    }
    hoverRoute(routeId, popupOption) {
      if (this.focus?.id === routeId) {
        return;
      }
      const route = this.routes.get(routeId);
      if (!route) {
        log("error", "Could not find route with ID", routeId);
        return;
      }
      let popup;
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
      if (route.endpoints === void 0) {
        route.endpoints = this.renderEndpointMarkers(route.coords);
      }
      this._showLayers(route.endpoints);
      if (route.focusOutline === void 0) {
        route.focusOutline = this.renderFocusOutline(route, route.coords);
      }
      this._showLayers(route.focusOutline);
      this.unhover({ applyVisibility: false });
      this.hover = { id: routeId, popup };
      this.applyVisibility();
    }
    unhover(options) {
      if (!this.hover) {
        return;
      }
      const { applyVisibility = true } = options ?? {};
      const route = this.routes.get(this.hover.id);
      this._hideLayers(this.hover.popup, route?.focusOutline, route?.endpoints);
      this.hover = void 0;
      if (applyVisibility) {
        this.applyVisibility();
      }
    }
    renderFocusOutline(route, coords) {
      const focusOutline = L.polyline(
        coords,
        this.getStyle(route.info, { variant: "focus" })
      );
      return focusOutline;
    }
    renderFadeLine(info, coords) {
      const fadeLine = L.polyline(
        coords,
        this.getStyle(info, { variant: "fade" })
      );
      return fadeLine;
    }
    renderHoverPopup(coord, info) {
      const popup = L.popup(coord, UptrackMapManager.getPopupOptions(info)).addTo(
        this.map
      );
      return popup;
    }
    static getPopupOptions(info) {
      return {
        closeButton: false,
        content: info.post_title,
        // "Higher" `y` offset (default is 7) so that the popup sits above the line.
        offset: [0, 2],
        className: "uptrack-hover-popup"
      };
    }
    addPopupListeners(_popup, _routeId) {
    }
    /**
     * @param {LineCoords} coords
     * @returns {L.FeatureGroup | null}
     */
    renderEndpointMarkers(coords) {
      if (coords.length === 0) {
        return null;
      }
      const markers = [];
      const c0 = coords[0];
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
            interactive: false
          });
          markers.push(endMarker);
        }
      }
      const startMarker = L.circleMarker(c0, {
        radius: ROUTE_MARKER_RADIUS_PX,
        color: ROUTE_MARKER_COLOR,
        weight: ROUTE_MARKER_WEIGHT_PX,
        fillColor: endMarker ? ROUTE_MARKER_START_FILL_COLOR : ROUTE_MARKER_ROUNDTRIP_FILL_COLOR,
        fillOpacity: ROUTE_MARKER_FILL_OPACITY,
        interactive: false
      });
      markers.push(startMarker);
      const group = L.featureGroup(markers);
      return group;
    }
    updateRouteTypeFilter(type) {
      const typeEnabled = !this.routeTypeFilter[type];
      this.routeTypeFilter[type] = typeEnabled;
      this.applyVisibility();
    }
    applyVisibility() {
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
    _showLayers(...layers) {
      const map = this.map;
      for (const layer of layers) {
        if (layer && !map.hasLayer(layer)) {
          map.addLayer(layer);
        }
      }
    }
    _hideLayers(...layers) {
      const map = this.map;
      for (const layer of layers) {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    }
    static parseKml(kmlText) {
      const xml = new DOMParser().parseFromString(kmlText, "text/xml");
      return window.toGeoJSON.kml(xml);
    }
  }

  function renderUptrackMap(data) {
    const map = window.WPLeafletMapPlugin.getCurrentMap();
    const mgr = new UptrackMapManager(map);
    void mgr.loadRoutes(data);
  }
  window.UptrackMapPlugin = { render: renderUptrackMap };

})(L);
