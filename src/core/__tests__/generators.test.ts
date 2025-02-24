import { afterEach, describe, expect, it, vi } from "vitest";

import { dts, js } from "../generators.js";

afterEach(() => vi.unstubAllEnvs());

describe("dts", () => {
  it("generates empty module when schema is empty", () => {
    const result = dts({});
    expect(result).toMatchSnapshot();
  });

  it("generates module with fields when schema is not empty", () => {
    const result = dts({
      FIELD_NAME_1: { type: "fieldType | fieldOtherType", parse: () => "" },
      FIELD_NAME_2: { type: "string", parse: () => "" },
    });
    expect(result).toMatchSnapshot();
  });
});

describe("js", () => {
  it("generates empty module when schema is empty", () => {
    const result = js({});
    expect(result).toMatchSnapshot();
  });

  it("throws when field validation fails", () => {
    const parse = vi.fn(() => {
      throw new Error("Required");
    });
    vi.stubEnv("FIELD_NAME_1", "value");

    expect(() =>
      js({
        FIELD_NAME_1: { type: "", parse },
      }),
    ).toThrow(
      new Error('Error while parsing field "FIELD_NAME_1"', {
        cause: new Error("Required"),
      }),
    );
    expect(parse).toHaveBeenCalledExactlyOnceWith("value");
  });

  it("generates module with parsed fields when schema is not empty", () => {
    const parse1 = vi.fn(() => "parsedValue1");
    const parse2 = vi.fn(() => "parsedValue2");
    vi.stubEnv("FIELD_NAME_1", "value1");
    vi.stubEnv("FIELD_NAME_2", "value2");
    const result = js({
      FIELD_NAME_1: { type: "", parse: parse1 },
      FIELD_NAME_2: { type: "", parse: parse2 },
    });
    expect(parse1).toHaveBeenCalledExactlyOnceWith("value1");
    expect(parse2).toHaveBeenCalledExactlyOnceWith("value2");
    expect(result).toMatchSnapshot();
  });
});
