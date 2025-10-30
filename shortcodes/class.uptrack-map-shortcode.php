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
        wp_register_style('uptrack_map_stylesheet', plugins_url('uptrack-map.css', LEAFLET_MAP__PLUGIN_FILE));
        wp_enqueue_style('uptrack_map_stylesheet');

        wp_enqueue_script('leaflet_ajax_geojson_js');
        wp_enqueue_script('uptrack_map_js');

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
            if (empty($post_id)) {
                $post_title = '';
                $post_url = '';
            } else {
                $post = $post_map[$post_id];
                $post_title = $post->post_title;
                $post_url = get_permalink($post);
            }

            // [sync-UptrackMapInput]
            $data[] = [
                'kml_url' => $kml_url,
                'type' => $info["type"],
                'marker_distance_percent' => (float)$info["marker_distance_percent"],
                'post_url' => $post_url,
                'post_title' => $post_title,
                'distance_km' => (float)$info["distance_km"],
                'elevation_m' => (float)$info["elevation_m"],
                'duration_d' => (float)$info["duration_d"],
            ];
        }

        ob_start();
?>/*<script>
    */
    const data = <?php echo json_encode($data); ?>;
    window.UptrackMapPlugin.render(data);

    <?php
        $script = ob_get_clean();

        return $this->wrap_script($script, 'UptrackMapShortcode');
    }
}
