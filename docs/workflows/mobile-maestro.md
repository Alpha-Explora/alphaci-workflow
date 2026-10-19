# mobile-maestro.yml

Runs Maestro end-to-end flows on an Android emulator. It either downloads a
pre-built APK artifact or builds the app itself, installs it on an API 30
emulator, and runs the Maestro command.

- Source: `.github/workflows/mobile-maestro.yml`
- Trigger: `workflow_call`
- Used by: [mobile-workflow.yml](mobile-workflow.md), [mobile-react-native.yml](mobile-react-native.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory that holds the project and `.maestro/`. |
| `system-name` | string | yes | | Display name, used in the log artifact name. |
| `node-version` | number | no | `24` | Node.js version (React Native and Expo only). |
| `java-version` | string | no | `17` | Temurin JDK version. |
| `project-type` | string | no | `auto` | `auto`, `react-native`, `expo` or `kotlin`. `auto` treats a project with `package.json` as React Native/Expo. |
| `android-build-command` | string | no | `./gradlew :app:assembleDebug` | Build command when `skip-build` is false, run from `working-directory`. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro command. |
| `skip-build` | boolean | no | `false` | Use a pre-built artifact instead of building. |
| `build-artifact-name` | string | no | `""` | Artifact holding the APK. Used when `skip-build` is true. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `maestro-e2e` | always | Installs dependencies (Node projects), checks `.maestro/` has at least one flow, installs the Maestro CLI, gets the APK (download or build) at `android/app/build/outputs/apk/debug/app-debug.apk`, starts a Pixel 5 API 30 emulator, installs the APK, runs the Maestro command, uploads `maestro-run.log` as `<system-name>-maestro-android-log`, and fails when Maestro failed. |

## Example

```yaml
jobs:
  maestro:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-maestro.yml@v1
    with:
      system-name: mobile
      project-type: react-native
      skip-build: true
      build-artifact-name: mobile-android-build
```

## Notes

- When the command contains `maestro test .maestro` and sets no tag filter,
  `--exclude-tags ios` is added.
- If a flow declares an `appId` that is not installed on the emulator, the run
  fails before Maestro starts.
- With `skip-build: false`, the default build command expects `gradlew` in
  `working-directory`.
