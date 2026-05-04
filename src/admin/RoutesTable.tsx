import { SelectControl, TextControl } from "@wordpress/components";
import clsx from "clsx";
import React from "react";

import { RouteTypeLabel } from "../enums";
import {
  type DurationUnit,
  type RouteDifficulty,
  type RouteType,
  type UptrackRoutesSetting,
  type UptrackRoutesSettingItem,
  zDurationUnit,
  zRouteDifficulty,
  zRouteType,
} from "../settings";
import { CoordinateInput } from "./CoordinateInput";

export type Post = {
  ID: string;
  post_title: string;
  post_status: string;
};
export type PostId = Post["ID"];
export type PostMap = Map<PostId, Post>;

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
    <table className="widefat fixed striped table-align-middle">
      <thead>
        <tr>
          <th>KML File</th>
          <th>Post</th>
          <th>Title</th>
          <th>Type</th>
          <th>Duration</th>
          <th>Elevation Gain (m)</th>
          <th>Elevation Range Start (m)</th>
          <th>Elevation Range End (m)</th>
          <th>Distance (km)</th>
          <th>Difficulty</th>
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
              {/* Duration */}
              <td>
                <div style={{ display: "flex", gap: "8px", minWidth: "220px" }}>
                  <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    value={route.durationValue}
                    onChange={(durationValue) => {
                      onChange(index, { durationValue });
                    }}
                  />
                  <SelectControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    options={DURATION_UNIT_OPTIONS}
                    value={route.durationUnit}
                    onChange={(durationUnit) => {
                      onChange(index, { durationUnit });
                    }}
                  />
                </div>
              </td>
              {/* Elevation Gain */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.elevationGain}
                  onChange={(elevationGain) => {
                    onChange(index, { elevationGain });
                  }}
                />
              </td>
              {/* Elevation Range Start */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.elevationRangeStart}
                  onChange={(elevationRangeStart) => {
                    onChange(index, { elevationRangeStart });
                  }}
                />
              </td>
              {/* Elevation Range End */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.elevationRangeEnd}
                  onChange={(elevationRangeEnd) => {
                    onChange(index, { elevationRangeEnd });
                  }}
                />
              </td>
              {/* Distance */}
              <td>
                <TextControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  value={route.distanceKm}
                  onChange={(distanceKm) => {
                    onChange(index, { distanceKm });
                  }}
                />
              </td>
              {/* Difficulty */}
              <td>
                <SelectControl
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                  options={DIFFICULTY_OPTIONS}
                  value={route.difficulty}
                  onChange={(difficulty) => {
                    onChange(index, { difficulty });
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

const DURATION_UNIT_LABEL: Record<DurationUnit, string> = {
  hours: "hours",
  days: "days",
};

const DURATION_UNIT_OPTIONS: Array<{ label: string; value: DurationUnit }> =
  zDurationUnit.options.map((durationUnit) => ({
    value: durationUnit,
    label: DURATION_UNIT_LABEL[durationUnit],
  }));

const DIFFICULTY_LABEL: Record<RouteDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const DIFFICULTY_OPTIONS: Array<{ label: string; value: RouteDifficulty }> =
  zRouteDifficulty.options.map((difficulty) => ({
    value: difficulty,
    label: DIFFICULTY_LABEL[difficulty],
  }));

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
