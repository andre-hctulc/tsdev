import { BuildCliOptions, DefaultBuildOptions, type BuildOptions } from "./build.js";
import { StartCliOptions, DefaultStartOptions, type StartOptions } from "./start.js";
import type { CLIOptionsDef, PackageJSONMin, TSConfigMin } from "./types.js";
import {
    errorLog,
    getDefaultOptions,
    loadConfig,
    proc,
    promisifyProcess,
    propagateOptions,
    successLog,
} from "./util.js";
import { DefaultWatchOptions, watch, WatchCliOptions, type WatchOptions } from "./watch.js";

export interface DevOptions extends BuildOptions, StartOptions, WatchOptions {}

export const DefaultDevOptions: Required<DevOptions> = {
    ...DefaultBuildOptions,
    ...DefaultStartOptions,
    ...DefaultWatchOptions,
};

export const DevCliOptions: CLIOptionsDef<DevOptions> = {
    ...BuildCliOptions,
    ...StartCliOptions,
    ...WatchCliOptions,
};

export async function dev(userOptions: DevOptions) {
    const { nodeOptions, dir, tscOptions, tscAliasOptions, main } = {
        ...DefaultDevOptions,
        ...getDefaultOptions(userOptions.profile),
        ...userOptions,
    };

    const tsConfig = loadConfig<TSConfigMin>(dir, "tsconfig.json");
    const pkg = loadConfig<PackageJSONMin>(dir, "package.json");

    const paths = Object.keys(tsConfig.compilerOptions?.paths || {});
    const mainFile = main || pkg.main || "dist/main.js";

    const tscArgs = ["--watch", "--incremental", ...propagateOptions(tscOptions)];

    const nodeArgs = ["--inspect", ...propagateOptions(nodeOptions)];

    let currentAbortController: AbortController | null = null;
    let started = false;

    console.log("🛠  Building in watch mode...");
    proc("npx", ["-y", "tsc", ...tscArgs], { cwd: dir, stdio: "ignore" });

    watch(userOptions, async () => {
        currentAbortController?.abort();
        const abortController = new AbortController();
        currentAbortController = abortController;

        if (paths.length) {
            console.log("🛠  Updating paths...");
            const aliasProc = proc("npx", ["-y", "tsc-alias", ...propagateOptions(tscAliasOptions)], {
                cwd: dir,
                signal: abortController.signal,
                stdio: "ignore",
            });

            const aliasResult = await promisifyProcess(aliasProc).catch(() => {
                errorLog("Path aliasing failed. Waiting for changes...");
            });

            if (aliasResult !== 0) {
                return;
            }
        }

        console.log(started ? "🚀 Restarting..." : "🚀 Starting...");

        const runProc = proc("node", [...nodeArgs, mainFile], {
            cwd: dir,
            signal: abortController.signal,
        });

        promisifyProcess(runProc)
            .catch((err) => {
                errorLog("Run process failed. Waiting for changes...");
            })
            .then((result) => {
                if (result === 0) {
                    successLog("Run process finished...");
                }
            });

        started = true;
    });
}
