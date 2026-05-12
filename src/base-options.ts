import type { CLIOptionsDef } from "./types.js";
import type { LogLevel } from "./util.js";

export interface BaseOptions {
    profile?: string;
    logLevel?: LogLevel;
}

export const DefaultBaseOptions: Required<BaseOptions> = {
    profile: "default",
    logLevel: "info",
};

export const BaseCliOptions: CLIOptionsDef<BaseOptions> = {
    profile: {
        flags: "-p, --profile [name]",
        description: "Configuration profile to use.",
    },
    logLevel: {
        flags: "-l, --log-level [level]",
        description: "Logging level (error, warn, info, debug). Default is 'info'.",
    },
};
