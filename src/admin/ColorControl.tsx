import { BaseControl } from "@wordpress/components";
import { useEffect, useId, useRef, useState } from "@wordpress/element";

// CSS tricks inspired by https://frontendmasters.com/blog/a-color-input-that-also-shows-the-value/
const CSS_PROPERTY_INPUT = "--color-input";
const CSS_PROPERTY_RGB = "--color-rgb";
let didCreateCssProps = false;

const BLACK = "#000000";

function createCssProps(): void {
  window.CSS.registerProperty({
    name: "--color-input",
    syntax: "<color>",
    inherits: false,
    initialValue: BLACK,
  });

  window.CSS.registerProperty({
    name: "--color-rgb",
    syntax: "<color>",
    inherits: false,
    initialValue: BLACK,
  });
}

function initTextInputCssProps(elem: HTMLInputElement): void {
  elem.style.setProperty(
    CSS_PROPERTY_RGB,
    `rgb(from var(${CSS_PROPERTY_INPUT}) r g b)`,
  );
}

function computeHexFromTextInput(
  elem: HTMLInputElement,
  value: string,
): string {
  elem.style.setProperty(CSS_PROPERTY_INPUT, value);
  const style = window.getComputedStyle(elem);
  const hexValue = style.getPropertyValue(CSS_PROPERTY_RGB);
  console.info("hexvalue", hexValue);
  const numbers = value.match(/[0-9.]+/g);
  if (!numbers) return BLACK;
  const hex = numbers
    .slice(0, 3)
    .map((n) =>
      Math.floor(Number(n) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
  console.info("hex", hex);
  return `#${hex}`;
}

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

  const [colorInputValue, setColorInputValue] = useState(value);

  useEffect(() => {
    if (!didCreateCssProps) {
      createCssProps();
      didCreateCssProps = true;
    }

    if (textInputRef.current) {
      initTextInputCssProps(textInputRef.current);
    }
  }, []);

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
            value={colorInputValue}
            onChange={(e) => {
              onChange(e.target.value);
              setColorInputValue(e.target.value);
            }}
            className="map-styles-color-picker-hidden"
          />
        </label>
        <input
          ref={textInputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setColorInputValue(
              computeHexFromTextInput(e.target, e.target.value),
            );
          }}
          className="components-text-control__input"
        />
      </div>
    </BaseControl>
  );
}
