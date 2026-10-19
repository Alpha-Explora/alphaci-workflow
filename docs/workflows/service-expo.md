# service-expo.yml

Runs the CI pipeline for one Expo app. It runs the Expo mobile pipeline
(standard check, unit tests, lint, security scan, Android and iOS simulator
builds, Maestro E2E), then an optional EAS build command, then an optional
production approval gate.

- Source: `.github/workflows/service-expo.yml`
- Trigger: `workflow_call`
- Used by: the customer template `workflow-templates/customer/expo-service-pipeline.yml`. AlphaCI renders that template for the existing-repository setup pull request and for the catalog generate API. New projects use the staged generator, which does not call this workflow.
- Calls: [mobile-workflow.yml](mobile-workflow.md), [production-gate.yml](production-gate.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name, also used in artifact names. |
| `service-path` | string | no | `.` | Directory that holds the Expo app. |
| `node-version` | number | no | `24` | Node.js version. |
| `java-version` | string | no | `17` | JDK version for Android builds. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage. |
| `enable-lint` | boolean | no | `true` | Run lint. |
| `enable-security-scan` | boolean | no | `true` | Run the security scan. |
| `enable-android-build` | boolean | no | `true` | Build the Android debug APK. |
| `enable-ios-build` | boolean | no | `true` | Build the iOS simulator app. |
| `enable-maestro` | boolean | no | `true` | Run Maestro on an Android emulator. |
| `enable-maestro-ios` | boolean | no | `true` | Run Maestro on an iOS simulator. |
| `android-build-command` | string | no | `cd android && ./gradlew :app:assembleDebug -PbundleInDebug=true` | Android build command, run from `service-path`. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro Android command. |
| `ios-build-command` | string | no | `""` | iOS build command override. Empty runs the built-in `xcodebuild`. |
| `maestro-ios-test-command` | string | no | `maestro test .maestro` | Maestro iOS command. |
| `ios-runner` | string | no | `macos-15` | Passed to `mobile-workflow.yml`, which does not use it. |
| `ios-xcode-version` | string | no | `16.2` | Passed to `mobile-workflow.yml`, which does not use it. |
| `ios-xcode-fallbacks` | string | no | `16.3,16.4,26.2` | Passed to `mobile-workflow.yml`, which does not use it. |
| `eas-build-command` | string | no | `""` | EAS build command. Empty skips the `eas-build` job. |
| `require-production-approval` | boolean | no | `false` | Run the production gate. |
| `production-staging-url` | string | no | `""` | URL shown by the production gate. |

## Secrets

None declared. The `mobile` job uses `secrets: inherit`. An EAS command that
needs a token (for example `EXPO_TOKEN`) gets no secret from this workflow;
`eas-build` sets no secret environment.

## Outputs

None.

## Permissions

Workflow: `contents: read`. No job asks for more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `mobile` | always | Calls `mobile-workflow.yml`. |
| `eas-build` | `eas-build-command` is set | Needs `mobile`. Installs dependencies (lockfile-aware) on Ubuntu and runs `eas-build-command`. |
| `production-gate` | `require-production-approval` is true, `mobile` succeeded and `eas-build` succeeded or was skipped | Calls `production-gate.yml` with `app-type: mobile`. |

## Example

```yaml
jobs:
  pipeline:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/service-expo.yml@v1
    with:
      service-name: mobile
      service-path: apps/mobile
      enable-ios-build: false
      enable-maestro-ios: false
    secrets: inherit
```

## Notes

- The customer template reads `EAS_BUILD_COMMAND`, `REQUIRE_PRODUCTION_APPROVAL`
  and `PRODUCTION_STAGING_URL` from repository variables.
- The iOS jobs run on `macos-15` with Xcode 26.2 regardless of the `ios-*`
  inputs.
