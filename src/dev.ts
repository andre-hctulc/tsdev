import { DefaultBuildOptions, type BuildOptions } from "./build.js";
import { StartCliOptions, StartRunOptions, type StartOptions } from "./start.js";
import type { CLIOptionsDef, PackageJSONMin, TSConfigMin } from "./types.js";
import { loadConfig, propagateOptions } from "./util.js";
import concurrently from "concurrently";

export interface DevOptions extends StartOptions, BuildOptions {
    nodemonOptions?: string[];
}

export const DefaultDevOptions: Required<DevOptions> = {
    ...DefaultBuildOptions,
    ...StartRunOptions,
    nodeOptions: ["--inspect"],
    nodemonOptions: [],
};

export const DevCliOptions: CLIOptionsDef<DevOptions> = {
    ...StartCliOptions,
    nodemonOptions: {
        flags: "--nodemon-options [options...]",
        description: "Nodemon options to pass to the process (e.g. --watch out)",
    },
};

export async function dev(userOptions: DevOptions) {
    const { nodeOptions, dir, tscOptions, nodemonOptions, main } = { ...DefaultDevOptions, ...userOptions };
    const tsConfig = loadConfig<TSConfigMin>(dir, "tsconfig.json");
    const pkg = loadConfig<PackageJSONMin>(dir, "package.json");
    const paths = Object.keys(tsConfig.compilerOptions?.paths || {});
    const mainFile = userOptions?.main || pkg.name || main;

    const tscArgs = ["--watch", "--incremental", ...propagateOptions(tscOptions)];

    const nodeArgs = [...propagateOptions(nodeOptions), mainFile];
    if (paths.length) {
        nodeArgs.unshift("-r tsconfig-paths/register");
    }

    const nodemonArgs = [
        "--delay 1.5",
        ...propagateOptions(nodemonOptions),
        `--exec "node ${nodeArgs.join(" ")}"`,
    ];

    concurrently([
        { name: "tsc", command: `npx -y tsc ${tscArgs.join(" ")}`, cwd: dir },
        {
            name: "run",
            command: `npx -y nodemon ${nodemonArgs.join(" ")}`,
            cwd: dir,
        },
    ]);
}
