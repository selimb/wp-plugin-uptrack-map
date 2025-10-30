// @ts-check
'use strict';

/** @import L from "leaflet" */

/**
 * SYNC [sync-UptrackLayerType]
 * @typedef {"ski_touring" | "mountaineering" | "hiking"} UptrackLayerType
 */

/**
 * SYNC [sync-UptrackMapInput]
 * @typedef {Object} UptrackMapInput
 * @property {string} kml_url
 * @property {UptrackLayerType} type
 * @property {string} post_url
 * @property {string} post_title
 * @property {number} distance_km
 * @property {number} elevation_m
 * @property {number} duration_d
 */

(function () {
  /** @type {Record<UptrackLayerType, {label: string, color: string}>} */
  const LAYER_TYPE_PROPS = {
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

  /**
   * @param {UptrackMapInput[]} data
   */
  function renderUptrackMap(data) {
    /** @type {L.Map} */
    // @ts-ignore
    const map = window.WPLeafletMapPlugin.getCurrentMap();

    const groupRoot = L.featureGroup();
    groupRoot.addTo(map);

    /** @type {Record<UptrackLayerType, L.FeatureGroup>} */
    const groups = {
      ski_touring: L.featureGroup(),
      mountaineering: L.featureGroup(),
      hiking: L.featureGroup(),
    };
    for (const group of Object.values(groups)) {
      group.addTo(groupRoot);
    }

    /** @type {Array<{layer: L.Layer, info: UptrackMapInput}>} */
    const layers = [];

    /** @type {Array<Promise<void>>} */
    const readyPromises = [];

    for (const info of data) {
      const { layer, ready } = renderKmlLayer(info);
      const group = groups[info.type] ?? groups.ski_touring;
      layer.addTo(group);
      layers.push({ layer, info });

      readyPromises.push(ready);
    }

    void Promise.all(readyPromises).then(() => {
      map.fitBounds(groupRoot.getBounds());
    });

    renderLegend(map, groups);
  }

  /**
   * @param {UptrackMapInput} info
   * @returns { { layer: L.Layer, ready: Promise<void> } }
   */
  function renderKmlLayer(info) {
    const {
      kml_url,
      post_url,
      post_title,
      distance_km,
      elevation_m,
      duration_d,
    } = info;

    /** @type {L.GeoJSONOptions & {type: 'kml'}} */
    const options = {
      type: 'kml',
      style: getStyle(info),
    };

    /** @type {L.Layer} */
    // @ts-ignore
    const layer = L.ajaxGeoJson(kml_url, options);

    /** @type {Promise<void>} */
    const ready = new Promise((resolve) => {
      layer.on('ready', () => {
        resolve();
      });
    });

    return { layer, ready };
  }

  /** @type {Record<UptrackLayerType, string} */
  const TYPE_MAP = {
    ski_touring: 'blue',
    mountaineering: 'red',
    hiking: 'green',
  };

  /**
   * @param {UptrackMapInput} info
   * @returns {L.GeoJSONOptions['style']}
   */
  function getStyle(info) {
    const color = TYPE_MAP[info.type] ?? 'blue';
    return { color };
  }

  class Legend extends L.Control.Layers {
    onAdd(map) {
      // @ts-ignore
      const container = super.onAdd(map);
      container.querySelectorAll('.uptrack-legend-text').forEach((elem) => {
        const span = /** @type {HTMLSpanElement} */ (elem);
        const input = span.parentElement?.parentElement?.querySelector('input');
        input?.style.setProperty('color', span.getAttribute('data-color'));
      });

      return container;
    }
  }

  /**
   * @param {L.Map} map
   * @param {Record<UptrackLayerType, L.FeatureGroup>} groups
   * @returns {void}
   */
  function renderLegend(map, groups) {
    const data = Object.fromEntries(
      Object.entries(groups).map(([type, group]) => {
        const props = LAYER_TYPE_PROPS[type];
        const html = `<span data-color="${props.color}" class="uptrack-legend-text">${props.label}</span>`;
        return [html, group];
      })
    );

    const layerControl = new Legend(undefined, data, {
      collapsed: true,
      position: 'topleft',
    });
    layerControl.addTo(map);
  }

  // @ts-ignore
  window.UptrackMapPlugin = { render: renderUptrackMap };
})();
