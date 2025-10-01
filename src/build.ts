import { existsSync, statSync } from "fs";
import type { CLIOptionsDef, TSConfigMin } from "./types.js";
import { promisifyProcess, loadConfig, errorExit, proc, errorLog, propagateOptions } from "./util.js";
import { rm } from "fs/promises";

export interface BuildOptions {
    dir?: string;
    tscOptions?: string[];
    output?: string;
    tscAliasOptions?: string[];
    _abortSignal?: AbortSignal;
    _watchMode?: boolean;
    clearDistDir?: boolean;
}

export const DefaultBuildOptions: Required<BuildOptions> = {
    dir: process.cwd(),
    tscOptions: [],
    tscAliasOptions: [],
    _abortSignal: new AbortController().signal,
    _watchMode: false,
    clearDistDir: false,
    output: "dist",
};

export const BuildCliOptions: CLIOptionsDef<BuildOptions> = {
    dir: {
        flags: "-d, --dir [path]",
        description: "Directory to run the build in (default: current working directory).",
    },
    tscOptions: {
        flags: "--tsc, --tsc-options [options...]",
        description: "TypeScript compiler options to pass to tsc.",
    },
    tscAliasOptions: {
        flags: "--tsca, --tsc-alias-options [options...]",
        description: "tsc-alias options",
    },
    output: { flags: "-o, --output [path]", description: "Output directory for the build (default: dist)." },
    clearDistDir: {
        flags: "-c, --clear-dist-dir",
        description: "Clear the output directory before building.",
    },
};

export async function build(userOptions: BuildOptions): Promise<boolean> {
    const {
        dir,
        tscAliasOptions,
        tscOptions,
        _abortSignal: abortSignal,
        _watchMode,
        clearDistDir,
        output,
    } = {
        ...DefaultBuildOptions,
        ...userOptions,
    };
    const tsConfig = loadConfig<TSConfigMin>(dir, "tsconfig.json");
    const paths = tsConfig.compilerOptions?.paths;
    const outputDir = userOptions.output || tsConfig.compilerOptions?.outDir || DefaultBuildOptions.output;

    if (clearDistDir && existsSync(outputDir) && statSync(outputDir).isDirectory()) {
        // Clear the dist directory
        await rm(output, { recursive: true, force: true });
    }

    // TS Compile
    const opts = propagateOptions(tscOptions);
    if (_watchMode) {
        opts.unshift("--incremental");
    }
    const compileProc = proc("npx", ["--yes", "tsc", ...opts], { cwd: dir, signal: abortSignal });
    const compiled = await promisifyProcess(compileProc);

    if (abortSignal?.aborted) {
        return false;
    }

    if (compiled !== 0) {
        if (_watchMode) {
            errorLog(`TypeScript compilation failed, waiting for changes...`);
            return false;
        } else {
            errorExit(`TypeScript compilation failed with exit code ${compiled}.`);
        }
    }

    if (paths && Object.keys(paths).length > 0) {
        // tsc-alias
        const aliasProc = proc("npx", ["--yes", "tsc-alias", ...propagateOptions(tscAliasOptions)], {
            cwd: dir,
            signal: abortSignal,
        });
        const aliased = await promisifyProcess(aliasProc);

        if (abortSignal?.aborted) {
            return false;
        }

        if (aliased !== 0) {
            errorExit(`tsc-alias failed with exit code ${aliased}. Is tsc-alias installed?`);
        }
    }

    return true;
}
