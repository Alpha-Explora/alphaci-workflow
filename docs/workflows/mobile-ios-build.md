# mobile-ios-build.yml

Builds an unsigned Debug iOS simulator app for a React Native or Expo project
and uploads it as a zip. The build is for Maestro, not for distribution.

- Source: `.github/workflows/mobile-ios-build.yml`
- Trigger: `workflow_call`
- Used by: [mobile-react-native.yml](mobile-react-native.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory that holds the project. |
| `system-name` | string | yes | | Display name, used in artifact names. |
| `node-version` | number | no | `24` | Node.js version. |
| `upload-artifact` | boolean | no | `true` | Upload the zipped app as `<system-name>-ios-simulator-build`. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `ios-build` | always | On `macos-15`: installs dependencies, selects Xcode 26.2, runs `expo prebuild` when `ios/` is missing, installs CocoaPods when there is a `Podfile`, picks the workspace or project and the app scheme, runs `xcodebuild` for `iphonesimulator` with code signing off, and zips the `.app` to `build/<system-name>-ios-simulator-app.zip`. |

## Example

```yaml
jobs:
  ios:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-ios-build.yml@v1
    with:
      system-name: mobile
```

## Notes

- The runner (`macos-15`) and Xcode version (26.2) are fixed in the workflow.
- The scheme is the one named like the workspace or project, skipping `Pods`,
  test, tvOS and macOS schemes.
