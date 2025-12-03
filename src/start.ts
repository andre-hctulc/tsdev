import type { CLIOptionsDef, PackageJSONMin } from "./types.js";
import { loadConfig, proc, errorLog, successLog, propagateOptions, getDefaultOptions } from "./util.js";
import { BaseCliOptions, DefaultBaseOptions, type BaseOptions } from "./base-options.js";

export interface StartOptions extends BaseOptions {
    dir?: string;
    main?: string;
    nodeOptions?: string[];
}

export const DefaultStartOptions: Required<StartOptions> = {
    ...DefaultBaseOptions,
    dir: process.cwd(),
    main: "dist/main.js",
    nodeOptions: [],
};

export const StartCliOptions: CLIOptionsDef<StartOptions> = {
    ...BaseCliOptions,
    dir: { flags: "-d, --dir [path]", description: "Nest app directory" },
    main: { flags: "-m, --main [path]", description: "Main file to run (default: dist/main.js)" },
    nodeOptions: {
        flags: "-n, --node-options [options...]",
        description: "Node.js options to pass to the process (e.g. --inspect)",
    },
};

export async function start(userOptions: StartOptions) {
    const { dir, main, nodeOptions } = {
        ...DefaultStartOptions,
        ...getDefaultOptions(userOptions.profile),
        ...userOptions,
    };
    const pkgJson = loadConfig<PackageJSONMin>(dir, "package.json");
    const runFile = userOptions?.main || pkgJson.name || main;

    // TS Compile
    const runProc = proc("node", [...propagateOptions(nodeOptions), runFile], {
        cwd: dir,
    });

    runProc.on("exit", (code) => {
        if (code !== 0) {
            errorLog(`Process exited with code ${code}.`);
        } else {
            successLog("Process completed successfully.");
        }
    });
}
