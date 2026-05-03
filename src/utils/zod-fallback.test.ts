import { expect, it } from "bun:test";
import * as z from "zod/mini";

import { zFallback } from "./zod-fallback";

it("returns fallback when top-level input is invalid", () => {
  const schema = zFallback(
    z.object({
      count: z.number(),
      label: z.string(),
    }),
    {
      count: 3,
      label: "default",
    },
  );

  expect(schema.parse("oops")).toEqual({
    count: 3,
    label: "default",
  });
});

it("supports nested properties", () => {
  const schema = zFallback(
    z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
    }),
    {
      user: {
        name: "Anonymous",
        age: 0,
      },
    },
  );

  expect(
    schema.parse({
      user: {
        name: "Alice",
        age: "not a number",
      },
    }),
  ).toEqual({
    user: {
      name: "Alice",
      age: 0,
    },
  });
});
