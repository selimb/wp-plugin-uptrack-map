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
                // SYNC [uptrack-settings]
                "kml_directory" => "kml-paths",
                "routes" => [],
            ],
        ]);
    }

    public static function get_settings()
    {
        return \get_option(self::$SETTING_NAME);
    }
}
