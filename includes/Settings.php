<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}


class Settings
{
    public static $SETTING_KML_DIRECTORY = 'uptrack_kml_directory';
    public static $SETTING_ROUTES = 'uptrack_routes';

    public static function init()
    {
        self::register_settings();
    }

    /**
     * Registers the settings so that:
     * - they can be updated through the REST API.
     * - `get_option` and `\get_options` return the appropriate default.
     */
    private static function register_settings()
    {
        $option_group = 'uptrack_map_option_group';

        \register_setting($option_group, self::$SETTING_KML_DIRECTORY, [
            'type' => 'string',
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'kml-paths',
        ]);

        // See [UptrackRoutesSetting] for schema.
        \register_setting($option_group, self::$SETTING_ROUTES, [
            'type' => 'array',
            'show_in_rest' => [
                "schema" => [
                    "type" => "array",
                    "items" => [
                        "type" => "object",
                        "additionalProperties" => true,
                    ]
                ]
            ],
            'autoload' => 'no',
            'default' => [],
        ]);
    }

    public static function get_settings()
    {
        return \get_options([
            self::$SETTING_KML_DIRECTORY,
            self::$SETTING_ROUTES,
        ]);
    }
}
