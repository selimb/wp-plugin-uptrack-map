<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined("ABSPATH")) {
    exit();
}

class Settings
{
    // SYNC [uptrack-settings]
    public const KML_DIRECTORY = "uptrack_kml_directory";
    public const ROUTES = "uptrack_routes";
    public const FOCUS_CARD_HTML = "uptrack_focus_card_html";
    public const CSS = "uptrack_css";
    public const ALPINEJS_URL = "uptrack_alpinejs_url";
    public const MAP_STYLES = "uptrack_map_styles";

    public const ALL = [
        self::KML_DIRECTORY,
        self::ROUTES,
        self::FOCUS_CARD_HTML,
        self::CSS,
        self::ALPINEJS_URL,
        self::MAP_STYLES,
    ];

    public static function init()
    {
        self::register_settings();
    }

    /**
     * Registers all settings such that:
     * - They are updateable via REST API.
     * - Default values are set where applicable -- these are used by `\get_option()` and `\get_options()`.
     */
    private static function register_settings()
    {
        $option_group = "uptrack_map_option_group";

        \register_setting($option_group, self::KML_DIRECTORY, [
            "type" => "string",
            "show_in_rest" => true,
            "autoload" => "no",
            // [php-default-kml-directory] Need default for this one, since it's used server-side.
            "default" => "kml-paths",
        ]);

        \register_setting($option_group, self::ROUTES, [
            "type" => "array",
            "show_in_rest" => [
                "schema" => [
                    "type" => "array",
                    "items" => [
                        "type" => "object",
                        "additionalProperties" => true,
                    ],
                ],
            ],
            "autoload" => "no",
        ]);

        \register_setting($option_group, self::FOCUS_CARD_HTML, [
            "type" => "string",
            "show_in_rest" => true,
            "autoload" => "no",
        ]);

        \register_setting($option_group, self::CSS, [
            "type" => "string",
            "show_in_rest" => true,
            "autoload" => "no",
        ]);

        \register_setting($option_group, self::ALPINEJS_URL, [
            "type" => "string",
            "show_in_rest" => true,
            "autoload" => "no",
        ]);

        \register_setting($option_group, self::MAP_STYLES, [
            "type" => "object",
            "show_in_rest" => [
                "schema" => [
                    "type" => "object",
                    "additionalProperties" => true,
                ],
            ],
            "autoload" => "no",
        ]);
    }
}
