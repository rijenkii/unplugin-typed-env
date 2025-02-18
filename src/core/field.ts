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
  | {
      /**
       * Make the field optional.
       * @default false
       */
      optional?: false;
      default?: never;
    }
  | {
      optional: true;
      /**
       * Default value to use in case the environment variable was not set.
       * @default undefined
       */
      default?: Default;
    };

/**
 * Generate a source of a TypeScript type for the field based on the base type
 * and field options.
 * 
 * @param baseType Base TypeScript field type.
 * @param options Field options passed by the user.
 * @returns 

* @example
 * ```typescript
 * > makeType("string")
 * "string"
 * 
 * > makeType("number", { optional: true })
 * "number | undefined"
 * 
 * > makeType('"value1" | "value2"', { optional: true, default: "value2" })
 * '"value1" | "value2"'
 * ```
 */
export function makeType(
  baseType: string,
  options?: BaseOptions<unknown>,
): string {
  return (
    baseType + (options?.optional && !options.default ? " | undefined" : "")
  );
}

/**
 * Generate a function to parse environment variable and return the source code
 * to embed into the generated JS file.
 *
 * @typeParam T Type of the parsed value.
 * @typeParam O Type of the field options.
 * @param options Field options passed by the user.
 * @param rawToValue Function for parsing and converting the raw string from the
 *                   environment into the value of type T.
 * @param valueToSrc Function for convering the value of type T into the source
 *                   string.
 * @returns Function, receiving raw env variable and returning value source code.
 */
export function makeParse<T, O extends BaseOptions<T>>(
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
  /**
   * Ensure that the environment variable is a valid string.
   *
   * @param options Field options.
   * @returns String field.
   */
  string: (
    options?: BaseOptions<string> & {
      /**
       * Minimum allowed string length, inclusive.
       */
      minLength?: number;
      /**
       * Maximum allowed string length, inclusive.
       */
      maxLength?: number;
    },
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

  /**
   * Ensure that the environment variable is a valid URL.
   *
   * @param options Field options.
   * @returns URL field.
   */
  url: (
    options?: BaseOptions<URL> & {
      /**
       * Minimum allowed URL length, inclusive.
       */
      minLength?: number;
      /**
       * Maximum allowed URL length, inclusive.
       */
      maxLength?: number;
    },
  ): Field => ({
    type: makeType("URL", options),
    parse: makeParse(
      options,
      (raw) => {
        const { minLength, maxLength } = options ?? {};
        const value = raw;

        if (minLength !== undefined && value.length <= minLength) {
          throw new Error(`Min length ${minLength}, got ${value.length}`);
        }
        if (maxLength !== undefined && value.length >= maxLength) {
          throw new Error(`Max length ${maxLength}, got ${value.length}`);
        }

        return new URL(value);
      },
      (value) => `new URL(${JSON.stringify(value)})`,
    ),
  }),

  /**
   * Ensure that the environment variable is a valid URL.
   *
   * @param options Field options.
   * @returns Number field.
   */
  number: (
    options?: BaseOptions<number> & {
      /**
       * Minimum allowed value, inclusive.
       */
      min?: number;
      /**
       * Maximum allowed value, inclusive.
       */
      max?: number;
    },
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

  /**
   * Ensure that the environment variable is a valid boolean.
   * Allowed values: "true", "false".
   *
   * @param options Field options.
   * @returns Boolean field.
   */
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

  /**
   * Ensure that the environment variable is a valid string enum.
   *
   * @param variants List of allowed values.
   * @param options Field options.
   * @returns String enum field.
   */
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
