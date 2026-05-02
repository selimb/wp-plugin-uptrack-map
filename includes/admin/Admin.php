<?php

namespace Uptrack;

// Exit if accessed directly
if (!defined("ABSPATH")) {
    exit();
}

require_once __DIR__ . "/pages/AdminPage.php";
require_once __DIR__ . "/pages/AdminRoutesPage.php";
require_once __DIR__ . "/pages/AdminAssetsPage.php";
require_once __DIR__ . "/pages/AdminMapStylesPage.php";
require_once __DIR__ . "/pages/AdminJsonPage.php";

class Admin
{
    private static $PAGES = [
        AdminRoutesPage::class,
        AdminAssetsPage::class,
        AdminMapStylesPage::class,
        AdminJsonPage::class,
    ];

    private static $hook_to_page_class = [];

    public static function init()
    {
        \add_action("admin_menu", [__CLASS__, "on_admin_menu"]);
        \add_action("admin_enqueue_scripts", [
            __CLASS__,
            "on_admin_enqueue_scripts",
        ]);
    }

    public static function on_admin_menu()
    {
        $first_page = self::$PAGES[0];

        $first_hook = \add_menu_page(
            "Uptrack Map",
            "Uptrack Map",
            "manage_options",
            $first_page::get_slug(),
            [$first_page, "render"],
            "dashicons-location-alt",
        );
        self::$hook_to_page_class[$first_hook] = $first_page;

        foreach (self::$PAGES as $page_class) {
            $submenu_hook = \add_submenu_page(
                $first_page::get_slug(),
                $page_class::get_page_title(),
                $page_class::get_menu_title(),
                "manage_options",
                $page_class::get_slug(),
                [$page_class, "render"],
            );
            self::$hook_to_page_class[$submenu_hook] = $page_class;
        }
    }

    public static function on_admin_enqueue_scripts($hook_suffix)
    {
        if (!array_key_exists($hook_suffix, self::$hook_to_page_class)) {
            return;
        }

        $page_class = self::$hook_to_page_class[$hook_suffix];
        $page_class::enqueue_assets();
    }
}
