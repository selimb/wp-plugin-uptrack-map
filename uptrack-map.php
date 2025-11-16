<?php

/**
 * Plugin Name: Uptrack Map
 * Author: selimb
 * Version: 0.1.0
 * License: GPL2
 * Plugin URI: https://github.com/selimb/wp-plugin-uptrack-map
 * Description: The Uptrack's map
 * Requires Plugins: leaflet-map
 */

// NOTE: We require leaflet-map because of [require-wp-leaflet-map].

namespace Uptrack;

// Exit if accessed directly
if (!defined("ABSPATH")) {
    exit();
}

define("UPTRACK_MAP__PLUGIN_VERSION", "3.4.2");
define("UPTRACK_MAP__PLUGIN_FILE", __FILE__);
define("UPTRACK_MAP__PLUGIN_DIR", \plugin_dir_path(__FILE__));

require_once UPTRACK_MAP__PLUGIN_DIR . "includes/Settings.php";
require_once UPTRACK_MAP__PLUGIN_DIR . "includes/admin/Admin.php";
require_once UPTRACK_MAP__PLUGIN_DIR .
    "includes/shortcodes/UptrackMapShortcode.php";

function add_shortcodes()
{
    \add_shortcode("uptrack-map", [UptrackMapShortCode::class, "render"]);
}

function init()
{
    Settings::init();
    Admin::init();
    add_shortcodes();
}

\add_action("init", __NAMESPACE__ . "\\init");
