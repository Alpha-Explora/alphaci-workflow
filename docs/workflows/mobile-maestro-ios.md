# mobile-maestro-ios.yml

Runs Maestro end-to-end flows on an iOS simulator. It either downloads a
pre-built simulator app zip or builds the app itself, installs it on an iPhone
simulator, and runs the Maestro command.

- Source: `.github/workflows/mobile-maestro-ios.yml`
- Trigger: `workflow_call`
- Used by: [mobile-workflow.yml](mobile-workflow.md), [mobile-react-native.yml](mobile-react-native.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory that holds the project and `.maestro/`. |
| `system-name` | string | yes | | Display name, used in the log artifact name. |
| `node-version` | number | no | `24` | Node.js version. |
| `ios-build-command` | string | no | `""` | Build command override when `skip-build` is false. Empty runs `xcodebuild` for the resolved scheme. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro command. |
| `skip-build` | boolean | no | `false` | Use a pre-built artifact instead of building. |
| `build-artifact-name` | string | no | `""` | Artifact holding the `.app` zip. Used when `skip-build` is true. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `maestro-ios-e2e` | always | On `macos-15` with Xcode 26.2: installs dependencies, checks `.maestro/` has at least one flow, installs the Maestro CLI, gets the app (download and unzip, or `expo prebuild` + CocoaPods + build), reads its bundle ID, boots an iPhone simulator, installs the app, runs the Maestro command, uploads `maestro-ios-run.log` as `<system-name>-maestro-ios-log`, and fails when Maestro failed. |

## Example

```yaml
jobs:
  maestro-ios:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-maestro-ios.yml@v1
    with:
      system-name: mobile
      skip-build: true
      build-artifact-name: mobile-ios-simulator-build
```

## Notes

- When the command contains `maestro test .maestro` and sets no tag filter,
  `--exclude-tags android` is added.
- A flow `appId` that differs from the built bundle ID produces a warning.
