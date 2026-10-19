# mobile-react-native.yml

Runs the mobile pipeline for one React Native app. It checks the React
Native + TypeScript standard, runs Jest with coverage, lint and the security
scan, builds a debug Android APK and an iOS simulator app, then runs Maestro
on an Android emulator and an iOS simulator against those builds.

- Source: `.github/workflows/mobile-react-native.yml`
- Trigger: `workflow_call`
- Used by: [service-react-native.yml](service-react-native.md). Not called by the staged generator.
- Calls: [mobile-tests.yml](mobile-tests.md), [lint-check.yml](lint-check.md), [security-scan.yml](security-scan.md), [mobile-gradle.yml](mobile-gradle.md), [mobile-ios-build.yml](mobile-ios-build.md), [mobile-maestro.yml](mobile-maestro.md), [mobile-maestro-ios.yml](mobile-maestro-ios.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-dir` | string | no | `.` | Directory that holds the app. |
| `system-name` | string | yes | | Display name, used in artifact names. |
| `node-version` | number | no | `24` | Node.js version. |
| `java-version` | string | no | `17` | JDK version for the Android build and Maestro Android. |
| `android-build-command` | string | no | `./gradlew assembleDebug --no-daemon --stacktrace --warning-mode all` | Android build command, run from the Gradle wrapper directory. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage passed to `mobile-tests.yml`. |
| `enable-lint` | boolean | no | `true` | Run `lint-check.yml`. |
| `enable-security-scan` | boolean | no | `true` | Run `security-scan.yml`. |
| `enable-governance` | boolean | no | `true` | Not used. |
| `enable-android-build` | boolean | no | `true` | Build the Android debug APK. |
| `enable-ios-build` | boolean | no | `true` | Build the iOS simulator app. |
| `enable-maestro` | boolean | no | `true` | Run Maestro on Android. Needs a successful Android build. |
| `enable-maestro-ios` | boolean | no | `true` | Run Maestro on iOS. Needs a successful iOS build. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro Android command. |
| `maestro-ios-test-command` | string | no | `maestro test .maestro` | Maestro iOS command. |
| `ios-runner` | string | no | `macos-15` | Not used. `mobile-ios-build.yml` always runs on `macos-15`. |
| `ios-xcode-version` | string | no | `16.4` | Not used. `mobile-ios-build.yml` always selects Xcode 26.2. |
| `ios-xcode-fallbacks` | string | no | `16.3,16.2,26.2` | Not used. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`. The `android-build` job asks for `contents: read`,
`packages: write` and `security-events: write` (for the optional Docker job in
`mobile-gradle.yml`). The calling job must grant these, or GitHub rejects the
run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `rn-typescript-standard` | always | Fails unless `package.json` and `tsconfig.json` exist, `react-native` and `typescript` are dependencies, `compilerOptions.strict` is true, and app source is `.ts`/`.tsx` with no `.js`/`.jsx` files. |
| `mobile-unit-tests` | always | Calls `mobile-tests.yml` with `npx jest --coverage --verbose --ci --forceExit --runInBand`. |
| `mobile-lint` | `enable-lint` | Calls `lint-check.yml`. |
| `mobile-security` | `enable-security-scan` | Calls `security-scan.yml`. `fail-on-high` is false only when the branch or pull request base is `test`. |
| `android-build` | `enable-android-build` and no earlier job failed | Calls `mobile-gradle.yml` with `project-type: react-native` and uploads `<system-name>-android-build`. |
| `ios-build` | `enable-ios-build` and no earlier job failed | Calls `mobile-ios-build.yml` and uploads `<system-name>-ios-simulator-build`. |
| `mobile-maestro` | `enable-maestro`, `android-build` succeeded, nothing else failed | Calls `mobile-maestro.yml` with `skip-build: true` and the Android artifact. |
| `mobile-maestro-ios` | `enable-maestro-ios`, `ios-build` succeeded, nothing else failed | Calls `mobile-maestro-ios.yml` with `skip-build: true` and the iOS artifact. |

## Example

```yaml
jobs:
  mobile:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-react-native.yml@v1
    permissions:
      contents: read
      packages: write
      security-events: write
    with:
      system-name: mobile
      enable-ios-build: false
      enable-maestro-ios: false
```

## Notes

- Maestro needs a `.maestro/` directory with at least one flow file.
