import { afterEach, describe, expect, it, vi } from "vitest";

import { envField, makeParse, makeType } from "../field.js";

describe("makeType", () => {
  it("makes required type when optional is off", () => {
    expect(makeType("string")).toBe("string");
  });

  it("makes optional type when optional is on and default is undefined", () => {
    expect(makeType("string", { optional: true })).toBe("string | undefined");
  });

  it("makes required type when optional is on and default is set", () => {
    expect(makeType("string", { optional: true, default: "123" })).toBe(
      "string",
    );
  });
});

describe("makeParse", () => {
  afterEach(vi.resetAllMocks);

  const rawToValue = vi.fn(() => "value");
  const valueToSrc = vi.fn(() => "src");

  it("required field, undefined value throws", () => {
    expect(() =>
      makeParse(undefined, rawToValue, valueToSrc)(undefined),
    ).toThrow("Required");

    expect(rawToValue).not.toHaveBeenCalled();
    expect(valueToSrc).not.toHaveBeenCalled();
  });

  it("required field, set value returns src", () => {
    const result = makeParse(undefined, rawToValue, valueToSrc)("raw");

    expect(rawToValue).toHaveBeenCalledExactlyOnceWith("raw");
    expect(valueToSrc).toHaveBeenCalledExactlyOnceWith("value");
    expect(result).toBe("src");
  });

  it("optional field, undefined value returns undefined", () => {
    const result = makeParse(
      { optional: true },
      rawToValue,
      valueToSrc,
    )(undefined);

    expect(rawToValue).not.toHaveBeenCalled();
    expect(valueToSrc).not.toHaveBeenCalled();
    expect(result).toBe("undefined");
  });

  it("optional field, set value returns src", () => {
    const result = makeParse({ optional: true }, rawToValue, valueToSrc)("raw");

    expect(rawToValue).toHaveBeenCalledExactlyOnceWith("raw");
    expect(valueToSrc).toHaveBeenCalledExactlyOnceWith("value");
    expect(result).toBe("src");
  });

  it("optional field with default, undefined value returns default", () => {
    const result = makeParse(
      { optional: true, default: "default" },
      rawToValue,
      valueToSrc,
    )(undefined);

    expect(rawToValue).not.toHaveBeenCalled();
    expect(valueToSrc).toHaveBeenCalledExactlyOnceWith("default");
    expect(result).toBe("src");
  });

  it("optional field with default, set value returns src", () => {
    const result = makeParse(
      { optional: true, default: "default" },
      rawToValue,
      valueToSrc,
    )("raw");

    expect(rawToValue).toHaveBeenCalledExactlyOnceWith("raw");
    expect(valueToSrc).toHaveBeenCalledExactlyOnceWith("value");
    expect(result).toBe("src");
  });

  it("default valueToSrc returns JSON", () => {
    const result = makeParse(undefined, rawToValue)("raw");

    expect(rawToValue).toHaveBeenCalledExactlyOnceWith("raw");
    expect(result).toBe('"value"');
  });
});

describe("string", () => {
  it("generates expected type", () => {
    const field = envField.string();
    expect(field.type).toBe("string");
  });

  it("rejects short strings", () => {
    const field = envField.string({ minLength: 1 });
    expect(() => field.parse("")).toThrow("Min length 1, got 0");
  });

  it("rejects long strings", () => {
    const field = envField.string({ maxLength: 0 });
    expect(() => field.parse("a")).toThrow("Max length 0, got 1");
  });

  it("returns valid string", () => {
    const field = envField.string();
    const result = field.parse("value");
    expect(result).toBe('"value"');
  });
});

describe("url", () => {
  it("generates expected type", () => {
    const field = envField.url();
    expect(field.type).toBe("URL");
  });

  it("rejects short urls", () => {
    const field = envField.url({ minLength: 1 });
    expect(() => field.parse("")).toThrow("Min length 1, got 0");
  });

  it("rejects long urls", () => {
    const field = envField.url({ maxLength: 0 });
    expect(() => field.parse("a")).toThrow("Max length 0, got 1");
  });

  it("rejects invalid urls", () => {
    const field = envField.url();
    expect(() => field.parse("a")).toThrow("Invalid URL");
  });

  it("returns valid normalized urls", () => {
    const field = envField.url();
    const result = field.parse("https://example.org");
    expect(result).toBe('new URL("https://example.org/")');
  });
});

describe("number", () => {
  it("generates expected type", () => {
    const field = envField.number();
    expect(field.type).toBe("number");
  });

  it("rejects invalid numbers", () => {
    const field = envField.number();
    expect(() => field.parse("hello")).toThrow("Invalid number");
  });

  it("rejects small numbers", () => {
    const field = envField.number({ min: 1 });
    expect(() => field.parse("0")).toThrow("Min value 1, got 0");
  });

  it("rejects large numbers", () => {
    const field = envField.number({ max: 0 });
    expect(() => field.parse("1")).toThrow("Max value 0, got 1");
  });

  it("returns valid numbers", () => {
    const field = envField.number();
    const result = field.parse("1");
    expect(result).toBe("1");
  });
});

describe("boolean", () => {
  it("generates expected type", () => {
    const field = envField.boolean();
    expect(field.type).toBe("boolean");
  });

  it("rejects invalid booleans", () => {
    const field = envField.boolean();
    expect(() => field.parse("yes")).toThrow(
      'Invalid boolean, expected "true" or "false", got "yes"',
    );
  });

  it("returns valid booleans", () => {
    const field = envField.boolean();
    const resultTrue = field.parse("true");
    expect(resultTrue).toBe("true");

    const resultFalse = field.parse("false");
    expect(resultFalse).toBe("false");
  });
});

describe("enum", () => {
  it("generates expected type", () => {
    const field = envField.enum(["value1", "value2"]);
    expect(field.type).toBe('"value1" | "value2"');
  });

  it("rejects invalid enums", () => {
    const field = envField.enum(["value1", "value2"]);
    expect(() => field.parse("value3")).toThrow(
      'Invalid enum value, expected one of ["value1","value2"], got "value3"',
    );
  });

  it("returns valid enums", () => {
    const field = envField.enum(["value1", "value2"]);
    const result = field.parse("value1");
    expect(result).toBe('"value1"');
  });
});
