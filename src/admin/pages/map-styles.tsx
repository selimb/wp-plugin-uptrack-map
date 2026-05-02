import {
  BaseControl,
  Icon,
  PanelBody,
  TextControl,
  Tooltip,
} from "@wordpress/components";
import * as z from "zod/mini";

import { zUptrackSettings } from "../../settings";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage, useAdminForm } from "./_shared";

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

// SYNC [AdminMapStylesInput]
const zAdminMapStylesInput = z.object({
  nonce: z.string(),
  settings: z.pick(zUptrackSettings, {
    uptrack_map_styles: true,
  }),
});
type AdminMapStylesInput = z.infer<typeof zAdminMapStylesInput>;
type MapStylesSettings = AdminMapStylesInput["settings"];

mountAdminPage({
  schema: zAdminMapStylesInput,
  render: (input) => <MapStylesPage settingsDefault={input.settings} />,
});

function MapStylesPage({
  settingsDefault,
}: {
  settingsDefault: MapStylesSettings;
}): React.JSX.Element {
  const { result, update } = useUpdateSettings();

  const form = useAdminForm({
    defaultValues: settingsDefault.uptrack_map_styles,
    onSubmit: async ({ value }) => {
      await update({ uptrack_map_styles: value });
    },
  });

  return (
    <form.AppForm>
      <form
        className="form-wrap"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FormSubmitNotice result={result} />

        <div className="form-field">
          <BaseControl label="Map Styles">
            <PanelBody title="Map Styles" initialOpen={false}>
              <div className="map-styles-field-group">
                <form.Field
                  name="canvasTolerance"
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
                  name="roundtripEpsilon"
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
                          name="routeStyles.normal.opacity"
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
                          name="routeStyles.normal.weight"
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
                          name="routeStyles.focus.opacity"
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
                          name="routeStyles.focus.weight"
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
                          name="routeStyles.fade.opacity"
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
                          name="routeStyles.fade.weight"
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
                          name="routeTypeProps.ski_touring.color"
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
                          name="routeTypeProps.mountaineering.color"
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
                          name="routeTypeProps.hiking.color"
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

              <div>
                <h4>Marker Styling</h4>
                <div className="map-styles-field-group map-styles-field-group--compact map-styles-field-group--single-line">
                  <form.Field
                    name="markerRadiusPx"
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
                    name="markerWeightPx"
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
                    name="markerColor"
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
                    name="markerFillOpacity"
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
                    name="markerStartFillColor"
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
                    name="markerEndFillColor"
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
                    name="markerRoundtripFillColor"
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

        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}
