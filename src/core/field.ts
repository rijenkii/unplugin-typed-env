export type Field = {
  /**
   * Type of the parsed field that will be inserted into the generated `.d.ts` file.
   * @example "'enum1' | 'enum2' | undefined"
   */
  type: string;

  /**
   * Parse an environment variable, ensure its type and format and return source code
   * to be inserted into the generated virtual `.js` file.
   *
   * @param raw Raw environment variable.
   * @returns JavaScript source to be inserted into the generated file.
   */
  parse: (raw: string | undefined) => string;
};

type BaseOptions<Default> =
  | { optional?: false; default?: never }
  | { optional: true; default?: Default };

function makeType(baseType: string, options?: BaseOptions<unknown>) {
  return (
    baseType + (options?.optional && !options.default ? " | undefined" : "")
  );
}

function makeParse<T, O extends BaseOptions<T>>(
  options: O | undefined,
  rawToValue: (raw: string) => T,
  valueToSrc: (value: T) => string = (value) => JSON.stringify(value),
) {
  return (raw: string | undefined): string => {
    const value = raw === undefined ? undefined : rawToValue(raw);

    if (options?.optional) {
      const defaulted = value ?? options.default;
      if (defaulted === undefined) {
        return "undefined";
      } else {
        return valueToSrc(defaulted);
      }
    } else if (value === undefined) {
      throw new Error("Required");
    } else {
      return valueToSrc(value);
    }
  };
}

export const envField = {
  string: (
    options?: BaseOptions<string> & { minLength?: number; maxLength?: number },
  ): Field => ({
    type: makeType("string", options),
    parse: makeParse(options, (raw) => {
      const { minLength, maxLength } = options ?? {};
      const value = raw;

      if (minLength !== undefined && value.length <= minLength) {
        throw new Error(`Min length ${minLength}, got ${value.length}`);
      }
      if (maxLength !== undefined && value.length >= maxLength) {
        throw new Error(`Max length ${maxLength}, got ${value.length}`);
      }

      return value;
    }),
  }),

  url: (
    options?: BaseOptions<URL> & { minLength?: number; maxLength?: number },
  ): Field => ({
    type: makeType("URL", options),
    parse: makeParse(options, (raw) => {
      const { minLength, maxLength } = options ?? {};
      const value = raw;

      if (minLength !== undefined && value.length <= minLength) {
        throw new Error(`Min length ${minLength}, got ${value.length}`);
      }
      if (maxLength !== undefined && value.length >= maxLength) {
        throw new Error(`Max length ${maxLength}, got ${value.length}`);
      }

      return new URL(value);
    }),
  }),

  number: (
    options?: BaseOptions<number> & { min?: number; max?: number },
  ): Field => ({
    type: makeType("number"),
    parse: makeParse(options, (raw) => {
      const { min, max } = options ?? {};
      const value = parseFloat(raw);

      if (isNaN(value)) {
        throw new Error("Invalid number");
      }
      if (min !== undefined && value <= min) {
        throw new Error(`Min value ${min}, got ${value}`);
      }
      if (max !== undefined && value >= max) {
        throw new Error(`Max value ${max}, got ${value}`);
      }

      return value;
    }),
  }),

  boolean: (options?: BaseOptions<boolean>): Field => ({
    type: makeType("boolean"),
    parse: makeParse(options, (raw) => {
      if (raw === "true") return true;
      if (raw === "false") return false;

      throw new Error(
        `Invalid boolean, expected "true" or "false", got ${JSON.stringify(raw)}`,
      );
    }),
  }),

  enum: <U extends string, T extends [U, ...U[]]>(
    variants: T,
    options?: BaseOptions<T[number]>,
  ): Field => ({
    type: makeType(variants.map((x) => JSON.stringify(x)).join(" | ")),
    parse: makeParse(options, (raw) => {
      if (!variants.includes(raw as T[number])) {
        throw new Error(
          `Invalid enum value, expected one of ${JSON.stringify(variants)}, got ${JSON.stringify(raw)}`,
        );
      }
      return raw as T[number];
    }),
  }),
};
