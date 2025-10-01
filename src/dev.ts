import { build, DefaultBuildOptions, type BuildOptions } from "./build.js";
import { StartCliOptions, StartRunOptions, start, type StartOptions } from "./start.js";
import type { CLIOptionsDef } from "./types.js";
import { DefaultWatchOptions, watch, WatchCliOptions, type WatchOptions } from "./watch.js";

export interface DevOptions extends WatchOptions, StartOptions, BuildOptions {}

export const DefaultDevOptions: Required<DevOptions> = {
    ...DefaultBuildOptions,
    ...DefaultWatchOptions,
    ...StartRunOptions,
    nodeOptions: ["--inspect"],
};

export const DevCliOptions: CLIOptionsDef<DevOptions> = {
    ...StartCliOptions,
    ...WatchCliOptions,
};

export async function dev(userOptions: DevOptions) {
    const { nodeOptions, dir, watch: _watch } = { ...DefaultDevOptions, ...userOptions };

    let preAbortController: AbortController | null = null;
    let started = false;
    // always add --watch to tsc options
    await build({ ...userOptions, tscOptions: ["--watch", ...(userOptions.tscOptions || [])] });

    await watch({
        ...userOptions,
        onChange: (abortSignal) => {
            if (!started) {
                console.log("🚀 Starting...");
            }

            started = true;
            preAbortController?.abort();

            const abortController = new AbortController();
            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    abortController.abort();
                });
            }
            preAbortController = abortController;

            // restart
            start({ nodeOptions, ...userOptions, _watchMode: true, _abortSignal: abortController.signal });
        },
    });
}
