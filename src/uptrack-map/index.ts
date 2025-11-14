import type L from "leaflet";

import { UptrackMapManager } from "./manager";
import type { RouteInfo } from "./types";

function renderUptrackMap(data: RouteInfo[]): void {
  // @ts-expect-error -- See below.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Modules like it's 1999.
  const map: L.Map = window.WPLeafletMapPlugin.getCurrentMap();

  const mgr = new UptrackMapManager(map);
  void mgr.loadRoutes(data);
}

// SYNC [sync-UptrackMapPlugin]
// @ts-expect-error -- Good enough.
window.UptrackMapPlugin = { render: renderUptrackMap };
