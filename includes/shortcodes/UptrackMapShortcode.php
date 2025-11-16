<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}


class UptrackMapShortCode
{
    public static function render()
    {
        $settings = Settings::get_settings();
        $kml_directory = $settings[Settings::$SETTING_KML_DIRECTORY];
        $routes = $settings[Settings::$SETTING_ROUTES];

        $post_map = self::collect_posts($routes);
        $data = self::prepare_data($kml_directory, $routes, $post_map);
        self::enqueue_assets($data);

        return "";
    }

    private static function collect_posts($routes)
    {
        global $wpdb;

        if (empty($routes)) {
            return [];
        }

        // Collect post IDs.
        $post_ids = [];
        foreach ($routes as $info) {
            $post_id = $info["postId"];
            $post_ids[] = $post_id;
        }

        // Query posts.
        $posts = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT ID, post_title, post_status
                 FROM {$wpdb->posts}
                 WHERE ID IN (" . implode(',', array_fill(0, count($post_ids), '%d')) . ")",
                ...$post_ids
            )
        );

        // Map by ID.
        $post_map = [];
        foreach ($posts as $post) {
            $post_map[$post->ID] = $post;
        }

        return $post_map;
    }

    private static function prepare_data($kml_directory, $routes, $post_map)
    {
        $data = [];
        foreach ($routes as $info) {
            // SYNC [UptrackRoutesSettingItem].
            $filename = $info["kmlFilename"];
            $post_id = $info["postId"];
            $type = $info["type"];
            $marker = $info["marker"];
            $distance = $info["distance"];
            $elevation = $info["elevation"];
            $duration = $info["duration"];

            $relative_path = $kml_directory . '/' . $filename;
            $file_path = WP_CONTENT_DIR . '/' . $relative_path;
            if (!file_exists($file_path)) {
                continue;
            }
            $kml_url = \content_url($relative_path);

            if (empty($post_id)) {
                $post_title = '';
                $post_url = '';
            } else {
                $post = $post_map[$post_id];
                if ($post->post_status !== 'publish') {
                    continue;
                }

                $post_title = $post->post_title;
                $post_url = \get_permalink($post);
            }

            // SYNC [RouteInfo].
            $data[] = [
                'id' => $filename,
                'kmlUrl' => $kml_url,
                'type' => $type,
                'marker' => $marker,
                'postUrl' => $post_url,
                'postTitle' => $post_title,
                'distance' => $distance,
                'elevation' => $elevation,
                'duration' => $duration,
            ];
        }
        return $data;
    }

    private static function enqueue_assets($data)
    {
        $version    = UPTRACK_MAP__PLUGIN_VERSION;

        // [require-wp-leaflet-map] [wp-leaflet-toGeoJSON]
        \wp_enqueue_script('leaflet_ajax_geojson_js');

        $script_name = 'uptrack-map';
        $script_url = \plugins_url('js/uptrack-map.js', UPTRACK_MAP__PLUGIN_FILE);
        \wp_register_script(
            $script_name,
            $script_url,
            [],
            $version,
            true
        );
        \wp_enqueue_script($script_name);
        // SYNC [UptrackMapShortcodeInput]
        $input = \wp_json_encode($data, JSON_UNESCAPED_SLASHES);
        \wp_add_inline_script(
            $script_name,
            // SYNC [UptrackMapPlugin]
            'window.UptrackMapPlugin.render(' . $input . ')',
        );

        $css_name = 'uptrack-map';
        $css_url = \plugins_url('css/uptrack-map.css', UPTRACK_MAP__PLUGIN_FILE);
        \wp_register_style(
            $css_name,
            $css_url,
            [],
            $version
        );
        \wp_enqueue_style($css_name);
    }
}
