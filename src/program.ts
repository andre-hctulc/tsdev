#!/usr/bin/env node

import { program } from "commander";
import { addAction, addOptions } from "./util.js";
import { build, BuildCliOptions, DefaultBuildOptions } from "./build.js";
import { StartCliOptions, DefaultStartOptions, start } from "./start.js";
import { DefaultDevOptions, dev, DevCliOptions } from "./dev.js";

const prog = program.name("nest-dev").version("0.0.1").description("A CLI tool for TS development");

// ## Build Command

const buildCmd = prog.command("build").description("Build the application");
addOptions(buildCmd, DefaultBuildOptions, BuildCliOptions);
addAction(buildCmd, DefaultBuildOptions, build);

// ## Start Command

const runCmd = prog.command("start").description("Start the application");
addOptions(runCmd, DefaultStartOptions, StartCliOptions);
addAction(runCmd, DefaultStartOptions, start);

// ## Dev Command

const devCmd = prog.command("dev").description("Run the application in development mode");
addOptions(devCmd, DefaultDevOptions, DevCliOptions);
addAction(devCmd, DefaultDevOptions, dev);

prog.parse();