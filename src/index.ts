import { createUnplugin, UnpluginInstance } from "unplugin";

import type { Options } from "./core/index.js";
import { unpluginFactory } from "./core/index.js";

export type { Options };
export { unpluginFactory };
export type { Field } from "./core/field.js";
export { envField } from "./core/field.js";

export const unplugin: UnpluginInstance<Options> =
  createUnplugin(unpluginFactory);

export default unplugin;
