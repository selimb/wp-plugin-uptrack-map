import { BaseControl } from "@wordpress/components";
import { useId, useRef } from "@wordpress/element";

export function ColorControl({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  const id = useId();
  const textInputRef = useRef<HTMLInputElement>(null);

  return (
    <BaseControl label={label} id={id} __nextHasNoMarginBottom>
      <div className="map-styles-color-control">
        <label
          className="map-styles-color-swatch"
          style={{ backgroundColor: value }}
          title="Pick a color"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />
        </label>
        <input
          ref={textInputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      </div>
    </BaseControl>
  );
}
