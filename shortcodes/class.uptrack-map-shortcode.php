<?php

/**
 * KML/KMZ Shortcode
 *
 * Use with [uptrack-map]
 *
 * @category Shortcode
 * @author   Selim Belhaouane <selim.belhaouane@gmail.com>
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

require_once LEAFLET_MAP__PLUGIN_DIR . 'shortcodes/class.shortcode.php';
require_once LEAFLET_MAP__PLUGIN_DIR . 'shortcodes/class.geojson-shortcode.php';

class Uptrack_Map_Shortcode extends Leaflet_Shortcode
{
    /**
     * Get uptrack map shortcode
     */
    protected function getHTML($atts = '', $content = null)
    {
        //
        wp_enqueue_script('leaflet_ajax_geojson_js');
        $fitbounds = true;

        $settings = Leaflet_Map_Plugin_Settings::init();
        $kml_directory = $settings->get('uptrack_kml_directory');
        $map_table = $settings->get('uptrack_map_table');

        if (empty($kml_directory) || empty($map_table)) {
            return '<p>Error: uptrack_kml_directory or uptrack_map_table options not configured.</p>';
        }

        // Collect posts.
        $post_ids = [];
        foreach ($map_table as $filename => $info) {
            $post_id = $info["post_id"];
            $post_ids[] = $post_id;
        }
        $posts = get_posts([
            'post__in' => $post_ids,
            'numberposts' => -1
        ]);
        $post_map = [];
        foreach ($posts as $post) {
            $post_map[$post->ID] = $post;
        }

        $data = [];
        foreach ($map_table as $filename => $info) {
            $relative_path = $kml_directory . '/' . $filename;
            $file_path = WP_CONTENT_DIR . '/' . $relative_path;
            if (!file_exists($file_path)) {
                echo '<p>Error: File ' . htmlspecialchars($file_path) . ' does not exist.</p>';
                continue;
            }
            $kml_url = content_url($relative_path);

            $post_id = $info["post_id"];
            $post = $post_map[$post_id];
            $post_title = $post->post_title;
            $post_url = get_permalink($post);

            // Add to array for JSON serialization
            $data[] = [
                'kml_url' => $kml_url,
                'post_url' => $post_url,
                'post_title' => $post_title,
                'distance_km' => $info["distance_km"],
                'elevation_m' => $info["elevation_m"],
                'duration_d' => $info["duration_d"],
            ];

            // XXX debugging
            echo '<p>' . htmlspecialchars($kml_url) . ' -> ' . htmlspecialchars($post_title) . ' at ' . htmlspecialchars($post_url) . '</p>';
        }

        ob_start();
?>/*<script>
    */
    const data = <?php echo json_encode($data); ?>;
    // XXX
    console.info(data);
    // XXX huh?
    const rewrite_keys = {
        stroke: 'color',
        'stroke-width': 'weight',
        'stroke-opacity': 'opacity',
        fill: 'fillColor',
        'fill-opacity': 'fillOpacity',
    };

    const map = window.WPLeafletMapPlugin.getCurrentMap();
    const group = L.featureGroup();

    const promises = [];
    for (const info of data) {
        const {
            kml_url,
            post_url,
            post_title
        } = info;
        // XXX
        console.info("adding layer", kml_url)
        const layer = L.ajaxGeoJson(kml_url, {
            type: 'kml',
            style: layerStyle,
            // XXX
            // onEachFeature: onEachFeature,
            pointToLayer: pointToLayer
        });
        layer.addTo(group);
        promises.push(new Promise((resolve) => {
            layer.on('ready', () => {
                resolve();
            })
        }))
    }
    group.addTo(map);

    Promise.all(promises).then(() => {
        // XXX
        console.info("fit bounds", group.getBounds());
        map.fitBounds(group.getBounds());
    })

    function layerStyle(feature) {
        const props = feature.properties || {};
        const style = {};

        function camelFun(_, first_letter) {
            return first_letter.toUpperCase();
        };
        for (const key in props) {
            if (key.match('-')) {
                const camelcase = key.replace(/-(\w)/, camelFun);
                style[camelcase] = props[key];
            }
            // rewrite style keys from geojson.io
            if (rewrite_keys[key]) {
                style[rewrite_keys[key]] = props[key];
            }
        }
        // XXX
        // return L.Util.extend(style, default_style);
        return style;
    }
    // XXX onEachFeature

    function pointToLayer(feature, latlng) {
        if (circleMarker) {
            return L.circleMarker(latlng);
        }
        return L.marker(latlng, markerOptions);
    }
    <?php
        $script = ob_get_clean();

        return $this->wrap_script($script, 'UptrackMapShortcode');
    }
}
