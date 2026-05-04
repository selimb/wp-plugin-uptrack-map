<?php

namespace Uptrack;

abstract class AdminPage
{
    abstract public static function get_slug();
    abstract public static function get_menu_title();
    abstract public static function get_page_title();
    abstract public static function get_script_basename();
    abstract public static function get_input_data();

    public static function enqueue_assets()
    {
        $script_name = "uptrack-map-admin-" . static::get_slug();
        $script_url = \plugins_url(
            "js/" . static::get_script_basename() . ".js",
            UPTRACK_MAP__PLUGIN_FILE,
        );
        $version =
            defined("WP_DEBUG") && WP_DEBUG
                ? time()
                : UPTRACK_MAP__PLUGIN_VERSION;

        \wp_register_script(
            $script_name,
            $script_url,
            ["wp-element", "wp-components", "wp-api-fetch"],
            $version,
            true,
        );

        $data = static::get_input_data();
        \wp_add_inline_script(
            $script_name,
            // SYNC [uptrack-admin-input-global]
            "(function(w){w.uptrackAdminInput=" .
                \wp_json_encode($data, JSON_UNESCAPED_SLASHES) .
                ";})(window);",
            "before",
        );

        $css_name = "uptrack-map-admin";
        $css_url = \plugins_url("css/admin.css", UPTRACK_MAP__PLUGIN_FILE);
        \wp_register_style($css_name, $css_url, [], $version);

        \wp_enqueue_script($script_name);
        \wp_enqueue_style("wp-components");
        \wp_enqueue_style($css_name);
    }

    public static function render()
    {
        ?>
        <div class="wrap">
            <h1><?php echo \esc_html(static::get_page_title()); ?></h1>
            <!-- SYNC [uptrack-admin-root-element-id] -->
            <div id="uptrack-map-admin-root"></div>
        </div>
<?php
    }
}
