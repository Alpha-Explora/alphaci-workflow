# service-react-native.yml

Runs the CI pipeline for one React Native app. It runs the React Native mobile
pipeline (standard check, unit tests, lint, security scan, Android and iOS
simulator builds, Maestro E2E), then an optional production approval gate.

- Source: `.github/workflows/service-react-native.yml`
- Trigger: `workflow_call`
- Used by: the customer template `workflow-templates/customer/react-native-service-pipeline.yml`. AlphaCI renders that template for the existing-repository setup pull request and for the catalog generate API. New projects use the staged generator, which does not call this workflow.
- Calls: [mobile-react-native.yml](mobile-react-native.md), [production-gate.yml](production-gate.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name, also used in artifact names. |
| `service-path` | string | no | `.` | Directory that holds the app. |
| `node-version` | number | no | `24` | Node.js version. |
| `java-version` | string | no | `17` | JDK version for Android builds. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage. |
| `enable-lint` | boolean | no | `true` | Run lint. |
| `enable-security-scan` | boolean | no | `true` | Run the security scan. |
| `enable-android-build` | boolean | no | `true` | Build the Android debug APK. |
| `enable-ios-build` | boolean | no | `true` | Build the iOS simulator app. |
| `enable-maestro` | boolean | no | `true` | Run Maestro on an Android emulator. |
| `enable-maestro-ios` | boolean | no | `true` | Run Maestro on an iOS simulator. |
| `android-build-command` | string | no | `./gradlew assembleDebug -PbundleInDebug=true --no-daemon --stacktrace --warning-mode all` | Android build command, run from the Gradle wrapper directory. |
| `maestro-test-command` | string | no | `maestro test .maestro` | Maestro Android command. |
| `maestro-ios-test-command` | string | no | `maestro test .maestro` | Maestro iOS command. |
| `ios-runner` | string | no | `macos-15` | Passed to `mobile-react-native.yml`, which does not use it. |
| `ios-xcode-version` | string | no | `16.4` | Passed to `mobile-react-native.yml`, which does not use it. |
| `ios-xcode-fallbacks` | string | no | `16.3,16.2,26.2` | Passed to `mobile-react-native.yml`, which does not use it. |
| `require-production-approval` | boolean | no | `false` | Run the production gate. |
| `production-staging-url` | string | no | `""` | URL shown by the production gate. |

## Secrets

None declared. The `mobile` job uses `secrets: inherit`.

## Outputs

None.

## Permissions

Workflow: `contents: read`. The nested `android-build` job in
`mobile-react-native.yml` asks for `packages: write` and
`security-events: write`. The calling job must grant these, or GitHub rejects
the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `mobile` | always | Calls `mobile-react-native.yml`. |
| `production-gate` | `require-production-approval` is true and `mobile` succeeded | Calls `production-gate.yml` with `app-type: mobile`. |

## Example

```yaml
jobs:
  pipeline:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/service-react-native.yml@v1
    permissions:
      contents: read
      packages: write
      security-events: write
    with:
      service-name: mobile
      enable-maestro-ios: false
    secrets: inherit
```

## Notes

- The customer template reads `REQUIRE_PRODUCTION_APPROVAL` and
  `PRODUCTION_STAGING_URL` from repository variables.
- The iOS jobs run on `macos-15` with Xcode 26.2 regardless of the `ios-*`
  inputs.
