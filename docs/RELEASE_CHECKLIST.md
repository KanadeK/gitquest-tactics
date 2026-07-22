# Release checklist

- [ ] `npm ci` succeeds from a clean clone.
- [ ] Lint, format, typecheck, coverage, E2E, build, package, and release check pass.
- [ ] `dist-release/` contains the versioned ZIP and `SHA256SUMS.txt`.
- [ ] ZIP is extracted to a clean directory and its `index.html` exists.
- [ ] No `.env`, token, private repository content, or cache is packaged.
- [ ] Changelog contains v0.1.0 and package version matches tag.
- [ ] Git author and committer are the authenticated GitHub identity.
- [ ] CI is green before creating the annotated tag and release.
