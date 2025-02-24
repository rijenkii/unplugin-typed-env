import * as fs from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import * as gen from "../generators.js";
import { unpluginFactory } from "../index.js";

vi.mock("../generators.js", { spy: true });
vi.mock("node:fs", { spy: true });

afterEach(() => vi.resetAllMocks());

describe("unpluginFactory", () => {
  it("works", () => {
    const genDef = vi.mocked(gen.dts).mockReturnValue("def");
    const genJs = vi.mocked(gen.js).mockReturnValue("js");
    const write = vi.mocked(fs.writeFileSync).mockReturnValue();

    const result = unpluginFactory({ schema: {}, dts: "dts" });

    expect(genDef).toHaveBeenCalledExactlyOnceWith({});
    expect(write).toHaveBeenCalledExactlyOnceWith("dts", "def");
    expect(genJs).toHaveBeenCalledExactlyOnceWith({});

    expect(result.resolveId("test")).toBe(undefined);
    expect(result.resolveId("virtual:typed-env")).toBe("\0virtual:typed-env");
    expect(result.load("test")).toBe(undefined);
    expect(result.load("\0virtual:typed-env")).toBe("js");
  });
});
