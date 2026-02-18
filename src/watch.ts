import chokidar from "chokidar";
import { isAbsolute, resolve } from "path";
import type { CLIOptionsDef, TSConfigMin } from "./types.js";
import { loadConfig } from "./util.js";
import { BaseCliOptions, DefaultBaseOptions, type BaseOptions } from "./base-options.js";
import { glob } from "fs/promises";

export interface WatchOptions extends BaseOptions {
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
}

export const DefaultWatchOptions: Required<WatchOptions> = {
    ...DefaultBaseOptions,
    dir: process.cwd(),
    // default is tsconfig outDir, so this **must be empty**
    watch: "",
    delay: 1500,
    exclude: [],
    preventInitialBuild: false,
};

export const WatchCliOptions: CLIOptionsDef<WatchOptions> = {
    ...BaseCliOptions,
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

export async function watch(
    userOptions: WatchOptions,
    onChange: (abortSignal: AbortSignal, initial: boolean) => void,
) {
    const { exclude, delay, dir, preventInitialBuild, watch } = {
        ...DefaultWatchOptions,
        ...userOptions,
    };
    const tsConfig = loadConfig<TSConfigMin>(dir, "tsconfig.json");
    const ignoredPatterns = [...DEFAULT_EXCLUDE, ...(exclude || [])];

    let watchPatterns: string[] = [];

    if (watch) {
        watchPatterns = Array.isArray(watch) ? watch : [watch];
    } else {
        if (tsConfig.compilerOptions?.outDir) {
            watchPatterns.push(tsConfig.compilerOptions.outDir);
        } else {
            watchPatterns.push("dist");
        }
        watchPatterns.push(".env", ".env.local", ".env.development", ".env.development.local");
    }

    watchPatterns = watchPatterns.map((w) => (isAbsolute(w) ? w : resolve(dir, w)));

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
        if (!abortSignal.aborted) {
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
                initial ? 0 : delay,
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
