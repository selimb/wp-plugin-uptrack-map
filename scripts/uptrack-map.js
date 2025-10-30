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
  /**
   * @param {UptrackMapInput[]} data
   */
  function renderUptrackMap(data) {
    /** @type {L.Map} */
    // @ts-ignore
    const map = window.WPLeafletMapPlugin.getCurrentMap();
    const group = L.featureGroup();

    /** @type {Array<Promise<void>>} */
    const readyPromises = [];

    for (const info of data) {
      const { layer, ready } = renderKmlLayer(info);
      layer.addTo(group);
      readyPromises.push(ready);
    }
    group.addTo(map);

    void Promise.all(readyPromises).then(() => {
      map.fitBounds(group.getBounds());
    });
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

  // @ts-ignore
  window.UptrackMapPlugin = { render: renderUptrackMap };
})();
