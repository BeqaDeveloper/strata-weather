# Enabling CI

The complete workflow is saved in [ci.workflow.yml](ci.workflow.yml). It installs the lockfile, runs TypeScript, lint, formatting, coverage gates, Expo Doctor, and production exports for all three platforms. It also uploads coverage and dependency audit reports.

GitHub accepted the public app repository but rejected `.github/workflows/ci.yml` because the publishing CLI OAuth token lacks the `workflow` scope. The connected GitHub integration also rejected workflow creation with HTTP 403. No credential scopes were changed. The workflow is stored outside GitHub’s activation directory so all source, tests, and the reviewable CI configuration remain publicly available.

To activate through the GitHub website, create `.github/workflows/ci.yml` on the main branch using the exact contents of `docs/ci.workflow.yml`. GitHub will request any authorization your account needs.

To activate through a local CLI with your approval:

```sh
gh auth refresh --hostname github.com --scopes workflow
```

Complete GitHub’s authorization in your browser, then copy `docs/ci.workflow.yml` to `.github/workflows/ci.yml` and commit and push that file. On PowerShell:

```powershell
New-Item -ItemType Directory -Force .github/workflows
Copy-Item docs/ci.workflow.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "Enable continuous quality checks"
git push
```

The first push activates the workflow. Until activation, automated checks have passed locally as recorded in [verification](verification.md); no successful GitHub Actions run is claimed.

The repository owner has chosen to keep this workflow as a template. Activation is an optional future repository change.
