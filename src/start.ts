import type { CLIOptionsDef, PackageJSONMin } from "./types.js";
import { loadConfig, proc, errorLog, successLog, propagateOptions } from "./util.js";

export interface StartOptions {
    dir?: string;
    main?: string;
    nodeOptions?: string[];
    _abortSignal?: AbortSignal;
    _watchMode?: boolean;
}

export const StartRunOptions: Required<StartOptions> = {
    dir: process.cwd(),
    main: "dist/main.js",
    nodeOptions: [],
    _abortSignal: new AbortController().signal,
    _watchMode: false,
};

export const StartCliOptions: CLIOptionsDef<StartOptions> = {
    dir: { flags: "-d, --dir [path]", description: "Nest app directory" },
    main: { flags: "-m, --main [path]", description: "Main file to run (default: dist/main.js)" },
    nodeOptions: {
        flags: "-n, --node-options [options...]",
        description: "Node.js options to pass to the process (e.g., --inspect)",
    },
};

export async function start(userOptions: StartOptions) {
    const {
        dir,
        main,
        _abortSignal: abortSignal,
        _watchMode,
        nodeOptions,
    } = { ...StartRunOptions, ...userOptions };
    const pkgJson = loadConfig<PackageJSONMin>(dir, "package.json");
    const runFile = userOptions?.main || pkgJson.name || main;

    // TS Compile
    const runProc = proc("node", [...propagateOptions(nodeOptions), runFile], {
        cwd: dir,
        signal: abortSignal,
    });

    runProc.on("exit", (code) => {
        if (code === null && _watchMode) {
            console.log("🚀 Restarting...");
        } else if (code !== 0) {
            errorLog(`Process exited with code ${code}.`);
        } else {
            successLog("Process completed successfully.");
        }
    });
}
