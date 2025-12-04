import type { Option } from "commander";

export type DefaultOptions = Record<string, any>;

export interface TSDevConfig {
    profiles?: Record<string, DefaultOptions>;
    config?: DefaultOptions;
}

export interface TSConfigMin {
    compilerOptions?: {
        module?: string;
        target?: string;
        moduleResolution?: string;
        paths?: Record<string, string[]>;
        outDir?: string;
    };
    include?: string[];
    exclude?: string[];
}

export interface PackageJSONMin {
    name?: string;
    version?: string;
    main?: string;
    tsdev?: TSDevConfig;
}

export interface CLIOption {
    required: boolean;
    name: string;
    short: string;
    description: string;
}

export type CLIOptionsDef<T extends object> = {
    [K in keyof T]?: Partial<Option>;
};
