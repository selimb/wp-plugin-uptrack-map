# CONTRIBUTING

## Prerequisites

- [Bun](https://bun.com/) -- see [.tool-versions](./.tool-versions) for version
- Docker & Docker Compose

## Lint

```
bun run lint
```

## Build

Watch mode:

```
bun run build:watch
```

Production:

```
bun run build:prod
```

## Wordpress Setup

1. Start WordPress:

   ```shell
   docker compose up --detach
   ```

2. Browse to http://localhost:1234, and go through the installation process.
3. At http://localhost:1234/wp-admin/plugins.php, remove pre-installed plugins, and install/activate `Leaflet Map` and `Uptrack Map`.
4. Create some posts.
5.
