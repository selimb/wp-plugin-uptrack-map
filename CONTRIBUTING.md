# CONTRIBUTING

This plugin does **not** leverage [@wordpress/scripts](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#build) -- I know my way around Typescript but I'm new to Wordpress.
Same goes for `wp-env` (which I've found to be terribly slow and clunky).

## Prerequisites

- [Bun](https://bun.com/) -- see [.tool-versions](./.tool-versions) for version
- Docker & Docker Compose

## Setup

```shell
bun install
```

## Lint

```shell
bun run lint
```

## Build

Watch mode:

```shell
bun run build:watch
```

Production:

```shell
bun run build:prod
```

## Wordpress Setup

1. Start Wordpress:

   ```shell
   docker compose up --detach
   ```

2. Browse to http://localhost:1234, and go through the installation process.
3. At http://localhost:1234/wp-admin/plugins.php, remove pre-installed plugins, and install/activate `Leaflet Map` and `Uptrack Map`.
4. Create some posts matching the KML files.
5. Configure routes at http://localhost:1234/wp-admin/options-general.php?page=uptrack-map-settings.

## Wordpress Debugging

To get a shell inside the Wordpress container, run:

```shell
bun run docker:bash
```
