import { SelectControl, TextControl } from "@wordpress/components";
import clsx from "clsx";
import React from "react";

import { RouteTypeLabel } from "../enums";
import {
  type RouteType,
  type UptrackRoutesSetting,
  type UptrackRoutesSettingItem,
  zRouteType,
} from "../settings";
import type { Post, PostId, PostMap } from "./AdminForm";
import { CoordinateInput } from "./CoordinateInput";

export type RoutesTableProps = {
  postMap: PostMap;
  routes: UptrackRoutesSetting;
  onChange: (index: number, patch: Partial<UptrackRoutesSettingItem>) => void;
};

export const RoutesTable: React.FC<RoutesTableProps> = ({
  postMap,
  routes,
  onChange,
}) => {
  const postsRemaining = computeRemainingPosts(postMap, routes);

  return (
    <table className="widefat fixed striped uptrack-route-table">
      <thead>
        <tr>
          <th>KML File</th>
          <th>Post</th>
          <th>Title</th>
          <th>Type</th>
          <th>Distance</th>
          <th>Elevation</th>
          <th>Duration</th>
          <th>Marker</th>
        </tr>
      </thead>
      <tbody>
        {routes.map((route, index) => {
          const routeId = route.kmlFilename;
          const title = route.postId
            ? (postMap.get(route.postId)?.post_title ?? "")
            : route.title;
          return (
            <tr key={routeId}>
              {/* KML File */}
              <td style={{ fontFamily: "monospace" }}>{route.kmlFilename}</td>
              {/* Post */}
              <td>
                <SelectControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  options={getPostOptions(
                    route.postId,
                    postMap,
                    postsRemaining,
                  )}
                  value={route.postId ?? ""}
                  onChange={(postId) => {
                    onChange(index, { postId: postId === "" ? null : postId });
                  }}
                  className={clsx(
                    "w-full",
                    route.postId || route.title ? "" : "control-invalid",
                  )}
                />
              </td>
              {/* Title */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  disabled={route.postId ? true : false}
                  value={title}
                  onChange={(title) => {
                    onChange(index, { title });
                  }}
                  style={route.postId ? INPUT_DISABLED_STYLE : undefined}
                />
              </td>
              {/* Type */}
              <td>
                <SelectControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  options={TYPE_OPTIONS}
                  value={route.type}
                  onChange={(type) => {
                    onChange(index, { type });
                  }}
                />
              </td>
              {/* Distance */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.distance}
                  onChange={(distance) => {
                    onChange(index, { distance });
                  }}
                />
              </td>
              {/* Elevation */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.elevation}
                  onChange={(elevation) => {
                    onChange(index, { elevation });
                  }}
                />
              </td>
              {/* Duration */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.duration}
                  onChange={(duration) => {
                    onChange(index, { duration });
                  }}
                />
              </td>
              {/* Marker */}
              <td>
                <CoordinateInput
                  value={route.marker}
                  onChange={(marker) => {
                    onChange(index, { marker });
                  }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const TYPE_OPTIONS: Array<{ label: string; value: RouteType }> =
  zRouteType.options
    .map((routeType) => ({
      value: routeType,
      label: RouteTypeLabel[routeType],
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label));

function computeRemainingPosts(
  postMap: PostMap,
  routes: UptrackRoutesSetting,
): Post[] {
  const remaining = new Set(postMap.keys());

  for (const route of routes) {
    if (route.postId) {
      remaining.delete(route.postId);
    }
  }

  const postsRemaining = [...remaining].map((postId) => {
    const post = postMap.get(postId);
    if (!post) {
      throw new Error(`Post ID ${postId} not found in post map`);
    }
    return post;
  });

  return postsRemaining.toSorted((a, b) =>
    a.post_title.localeCompare(b.post_title),
  );
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- This is more explicit.
type PostOption = { label: string; value: PostId | "" };

function getPostOptions(
  selected: PostId | null,
  postMap: PostMap,
  postsRemaining: Post[],
): PostOption[] {
  const options: PostOption[] = [{ label: "None", value: "" }];

  if (selected !== null) {
    const post = postMap.get(selected);
    if (post) {
      options.push({ value: selected, label: post.post_title });
    }
  }

  for (const post of postsRemaining) {
    options.push({ value: post.ID, label: post.post_title });
  }
  return options;
}

// Ideally we would just slap `disabled` on the `TextControl`, but for some reason that style is less
// specific than the default styles...
const INPUT_DISABLED_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,.5)",
  borderColor: "rgba(220,220,222,.75)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,.04)",
  color: "rgba(44,51,56,.5)",
};
