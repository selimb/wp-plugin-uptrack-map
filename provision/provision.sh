#!/usr/bin/env bash
set -euxo pipefail
shopt -s nullglob

HERE=$(dirname "$0")

if wp core is-installed; then
    echo "WordPress already installed; skipping provisioning."
    exit 1
fi

SITE_URL="http://localhost:1234"
SITE_TITLE="Uptrack Map Test"
ADMIN_USER="admin"
ADMIN_PASS="password"
ADMIN_EMAIL="admin@example.com"

# ==========
echo Running Wordpress installation...
wp core install \
    --url="$SITE_URL" \
    --title="$SITE_TITLE" \
    --admin_user="$ADMIN_USER" \
    --admin_password="$ADMIN_PASS" \
    --admin_email="$ADMIN_EMAIL" \
    --skip-email

# ==========
echo Setting up plugins...
wp plugin delete --all --exclude=uptrack-map
wp plugin install leaflet-map --activate
wp plugin activate uptrack-map

# ==========
echo Setting up posts...
wp post delete --force $(wp post list --post_type='page' --format=ids)
wp post delete --force $(wp post list --post_type='post' --format=ids)

files=(/var/www/html/wp-content/kml-paths/*.kml)
if ((${#files[@]} == 0)); then
    echo "No KML files found" >&2
    exit 1
fi
for kml_file in "${files[@]}"; do
    post_title="$(basename "$kml_file" .kml)"
    wp post create \
        --post_type="post" \
        --post_status="publish" \
        --post_title="$post_title"
done

# ==========
echo Setting up Map page...

active_theme=$(wp theme list --status=active --field=name)
theme_dir=$(wp theme path "$active_theme" --dir)
cp "$HERE/template_fullscreen.html" "$theme_dir/templates/fullscreen.html"

wp post create \
    "$HERE/page_map.txt" \
    --post_title="Map" \
    --post_status="publish" \
    --post_type="page" \
    --meta_input='{"_wp_page_template":"fullscreen"}'
