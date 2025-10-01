import chokidar from "chokidar";
import { BuildCliOptions } from "./build.js";
import { isAbsolute, join, resolve } from "path";
import type { CLIOptionsDef, TSConfigMin } from "./types.js";
import { loadConfig } from "./util.js";

export interface WatchOptions {
    dir?: string;
    watch?: string | string[];
    exclude?: string | string[];
    /**
     * Delay in milliseconds before triggering change event after a change.
     */
    delay?: number;
    /**
     * Prevent initial build on start.
     */
    preventInitialBuild?: boolean;
    onChange?: (abortSignal: AbortSignal, initial: boolean) => void;
}

export const DefaultWatchOptions: Required<WatchOptions> = {
    dir: process.cwd(),
    watch: "src",
    delay: 1500,
    exclude: [],
    preventInitialBuild: false,
    onChange: () => {},
};

export const WatchCliOptions: CLIOptionsDef<WatchOptions> = {
    ...BuildCliOptions,
    watch: { flags: "-w, --watch", description: "Files or directories to watch for changes." },
    delay: {
        flags: "--delay [ms]",
        description: "Delay in milliseconds before triggering change event after a change.",
    },
    exclude: {
        flags: "-x, --exclude [patterns...]",
        description: "Patterns to exclude from watching. Defaults to '**/node_modules/**'.",
    },
    preventInitialBuild: {
        flags: "--pib, --prevent-initial-build",
        description: "Prevent initial build on start.",
    },
};

const DEFAULT_EXCLUDE = ["**/node_modules/**"];

export async function watch(userOptions: WatchOptions) {
    const { exclude, watch, delay, onChange, dir, preventInitialBuild } = {
        ...DefaultWatchOptions,
        ...userOptions,
    };
    const tsConfig = loadConfig<TSConfigMin>(dir, "tsconfig.json");
    const ignoredPatterns = [...DEFAULT_EXCLUDE, ...(exclude || [])];

    const inp = userOptions.watch || tsConfig.compilerOptions?.outDir || "src";
    const inpArray = Array.isArray(inp) ? inp : [inp];
    const watchPatterns = inpArray.map((w) => (isAbsolute(w) ? w : resolve(join(dir, w))));
    const watcher = chokidar.watch(watchPatterns, {
        ignored: ignoredPatterns,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 10,
        },
    });

    let timeout: { to: NodeJS.Timeout; abortController: AbortController } | null = null;

    const triggerChange = async (abortSignal: AbortSignal, initial: boolean) => {
        if (abortSignal.aborted) {
            onChange?.(abortSignal, initial);
            return;
        }
    };

    const debounceChange = (initial?: boolean) => {
        if (timeout) {
            clearTimeout(timeout.to);
            timeout.abortController.abort();
        }
        const abortController = new AbortController();
        timeout = {
            to: setTimeout(
                () => {
                    triggerChange(abortController.signal, !!initial);
                },
                initial ? 0 : delay
            ),
            abortController,
        };
    };

    watcher
        .on("add", (path) => {
            debounceChange();
        })
        .on("change", (path) => {
            debounceChange();
        })
        .on("unlink", (path) => {
            debounceChange();
        });

    console.log("🔍 Watching for file changes");

    if (!preventInitialBuild) {
        debounceChange(true);
    }
}
