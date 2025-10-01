# tsdev

## Features

- Full ES Next support
- Resolve TS alias
- Restart on changes

## Basic Usage

Build the app.

```bash
npx @dre44/tsdev build
```

Start the app.

```bash
npx @dre44/tsdev start
```

Start the app and restart on changes.

```bash
npx @dre44/tsdev dev
```

## Pass TS or Node options

Use existing options but replace `--` with `++`.

TypeScript options

```bash
npx @dre44/tsdev start --tsc ++sourceMap false ++declaration false
```

Node options

```bash
npx @dre44/tsdev dev -n ++inspect
```

## Help

Use

```bash
npx  @dre44/tsdev [command] --help
```

for more options or general command information.

## Debugging with VS Code

_launch.json_

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Nest.js App",
            "type": "node",
            "request": "launch",
            "runtimeExecutable": "npx",
            "runtimeArgs": ["@dre44/tsdev", "dev"],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal"
        }
    ]
}
```
