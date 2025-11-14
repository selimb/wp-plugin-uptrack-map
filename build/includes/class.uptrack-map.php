<?php

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Uptrack_Map_Plugin
{
        'uptrack-map' => array(
            'file' => 'class.uptrack-map-shortcode.php',
            'class' => 'Uptrack_Map_Shortcode'
        )
    );

    /**
     * @var Uptrack_Map_Plugin
     **/
    private static $instance = null;

    public static function init()
    {
        if (!self::$instance) {
            self::$instance = new self;
        }

        return self::$instance;
    }

    private function __construct()
    {
        $this->init_hooks();
        $this->add_shortcodes();
    }

    private function init_hooks()
    {
        // XXX check

        // Leaflet_Map_Plugin_Settings
        include_once LEAFLET_MAP__PLUGIN_DIR . 'class.plugin-settings.php';

        // Leaflet_Map_Admin
        include_once LEAFLET_MAP__PLUGIN_DIR . 'class.admin.php';

        // init admin
        Leaflet_Map_Admin::init();

        add_action('wp_enqueue_scripts', array('Leaflet_Map', 'enqueue_and_register'));

        $settings = self::settings();

        if ($settings->get('shortcode_in_excerpt')) {
            // allows maps in excerpts
            add_filter('the_excerpt', 'do_shortcode');
        }
    }

    private function add_shortcodes()
    {
        $shortcode_dir = LEAFLET_MAP__PLUGIN_DIR . 'includes/shortcodes/';

        foreach ($this->_shortcodes as $shortcode => $details) {
            include_once $shortcode_dir . $details['file'];
            add_shortcode($shortcode, array($details['class'], 'shortcode'));
        }
    }

    /**
     * Triggered when user uninstalls/removes plugin
     */
    public static function uninstall()
    {
        // remove settings in db
        // it needs to be included again because __construct
        // won't need to execute
        $settings = self::settings();
        $settings->reset();

        // remove geocoder locations in db
        include_once LEAFLET_MAP__PLUGIN_DIR . 'class.geocoder.php';
        Leaflet_Geocoder::remove_caches();
    }

    /**
     * Enqueue and register styles and scripts (called in __construct)
     */
    public static function enqueue_and_register()
    {
        /* defaults from db */
        $settings = self::settings();

        $js_url = $settings->get('js_url');
        $css_url = $settings->get('css_url');

        wp_register_style('leaflet_stylesheet', $css_url, array(), null, false);
        wp_register_script('leaflet_js', $js_url, array(), null, true);

        // new required MapQuest javascript file
        $tiling_service = $settings->get('default_tiling_service');

        if ($tiling_service == 'mapquest') {
            $mapquest_js_url = 'https://www.mapquestapi.com/sdk/leaflet/v2.2/mq-map.js?key=%s';
            $mq_appkey = $settings->get('mapquest_appkey');
            $mapquest_js_url = sprintf($mapquest_js_url, $mq_appkey);

            wp_register_script('leaflet_mapquest_plugin', $mapquest_js_url, array('leaflet_js'), '2.0', true);
        }

        // optional ajax geojson plugin
        wp_register_script('tmcw_togeojson', $settings->get('togeojson_url'), array('jquery'), LEAFLET_MAP__PLUGIN_VERSION, false);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $minified = '';
        } else {
            $minified = '.min';
        }

        wp_register_script('leaflet_ajax_geojson_js', plugins_url(sprintf('scripts/leaflet-ajax-geojson%s.js', $minified), __FILE__), array('tmcw_togeojson', 'leaflet_js'), LEAFLET_MAP__PLUGIN_VERSION, false);
        wp_register_script('uptrack_map_js', plugins_url(sprintf('scripts/uptrack-map%s.js', $minified), __FILE__), array('leaflet_ajax_geojson_js'), LEAFLET_MAP__PLUGIN_VERSION, false);

        wp_register_script('leaflet_svg_icon_js', plugins_url(sprintf('scripts/leaflet-svg-icon%s.js', $minified), __FILE__), array('leaflet_js'), LEAFLET_MAP__PLUGIN_VERSION, false);

        /* run a construct function in the document head for subsequent functions to use (it is lightweight) */
        wp_register_script('wp_leaflet_map', plugins_url(sprintf('scripts/construct-leaflet-map%s.js', $minified), __FILE__), array('leaflet_js'), LEAFLET_MAP__PLUGIN_VERSION, false);
    }

    /**
     * Get settings from Leaflet_Map_Plugin_Settings
     * @return Leaflet_Map_Plugin_Settings
     */
    public static function settings()
    {
        include_once LEAFLET_MAP__PLUGIN_DIR . 'class.plugin-settings.php';
        return Leaflet_Map_Plugin_Settings::init();
    }
}
