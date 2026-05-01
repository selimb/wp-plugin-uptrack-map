<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined("ABSPATH")) {
    exit();
}

class Settings
{
    // Squeeze everything into a single setting for convenience.
    // SYNC [UptrackSettingsContainer]
    public static $SETTING_NAME = "uptrack_settings";

    // SYNC [uptrack-settings]
    public static $SETTING_KML_DIRECTORY = "kml_directory";
    // SYNC [uptrack-settings]
    public static $SETTING_ROUTES = "routes";
    // SYNC [uptrack-settings]
    public static $SETTING_ALPINEJS_URL = "alpinejs_url";
    // SYNC [uptrack-settings]
    public static $SETTING_CSS = "css";
    // SYNC [uptrack-settings]
    public static $SETTING_FOCUS_CARD_HTML = "focus_card_html";

    public static function init()
    {
        self::register_settings();
    }

    /**
     * Registers the settings so that they can be updated through the REST API.
     */
    private static function register_settings()
    {
        $option_group = "uptrack_map_option_group";

        // See [uptrack-settings] for schema.
        \register_setting($option_group, self::$SETTING_NAME, [
            "type" => "object",
            "show_in_rest" => [
                "schema" => [
                    "type" => "object",
                    // This lets us avoid duplicating the schema here.
                    "additionalProperties" => true,
                ],
            ],
            "autoload" => "no",
            "default" => [
                // We only need defaults for things that are consumed in PHP land.
                // SYNC [uptrack-settings]
                self::$SETTING_KML_DIRECTORY => "kml-paths",
                self::$SETTING_ROUTES => [],
                self::$SETTING_ALPINEJS_URL =>
                    "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
            ],
        ]);
    }

    public static function get_settings()
    {
        return \get_option(self::$SETTING_NAME);
    }
}
