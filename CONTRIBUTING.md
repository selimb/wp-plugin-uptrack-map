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

2. Provision templates/pages/posts with:

   ```shell
   bun run docker:provision
   ```

3. Configure routes at http://localhost:1234/wp-admin/options-general.php?page=uptrack-map-settings.

4. Head over to the Map!

## Wordpress Debugging

To get a shell inside the Wordpress container, run:

```shell
bun run docker:bash
```
