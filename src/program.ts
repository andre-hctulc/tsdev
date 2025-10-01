#!/usr/bin/env node

import { program } from "commander";
import { addAction, addOptions } from "./util.js";
import { build, BuildCliOptions, DefaultBuildOptions } from "./build.js";
import { StartCliOptions, StartRunOptions, start } from "./start.js";
import { DefaultDevOptions, dev, DevCliOptions } from "./dev.js";

const prog = program.name("nest-dev").version("0.0.1").description("A CLI tool for NestJS development");

// ## Build Command

const buildCmd = prog.command("build").description("Build the NestJS application");
addOptions(buildCmd, DefaultBuildOptions, BuildCliOptions);
addAction(buildCmd, DefaultBuildOptions, build);

// ## Start Command

const runCmd = prog.command("start").description("Start the NestJS application");
addOptions(runCmd, StartRunOptions, StartCliOptions);
addAction(runCmd, StartRunOptions, start);

// ## Dev Command

const devCmd = prog.command("dev").description("Run the NestJS application in development mode");
addOptions(devCmd, DefaultDevOptions, DevCliOptions);
addAction(devCmd, DefaultDevOptions, dev);

prog.parse();
