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

  return (
    <BaseControl label={label} id={id} __nextHasNoMarginBottom>
      <div className="color-control">
        <label
          className="color-control-swatch"
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
