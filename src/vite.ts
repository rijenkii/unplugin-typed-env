import { Plugin } from "vite";

import { Options, unplugin } from "./index.js";

const default_: (options: Options) => Plugin<unknown> | Plugin<unknown>[] =
  unplugin.vite;

export default default_;
