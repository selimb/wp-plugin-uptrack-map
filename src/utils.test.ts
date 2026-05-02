import { describe, expect, it, test } from "bun:test";
import * as z from "zod/mini";

import { zCatchObject } from "./utils";

describe("zCatchObject", () => {
  it("falls back when top-level input is invalid", () => {
    const schema = zCatchObject({
      count: z.catch(z.number(), 3),
      label: z.catch(z.string(), "default"),
    });

    expect(schema.parse("oops")).toEqual({
      count: 3,
      label: "default",
    });
  });

  it("supports nested object fallbacks", () => {
    const schema = zCatchObject({
      nested: zCatchObject({
        weight: z.catch(z.number(), 10),
        color: z.catch(z.string(), "blue"),
      }),
      opacity: z.catch(z.number(), 0.5),
    });

    expect(schema.parse({ nested: "bad" })).toEqual({
      nested: {
        weight: 10,
        color: "blue",
      },
      opacity: 0.5,
    });
  });

  it("preserves valid values", () => {
    const schema = zCatchObject({
      count: z.catch(z.number(), 3),
      name: z.catch(z.string(), "default"),
    });

    expect(
      schema.parse({
        count: 9,
      }),
    ).toEqual({
      count: 9,
      name: "default",
    });
  });

  test("fromObject", () => {
    const schema = zCatchObject.fromObject(
      z.object({
        count: z.catch(z.number(), 3),
        label: z.catch(z.string(), "default"),
      }),
    );

    expect(schema.parse("oops")).toEqual({
      count: 3,
      label: "default",
    });
  });
});
