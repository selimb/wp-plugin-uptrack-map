<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined("ABSPATH")) {
    exit();
}

class UptrackMapShortCode
{
    public static function render()
    {
        $settings = \get_options(Settings::ALL);
        // Relies on [php-default-kml-directory].
        $kml_directory = $settings[Settings::KML_DIRECTORY];
        // Relies on [php-default-routes].
        $routes = $settings[Settings::ROUTES];

        $post_map = self::collect_posts($routes);
        $routes_data = self::prepare_routes_data(
            $kml_directory,
            $routes,
            $post_map,
        );
        // SYNC [UptrackMapShortcodeInput]
        $data = [
            "routes" => $routes_data,
            Settings::FOCUS_CARD_HTML => $settings[Settings::FOCUS_CARD_HTML],
            Settings::MAP_STYLES => $settings[Settings::MAP_STYLES],
        ];

        self::enqueue_assets($data, $settings);

        return "";
    }

    private static function collect_posts($routes)
    {
        if (empty($routes)) {
            return [];
        }

        // Collect post IDs.
        $post_ids = [];
        foreach ($routes as $info) {
            $post_id = $info["postId"];
            $post_ids[] = $post_id;
        }

        $posts = \get_posts([
            "include" => $post_ids,
            "numberposts" => -1,
        ]);

        // Map by ID.
        $post_map = [];
        foreach ($posts as $post) {
            $post_map[$post->ID] = $post;
        }

        return $post_map;
    }

    private static function prepare_routes_data(
        $kml_directory,
        $routes,
        $post_map,
    ) {
        $data = [];
        foreach ($routes as $info) {
            // SYNC [UptrackRoutesSettingItem].
            $filename = $info["kmlFilename"];
            $post_id = $info["postId"];
            $title = $info["title"];
            $type = $info["type"];
            $marker = $info["marker"];
            $distance = $info["distance"];
            $elevation = $info["elevation"];
            $duration = $info["duration"];

            $relative_path = $kml_directory . "/" . $filename;
            $file_path = WP_CONTENT_DIR . "/" . $relative_path;
            if (!file_exists($file_path)) {
                continue;
            }
            $kml_url = \content_url($relative_path);

            if (empty($post_id)) {
                if (empty($title)) {
                    continue;
                }
                $post_title = $title;
                $post_url = "";
            } else {
                $post = $post_map[$post_id];
                if ($post->post_status !== "publish") {
                    continue;
                }

                $post_title = $post->post_title;
                $post_url = \get_permalink($post);
            }

            // SYNC [RouteInfo].
            $data[] = [
                "id" => $filename,
                "kmlUrl" => $kml_url,
                "type" => $type,
                "marker" => $marker,
                "url" => $post_url,
                "title" => $post_title,
                "distance" => $distance,
                "elevation" => $elevation,
                "duration" => $duration,
            ];
        }

        return $data;
    }

    private static function enqueue_assets($data, $settings)
    {
        $version = UPTRACK_MAP__PLUGIN_VERSION;

        // [require-wp-leaflet-map] [require-toGeoJSON] Includes leaflet and toGeoJSON.
        // Defined in https://github.com/bozdoz/wp-plugin-leaflet-map/blob/v3.4.5/class.leaflet-map.php#L217
        \wp_enqueue_script("leaflet_ajax_geojson_js");
        // [uptrack_alpine_js]
        \wp_enqueue_script(
            "uptrack_alpine_js",
            $settings[Settings::ALPINEJS_URL],
            [],
            null,
            ["strategy" => "defer"],
        );

        $uptrack_map_script_name = "uptrack-map";
        \wp_enqueue_script(
            $uptrack_map_script_name,
            // SYNC [js-uptrack-map]
            \plugins_url("js/uptrack-map.js", UPTRACK_MAP__PLUGIN_FILE),
            [],
            $version,
            true,
        );

        $input = \wp_json_encode($data, JSON_UNESCAPED_SLASHES);
        \wp_add_inline_script(
            $uptrack_map_script_name,
            // SYNC [UptrackMapPlugin]
            "window.UptrackMapPlugin.render(" . $input . ")",
        );

        $style_name = "uptrack-map";
        \wp_enqueue_style(
            $style_name,
            \plugins_url("css/uptrack-map-core.css", UPTRACK_MAP__PLUGIN_FILE),
            [],
            $version,
        );

        \wp_add_inline_style($style_name, $settings[Settings::CSS]);
    }
}
