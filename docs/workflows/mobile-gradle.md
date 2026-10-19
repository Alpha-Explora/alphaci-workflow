# mobile-gradle.yml

Builds an Android app with Gradle, for a React Native or a native Kotlin
project, and uploads the APK and AAB. It can also build a Docker image through
[docker-build.yml](docker-build.md).

- Source: `.github/workflows/mobile-gradle.yml`
- Trigger: `workflow_call`
- Used by: [mobile-react-native.yml](mobile-react-native.md). Not called by the staged generator.
- Calls: [docker-build.yml](docker-build.md) (optional)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory that holds the project. |
| `system-name` | string | yes | | Display name, used in artifact names. |
| `node-version` | number | no | `24` | Node.js version (React Native only). |
| `java-version` | string | no | `17` | Temurin JDK version. |
| `project-type` | string | no | `auto` | `auto`, `react-native` or `kotlin`. `auto` picks `react-native` when `package.json` exists. |
| `gradle-task` | string | no | `assembleDebug` | Gradle task, run as `./gradlew <task> --no-daemon --stacktrace --warning-mode all`. |
| `android-build-command` | string | no | `""` | Full build command override, run from the Gradle wrapper directory. |
| `enable-docker-build` | boolean | no | `false` | Build a Docker image after the Android build. |
| `docker-image-name` | string | no | `""` | Image name. The Docker job runs only when this is set. |
| `dockerfile-path` | string | no | `Dockerfile` | Dockerfile, relative to `working-directory`. |
| `upload-artifact` | boolean | no | `true` | Upload the APK and AAB as `<system-name>-android-build`. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`. The `docker-build` job asks for `contents: read`,
`packages: write` and `security-events: write`. The calling job must grant
these even when Docker is off, or GitHub rejects the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `gradle-build` | always | For React Native: installs dependencies, adds missing `@react-native-community/cli*` packages, runs `expo prebuild` when `android/` is missing, patches `MainApplication.java` and debug JS bundling for CI. Then finds `gradlew` (root, `android/`, or up to four levels deep), adds `kotlinVersion=2.0.21` when unset, sets up the JDK and Gradle cache, builds, and stages the largest APK and AAB as `<system-name>-android.apk/.aab`. |
| `docker-build` | `enable-docker-build` and `docker-image-name` is set | Calls `docker-build.yml`. Pushes and scans only on a push to `main`; vulnerabilities do not fail the job. |

## Example

```yaml
jobs:
  android:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-gradle.yml@v1
    permissions:
      contents: read
      packages: write
      security-events: write
    with:
      system-name: mobile
      project-type: react-native
      gradle-task: assembleDebug
```

## Notes

- A run that produces neither an APK nor an AAB fails when `upload-artifact` is
  true.
