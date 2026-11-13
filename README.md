# nx-mcp (patched build)

Prebuilt `nx-mcp` from nx-console `master`, ahead of the latest published release
(`0.25.3`).

It includes these changes, merged into `master` but not yet in a published release:

- [nrwl/nx-console#3300](https://github.com/nrwl/nx-console/pull/3300): CI tools find the CIPE for a branch when Nx Cloud labels it with the PR number.

This branch holds only the build output, so `npx` can run it without cloning or building
nx-console:

```bash
claude mcp add nx-mcp-patched -- npx -y github:pedroyan/nx-console#nx-mcp-patched --minimal
```

Delete this branch once these changes ship in the published `nx-mcp`.

Built from `nx-mcp-patched-build` at `20085956a807306aa5bdacefe63fc2b4230e03c2`. To update it, rebase
[`nx-mcp-patched-build`](https://github.com/pedroyan/nx-console/tree/nx-mcp-patched-build) onto
`master` and run `node tools/scripts/publish-nx-mcp-patched.mjs`.
