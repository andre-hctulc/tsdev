import type { Option } from "commander";

export interface TSConfigMin {
    compilerOptions?: {
        module?: string;
        target?: string;
        moduleResolution?: string;
        paths?: Record<string, string[]>;
        outDir?: string;
        include?: string[];
        exclude?: string[];
    };
}

export interface PackageJSONMin {
    name?: string;
    version?: string;
    main?: string;
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
