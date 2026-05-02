<?php

namespace Uptrack;

class AdminMapStylesPage extends AdminPage
{
    public static function get_slug()
    {
        return "uptrack-map-map-styles";
    }

    public static function get_menu_title()
    {
        return "Map Styles";
    }

    public static function get_page_title()
    {
        return "Uptrack Map - Map Styles";
    }

    public static function get_script_basename()
    {
        // SYNC [js-admin-map-styles]
        return "admin-map-styles";
    }

    public static function get_input_data()
    {
        // SYNC [AdminMapStylesInput]
        return [
            "nonce" => \wp_create_nonce("wp_rest"),
            "settings" => \get_options([Settings::MAP_STYLES]),
        ];
    }
}
