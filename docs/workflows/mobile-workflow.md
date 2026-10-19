# mobile-workflow.yml

Runs the mobile pipeline for one Expo app. It checks the Expo + TypeScript
standard, runs Jest with coverage, lint and the security scan, builds a debug
Android APK and an iOS simulator app, then runs Maestro on an Android emulator
and an iOS simulator against those builds.

- Source: `.github/workflows/mobile-workflow.yml`
- Trigger: `workflow_call`
- Used by: [service-expo.yml](service-expo.md). Not called by the staged generator.
- Calls: [mobile-tests.yml](mobile-tests.md), [lint-check.yml](lint-check.md), [security-scan.yml](security-scan.md), [mobile-maestro.yml](mobile-maestro.md), [mobile-maestro-ios.yml](mobile-maestro-ios.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-dir` | string | no | `.` | Directory that holds the Expo app. |
| `system-name` | string | yes | | Display name, used in artifact names. |
| `node-version` | number | no | `24` | Node.js version. |
| `java-version` | string | no | `17` | JDK version for the Android build and Maestro Android. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage passed to `mobile-tests.yml`. |
| `enable-lint` | boolean | no | `true` | Run `lint-check.yml`. |
| `enable-security-scan` | boolean | no | `true` | Run `security-scan.yml`. |
| `enable-governance` | boolean | no | `true` | Not used. |
| `enable-android-build` | boolean | no | `true` | Build the Android debug APK. |
| `enable-ios-build` | boolean | no | `true` | Build the iOS simulator app. |
| `enable-maestro` | boolean | no | `true` | Run Maestro on Android. Needs a successful Android build. |
| `enable-maestro-ios` | boolean | no | `true` | Run Maestro on iOS. Needs a successful iOS build. |
| `android-build-command` | string | no | `./gradlew :app:assembleDebug` | Android build command, run from `system-dir`. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro Android command. |
| `ios-build-command` | string | no | `""` | iOS build command override. Empty runs `xcodebuild` for the resolved scheme. |
| `maestro-ios-test-command` | string | no | `maestro test .maestro` | Maestro iOS command. |
| `ios-runner` | string | no | `macos-15` | Not used. The iOS job always runs on `macos-15`. |
| `ios-xcode-version` | string | no | `16.2` | Not used. The iOS job always selects Xcode 26.2. |
| `ios-xcode-fallbacks` | string | no | `16.3,16.4,26.2` | Not used. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`. No job asks for more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `expo-typescript-standard` | always | Fails unless `package.json` and `tsconfig.json` exist, `expo` and `typescript` are dependencies, `compilerOptions.strict` is true, and app source is `.ts`/`.tsx` with no `.js`/`.jsx` files. |
| `mobile-unit-tests` | always | Calls `mobile-tests.yml` with `npx jest --coverage --verbose --ci --forceExit --runInBand`. |
| `mobile-lint` | `enable-lint` | Calls `lint-check.yml`. |
| `mobile-security` | `enable-security-scan` | Calls `security-scan.yml`. `fail-on-high` is false only when the branch or pull request base is `test`. |
| `android-build` | `enable-android-build` and no earlier job failed | Installs dependencies, runs `expo prebuild` when `android/` is missing, adds `kotlinVersion=2.0.21` when unset, runs `android-build-command`, uploads the APK as `<system-name>-android-maestro-build`. |
| `ios-build` | `enable-ios-build` and no earlier job failed | On `macos-15` with Xcode 26.2: runs `expo prebuild` when `ios/` is missing, installs CocoaPods, resolves the scheme, builds an unsigned Debug simulator app, uploads it as `<system-name>-ios-maestro-build`. |
| `mobile-maestro` | `enable-maestro`, `android-build` succeeded, standard check and unit tests did not fail | Calls `mobile-maestro.yml` with the downloaded APK. |
| `mobile-maestro-ios` | `enable-maestro-ios`, `ios-build` succeeded, standard check and unit tests did not fail | Calls `mobile-maestro-ios.yml` with the downloaded app. |

## Example

```yaml
jobs:
  mobile:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-workflow.yml@v1
    with:
      system-name: mobile
      system-dir: apps/mobile
      android-build-command: cd android && ./gradlew :app:assembleDebug -PbundleInDebug=true
      enable-ios-build: false
      enable-maestro-ios: false
```

## Notes

- The default `android-build-command` expects `gradlew` in `system-dir`. An
  Expo project keeps it in `android/`, which is why `service-expo.yml` passes
  `cd android && ...`.
- Maestro needs a `.maestro/` directory with at least one flow file.
