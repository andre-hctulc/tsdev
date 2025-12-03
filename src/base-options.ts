import type { CLIOptionsDef } from "./types.js";

export interface BaseOptions {
    profile?: string;
}

export const DefaultBaseOptions: Required<BaseOptions> = {
    profile: "default",
};

export const BaseCliOptions: CLIOptionsDef<BaseOptions> = {
    profile: {
        flags: "-p, --profile [name]",
        description: "Configuration profile to use.",
    },
};
