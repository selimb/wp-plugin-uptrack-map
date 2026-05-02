<?php

namespace Uptrack;

class AdminJsonPage extends AdminPage
{
    public static function get_slug()
    {
        return "uptrack-map-json";
    }

    public static function get_menu_title()
    {
        return "JSON";
    }

    public static function get_page_title()
    {
        return "Uptrack Map - JSON";
    }

    public static function get_script_basename()
    {
        // SYNC [js-admin-json]
        return "admin-json";
    }

    public static function get_input_data()
    {
        // SYNC [AdminJsonInput]
        return [
            "nonce" => \wp_create_nonce("wp_rest"),
            "settings" => \get_options(Settings::ALL),
        ];
    }
}
