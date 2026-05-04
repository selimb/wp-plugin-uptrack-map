<?php

namespace Uptrack;

class AdminAssetsPage extends AdminPage
{
    public static function get_slug()
    {
        return "uptrack-map-assets";
    }

    public static function get_menu_title()
    {
        return "Assets";
    }

    public static function get_page_title()
    {
        return "Uptrack Map - Assets";
    }

    public static function get_script_basename()
    {
        // SYNC [js-admin-assets]
        return "admin-assets";
    }

    public static function get_input_data()
    {
        // SYNC [AdminAssetsInput]
        return [
            "nonce" => \wp_create_nonce("wp_rest"),
            "settings" => \get_options([
                Settings::FOCUS_CARD_HTML,
                Settings::CSS,
                Settings::ALPINEJS_URL,
            ]),
        ];
    }
}
