import { createUnplugin } from "unplugin";

import { unpluginFactory } from "./core/index.js";

export { unpluginFactory };
export type { Field } from "./core/field.js";
export { envField } from "./core/field.js";
export type { Options } from "./core/index.js";

export const unplugin = createUnplugin(unpluginFactory);

export default unplugin;
