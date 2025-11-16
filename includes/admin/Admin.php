<?php

namespace Uptrack;

use function PHPSTORM_META\map;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}


class Admin
{
    public static function init()
    {
        \add_action('admin_menu', [__CLASS__, 'on_admin_menu']);
        \add_action('admin_enqueue_scripts', [__CLASS__, 'on_admin_enqueue_scripts']);
    }

    public static function on_admin_menu()
    {
        \add_options_page(
            'Uptrack Map',
            'Uptrack Map',
            'manage_options',
            'uptrack-map-settings',
            [__CLASS__, 'render'],
        );
    }

    public static function on_admin_enqueue_scripts($hook_suffix)
    {
        // Only load on our page
        if ($hook_suffix !== 'settings_page_uptrack-map-settings') {
            return;
        }

        $version    = UPTRACK_MAP__PLUGIN_VERSION;

        $script_name = 'uptrack-map-admin';
        $script_url = \plugins_url('js/admin.js', UPTRACK_MAP__PLUGIN_FILE);
        \wp_register_script(
            $script_name,
            $script_url,
            [
                'wp-element', // React / ReactDOM
                'wp-components',
                'wp-api-fetch',
            ],
            $version,
            true
        );

        $css_name = 'uptrack-map-admin';
        $css_url = \plugins_url('css/admin.css', UPTRACK_MAP__PLUGIN_FILE);
        \wp_register_style(
            $css_name,
            $css_url,
            [],
            $version
        );

        $settings = Settings::get_settings();

        $kml_dirname = $settings[Settings::$SETTING_KML_DIRECTORY];
        $kml_dirpath = \WP_CONTENT_DIR . '/' . $kml_dirname;
        if (is_dir($kml_dirpath)) {
            $kml_dir_valid = true;
            $kml_filenames = self::collect_kml_files($kml_dirpath);
        } else {
            $kml_dir_valid = false;
            $kml_filenames = [];
        }

        // SYNC [AdminInput]
        $data = [
            'nonce' => \wp_create_nonce('wp_rest'),
            'posts' => self::query_posts(),
            'settings' => $settings,
            'kmlFilenames' => $kml_filenames,
            'kmlDirectoryValid' => $kml_dir_valid,
        ];

        \wp_add_inline_script(
            $script_name,
            '(function(w){w.uptrackAdminInput=' . \wp_json_encode($data, JSON_UNESCAPED_SLASHES) . ';})(window);',
            'before'
        );

        \wp_enqueue_script($script_name);

        \wp_enqueue_style('wp-components');
        \wp_enqueue_style($css_name);
    }

    private static function query_posts()
    {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT ID, post_title, post_status
             FROM {$wpdb->posts}
             WHERE post_type='post'
            ",
        );
    }

    private static function collect_kml_files($dirpath)
    {
        $paths = glob($dirpath . '/*.kml');
        $filenames = array_map(function ($path) {
            return basename($path);
        }, $paths);
        return $filenames;
        // return [$dirpath . '/*.kml'];
    }

    public static function render()
    {
?>
        <div class="wrap">
            <h1>Uptrack Map Settings</h1>
            <div id="uptrack-map-settings-root"></div>
        </div>
<?php
    }
}
