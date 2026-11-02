# nx-mcp (patched build)

Prebuilt `nx-mcp` from nx-console `master` with these changes, which are proposed upstream:

- [nrwl/nx-console#3300](https://github.com/nrwl/nx-console/pull/3300): CI tools find the CIPE for a branch when Nx Cloud labels it with the PR number. From [`fix/ci-information-pr-number-branch`](https://github.com/pedroyan/nx-console/tree/fix/ci-information-pr-number-branch) at `39e7756fb6b873352e7763e066b46b8f86b6506b`.

Being built from `master`, it also has changes merged there that the published `nx-mcp`
may not include yet.

This branch holds only the build output, so `npx` can run it without cloning or building
nx-console:

```bash
claude mcp add nx-mcp-patched -- npx -y github:pedroyan/nx-console#nx-mcp-patched --minimal
```

Delete this branch once these changes ship in the published `nx-mcp`.

Built from `nx-mcp-patched-build` at `60dd05b41d180229f44a9e692b3b616ab3f18566`. To update it, rebase
[`nx-mcp-patched-build`](https://github.com/pedroyan/nx-console/tree/nx-mcp-patched-build) onto
the branches above and run `node tools/scripts/publish-nx-mcp-patched.mjs`.
