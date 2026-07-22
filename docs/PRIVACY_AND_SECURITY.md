# Privacy and security

The shipped application is offline-first. It does not request GitHub credentials, read a local `.git` directory, upload commands, or send analytics. Lesson state lives in memory until a learner resets or reloads the page. JSON export contains only the visible lesson metadata.

The UI restricts commands to an explicit per-level allowlist. Invalid commands return a failure response and preserve the source graph. Users should still treat exported lesson files as untrusted text and review them before sharing.
