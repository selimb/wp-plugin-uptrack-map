# CONTRIBUTING

## Prerequisites

- [Bun](https://bun.com/) -- see [.tool-versions](./.tool-versions) for version
- Docker & Docker Compose

## Wordpress Setup

1. Start WordPress:

   ```shell
   docker compose up --detach
   ```

2. Browse to http://localhost:1234, and go through the installation process.
3. At http://localhost:1234/wp-admin/plugins.php, remove pre-installed plugins, and install `Leaflet Map`.
4. XXX
