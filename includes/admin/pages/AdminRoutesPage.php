<?php

namespace Uptrack;

class AdminRoutesPage extends AdminPage
{
    public static function get_slug()
    {
        return "uptrack-map-routes";
    }

    public static function get_menu_title()
    {
        return "Routes";
    }

    public static function get_page_title()
    {
        return "Uptrack Map - Routes";
    }

    public static function get_script_basename()
    {
        // SYNC [js-admin-routes]
        return "admin-routes";
    }

    public static function get_input_data()
    {
        $settings = \get_options([Settings::KML_DIRECTORY, Settings::ROUTES]);
        // Relies on [php-default-kml-directory].
        $kml_dirname = $settings[Settings::KML_DIRECTORY];
        $kml_dirpath = \WP_CONTENT_DIR . "/" . $kml_dirname;

        if (is_dir($kml_dirpath)) {
            $kml_dir_valid = true;
            $kml_filenames = self::collect_kml_files($kml_dirpath);
        } else {
            $kml_dir_valid = false;
            $kml_filenames = [];
        }

        // SYNC [AdminRoutesInput]
        return [
            "nonce" => \wp_create_nonce("wp_rest"),
            "posts" => self::query_posts(),
            "settings" => $settings,
            "kmlFilenames" => $kml_filenames,
            "kmlDirectoryValid" => $kml_dir_valid,
        ];
    }

    private static function query_posts()
    {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT ID, post_title, post_status, post_name
             FROM {$wpdb->posts}
             WHERE post_type='post'",
        );
    }

    private static function collect_kml_files($dirpath)
    {
        $paths = glob($dirpath . "/*.kml");
        return array_map(function ($path) {
            return basename($path);
        }, $paths);
    }
}
