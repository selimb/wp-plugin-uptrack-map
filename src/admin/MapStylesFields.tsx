import {
  BaseControl,
  Icon,
  PanelBody,
  TextControl,
  Tooltip,
} from "@wordpress/components";
import type React from "react";

import { zUptrackSettings } from "../settings";
import { withAdminForm } from "./form-hook";

const parseNumberInput = (value: string): number =>
  Number.parseFloat(value) || 0;

const withHelpLabel = (label: string, tooltip: string): React.JSX.Element => (
  <span className="map-styles-label-with-help">
    <span>{label}</span>
    <Tooltip text={tooltip}>
      <span
        aria-label={tooltip}
        className="map-styles-help-icon"
        role="img"
        tabIndex={0}
      >
        <Icon icon="editor-help" size={16} />
      </span>
    </Tooltip>
  </span>
);

export const MapStylesFields = withAdminForm({
  defaultValues: zUptrackSettings.parse({}),
  render: function Render({ form }) {
    return (
      <div className="form-field">
        <BaseControl label="Map Styles">
          <PanelBody title="Map Styles" initialOpen={false}>
            {/* Canvas & Roundtrip Options */}
            <div className="map-styles-field-group">
              <form.Field
                name="mapStyles.canvasTolerance"
                children={(field) => (
                  <TextControl
                    label={withHelpLabel(
                      "Canvas Tolerance (px)",
                      "Pixel tolerance for canvas hit detection. Higher values make line hover/click interactions more forgiving.",
                    )}
                    type="number"
                    min={0}
                    step="any"
                    value={field.state.value.toString()}
                    onChange={(value) => {
                      field.handleChange(parseNumberInput(value));
                    }}
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                  />
                )}
              />
              <form.Field
                name="mapStyles.roundtripEpsilon"
                children={(field) => (
                  <TextControl
                    label={withHelpLabel(
                      "Roundtrip Epsilon",
                      "Distance threshold used to treat route start and end points as the same location.",
                    )}
                    type="number"
                    min={0}
                    step="any"
                    value={field.state.value.toString()}
                    onChange={(value) => {
                      field.handleChange(parseNumberInput(value));
                    }}
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                  />
                )}
              />
            </div>

            {/* Route Styles Table */}
            <div>
              <h4>Route Styles</h4>
              <table className="map-styles-table">
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Opacity</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Normal</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.normal.opacity"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.normal.weight"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Focus</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.focus.opacity"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.focus.weight"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Fade</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.fade.opacity"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                    <td>
                      <form.Field
                        name="mapStyles.routeStyles.fade.weight"
                        children={(field) => (
                          <TextControl
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value.toString()}
                            onChange={(value) => {
                              field.handleChange(parseNumberInput(value));
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Route Type Colors Table */}
            <div>
              <h4>Route Type Colors</h4>
              <table className="map-styles-table">
                <thead>
                  <tr>
                    <th>Route Type</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ski Touring</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeTypeProps.ski_touring.color"
                        children={(field) => (
                          <TextControl
                            value={field.state.value}
                            onChange={(value) => {
                              field.handleChange(value);
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Mountaineering</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeTypeProps.mountaineering.color"
                        children={(field) => (
                          <TextControl
                            value={field.state.value}
                            onChange={(value) => {
                              field.handleChange(value);
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Hiking</td>
                    <td>
                      <form.Field
                        name="mapStyles.routeTypeProps.hiking.color"
                        children={(field) => (
                          <TextControl
                            value={field.state.value}
                            onChange={(value) => {
                              field.handleChange(value);
                            }}
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Marker Options */}
            <div>
              <h4>Marker Styling</h4>
              <div className="map-styles-field-group map-styles-field-group--compact map-styles-field-group--single-line">
                <form.Field
                  name="mapStyles.markerRadiusPx"
                  children={(field) => (
                    <TextControl
                      label="Radius (px)"
                      type="number"
                      min={0}
                      step="any"
                      value={field.state.value.toString()}
                      onChange={(value) => {
                        field.handleChange(parseNumberInput(value));
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerWeightPx"
                  children={(field) => (
                    <TextControl
                      label="Weight (px)"
                      type="number"
                      min={0}
                      step="any"
                      value={field.state.value.toString()}
                      onChange={(value) => {
                        field.handleChange(parseNumberInput(value));
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerColor"
                  children={(field) => (
                    <TextControl
                      label="Border Color"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerFillOpacity"
                  children={(field) => (
                    <TextControl
                      label="Fill Opacity"
                      type="number"
                      min={0}
                      step="any"
                      value={field.state.value.toString()}
                      onChange={(value) => {
                        field.handleChange(parseNumberInput(value));
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerStartFillColor"
                  children={(field) => (
                    <TextControl
                      label="Start Fill Color"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerEndFillColor"
                  children={(field) => (
                    <TextControl
                      label="End Fill Color"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
                <form.Field
                  name="mapStyles.markerRoundtripFillColor"
                  children={(field) => (
                    <TextControl
                      label="Roundtrip Fill Color"
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                      }}
                      __next40pxDefaultSize
                      __nextHasNoMarginBottom
                    />
                  )}
                />
              </div>
            </div>
          </PanelBody>
        </BaseControl>
      </div>
    );
  },
});
