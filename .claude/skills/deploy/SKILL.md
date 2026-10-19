---
name: deploy
description: Build the Android app on EAS and release it to Firebase App Distribution testers. Optionally bump the app version (patch/minor/major); by default only the build number (versionCode) increases.
argument-hint: "[patch|minor|major] [release notes]"
disable-model-invocation: true
---

# Deploy to Firebase App Distribution (Android)

Arguments: `$ARGUMENTS`

- If the first word is `patch`, `minor` or `major`, bump `expo.version` in `app.json` accordingly. Anything after it is release notes.
- Otherwise do NOT touch `app.json` — only the build number increases. All arguments (if any) are release notes.

## Fixed config

- Firebase project: `progress-diary-147da`
- Firebase Android app ID: `1:901817511767:android:6e4b8adb79f81b411f1812`
- Tester group: `testers`
- EAS profile: `preview` (APK, `autoIncrement: true`, `appVersionSource: remote` — EAS bumps versionCode on every build; never reset or set it manually)

## Steps

1. **Pre-flight.** `git status` must be clean apart from changes this skill makes; if there are uncommitted changes, stop and ask whether to include them. Confirm `eas whoami` and `firebase login:list` show a logged-in user.

2. **Version bump (only if patch/minor/major given).** Read `expo.version` from `app.json`, compute the new semver (patch: x.y.Z+1; minor: x.Y+1.0; major: X+1.0.0), write it back with a precise edit, and commit: `Bump version to <new>`.

3. **Release notes.** If notes were passed, use them. Otherwise summarize the commits since the last deploy tag (`git describe --tags --match 'android-*' --abbrev=0`; if no tag exists, use the last ~5 commits) as 2–5 short user-facing bullets — skip version-bump and tooling-only commits.

4. **Build.** Run in the background and wait for the completion notification:
   `eas build -p android --profile preview --non-interactive --wait`
   Then get the build ID from the output URL and run `eas build:view <id> --json` to read `appVersion`, `appBuildVersion` and `artifacts.applicationArchiveUrl`.

5. **Distribute.** Download the APK into the scratchpad directory as `progress-diary-<version>-<build>.apk`, then:
   ```sh
   firebase appdistribution:distribute <apk> \
     --project progress-diary-147da \
     --app 1:901817511767:android:6e4b8adb79f81b411f1812 \
     --groups testers \
     --release-notes "<version> (<build>)
   - ..."
   ```

6. **Tag.** Create a local tag `android-v<version>-<build>` on HEAD (do not push unless asked) so the next deploy can find its release-notes range.

7. **Report** the version and build number, the release notes used, and the Firebase console release link. If any step fails, stop and show the error — don't retry a build blindly (each one uses EAS build credits).
