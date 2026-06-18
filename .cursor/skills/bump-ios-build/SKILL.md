---
name: bump-ios-build
description: Bumps the iOS build number (CURRENT_PROJECT_VERSION) before creating a new Appflow/TestFlight build. Use when the user is about to build/upload a new iOS build, after code changes that go into the app, or when an App Store upload fails with "bundle version must be higher than the previously uploaded version" / ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE on cfBundleVersion.
---

# Bump iOS Build Number

App Store Connect rejects uploads whose build number was already used. Each new TestFlight/App Store build must have a strictly higher `CURRENT_PROJECT_VERSION`.

## When to run

- Before triggering a new Appflow / TestFlight build that contains new code
- Immediately after an upload fails with: `The bundle version must be higher than the previously uploaded version`

Do NOT bump on every `cap sync` during local development — only when a build will actually be uploaded.

## How to bump

Increment by one (normal case):

```bash
npm run ios:bump
```

Bump and sync native project in one step:

```bash
npm run ios:release
```

Set an explicit build number (e.g. to match/exceed App Store Connect):

```bash
node scripts/bump-ios-build.mjs --set 20
```

The script updates both Debug and Release `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`. `CFBundleVersion` in `Info.plist` uses `$(CURRENT_PROJECT_VERSION)`, so no other file needs editing. It refuses to lower the number.

## Notes

- `MARKETING_VERSION` (e.g. `2.0`) is the user-facing version and is NOT changed by this script. Bump it manually in `project.pbxproj` only for a new public release.
- After bumping, commit the change so the Appflow build picks it up.
