# nx-mcp (patched build)

Prebuilt `nx-mcp` with these changes, which are proposed upstream:

- [nrwl/nx-console#3299](https://github.com/nrwl/nx-console/pull/3299): Nx Cloud requests authenticate with the `nx login` OAuth credential. From [`fix/nx-cloud-oauth-credentials`](https://github.com/pedroyan/nx-console/tree/fix/nx-cloud-oauth-credentials) at `78b068844cb32a683713426a5cb6d8882cf4df40`.
- [nrwl/nx-console#3300](https://github.com/nrwl/nx-console/pull/3300): CI tools find the CIPE for a branch when Nx Cloud labels it with the PR number. From [`fix/ci-information-pr-number-branch`](https://github.com/pedroyan/nx-console/tree/fix/ci-information-pr-number-branch) at `140dca57f41acaf7bc25b9442c03adb056114544`.

This branch holds only the build output, so `npx` can run it without cloning or building
nx-console:

```bash
claude mcp add nx-mcp-patched -- npx -y github:pedroyan/nx-console#nx-mcp-patched --minimal
```

Delete this branch once these changes ship in the published `nx-mcp`.

Built from `nx-mcp-patched-build` at `72ed145464cfc451a20b77df331188a4c516fe7e`. To update it, rebase
[`nx-mcp-patched-build`](https://github.com/pedroyan/nx-console/tree/nx-mcp-patched-build) onto
the branches above and run `node tools/scripts/publish-nx-mcp-patched.mjs`.
