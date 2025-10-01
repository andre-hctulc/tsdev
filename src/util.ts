import { ChildProcess, spawn, type SpawnOptions } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import type { CLIOptionsDef } from "./types.js";
import type { Command, Option } from "commander";

export function loadConfig<T>(...path: string[]): T {
    const p = join(...path);
    try {
        const str = readFileSync(p, "utf-8");
        return JSON.parse(str);
    } catch (e) {
        errorExit(`Failed to load config from ${p}:\n${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * @returns The exit code
 */
export async function promisifyProcess(proc: ChildProcess): Promise<number | null> {
    try {
        return await new Promise((resolve) => {
            proc.on("exit", (code) => {
                resolve(code);
            });
            proc.on("error", (err) => {
                resolve(null);
            });
        });
    } catch (err) {
        return null;
    }
}

export function addOptions<T extends object>(cmd: Command, obj: T, def: CLIOptionsDef<T>) {
    Object.entries(def).forEach(([key, option]) => {
        let o: Option = option as Option;
        const defaultValue = obj[key as keyof T] as any;

        if (!o?.flags || defaultValue === undefined) {
            return;
        }
        cmd.option(
            o.flags,
            o.description,
            typeof defaultValue === "number" ? String(defaultValue) : defaultValue
        );
    });
}

export function parseOptions<T extends object>(options: Record<string, any>, obj: T): T {
    const result: T = { ...obj };

    Object.entries(options).forEach(([key, optionValue]) => {
        const k = key as keyof T;
        const objValue = obj[k];

        if (objValue === undefined) {
            return;
        }

        if (typeof objValue === "number") {
            result[k] = optionValue ? parseFloat(optionValue) : (objValue as any);
        } else {
            result[k] = optionValue;
        }
    });

    return result as T;
}

export function errorExit(message: string, code = 1): never {
    errorLog(message);
    process.exit(code);
}

export function errorLog(message: string) {
    console.error(`🔴 ${message}`);
}

export function successLog(message: string) {
    console.error(`✅ ${message}`);
}

export function proc(command: string, args: string[] = [], options: SpawnOptions): ChildProcess {
    console.log(`> ${command} ${args.join(" ")}`);
    const child = spawn(command, args, { stdio: "inherit", ...options });

    let sigint: NodeJS.SignalsListener;
    let exit: NodeJS.SignalsListener;
    let sigterm: NodeJS.SignalsListener;

    process.on(
        "exit",
        (exit = () => {
            cleanup();
        })
    );

    process.on(
        "SIGINT",
        (sigint = () => {
            cleanup();
            process.exit(0);
        })
    );
    process.on(
        "SIGTERM",
        (sigterm = () => {
            cleanup();
            process.exit(0);
        })
    );

    child.on("exit", () => {
        cleanup();
    });

    // Required, otherwise errors are not caught
    child.on("error", (err) => {
        // Aborted
    });

    function cleanup() {
        if (!child.killed) {
            child.kill();
        }
        process.off("exit", exit);
        process.off("SIGINT", sigint);
        process.off("SIGTERM", sigterm);
    }

    return child;
}

export function addAction<T extends object>(
    cmd: Command,
    defaultOptions: T,
    action: (options: T) => unknown
) {
    cmd.action(async (options, command) => {
        if ((command?.args?.length ?? 0) > 0) {
            errorExit(`Too many arguments. Got: ${command.args.join(" ")}`);
        }
        await action(parseOptions(options, defaultOptions));
    });
}

export function propagateOptions(options: string[]): string[] {
    if (typeof options?.map !== "function") {
        return [];
    }
    return options.map((o) => {
        o = o.replace(/\+\+/g, "--");
        if (o.startsWith('"') && o.endsWith('"')) {
            return o.slice(1, -1);
        } else if (o.startsWith("'") && o.endsWith("'")) {
            return o.slice(1, -1);
        }
        return o;
    });
}
