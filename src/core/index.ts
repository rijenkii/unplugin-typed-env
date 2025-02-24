import * as fs from "node:fs";

import type { UnpluginFactory } from "unplugin";

import type { Field } from "./field.js";
import * as gen from "./generators.js";

const virtualModuleId = "virtual:typed-env";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export type Options = {
  /** Schema for the environment variable validation. */
  schema: Record<string, Field>;
  /**
   * Location of the generated `.d.ts` file with configuration module type declarations.
   * @default "./typed-env.d.ts"
   */
  dts?: string;
};

export const unpluginFactory: (options: Options) => {
  name: string;
  resolveId: (id: string) => string | undefined;
  load: (id: string) => string | undefined;
} = (({ schema, dts = "./typed-env.d.ts" }) => {
  const dtsSrc = gen.dts(schema);
  fs.writeFileSync(dts, dtsSrc);

  const jsSrc = gen.js(schema);

  function resolveId(id: string) {
    if (id !== virtualModuleId) return;
    return resolvedVirtualModuleId;
  }

  function load(id: string) {
    if (id !== resolvedVirtualModuleId) return;
    return jsSrc;
  }

  return {
    name: "unplugin-typed-env",
    resolveId,
    load,
  };
}) satisfies UnpluginFactory<Options>;
