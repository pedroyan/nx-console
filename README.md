# nx-mcp (patched build)

Prebuilt `nx-mcp` with these changes, which are proposed upstream:

- [nrwl/nx-console#3299](https://github.com/nrwl/nx-console/pull/3299): Nx Cloud requests authenticate with the `nx login` OAuth credential. From [`fix/nx-cloud-oauth-credentials`](https://github.com/pedroyan/nx-console/tree/fix/nx-cloud-oauth-credentials) at `223c791581a2094d85511fb2ec8148ff91760b77`.
- [nrwl/nx-console#3300](https://github.com/nrwl/nx-console/pull/3300): CI tools find the CIPE for a branch when Nx Cloud labels it with the PR number. From [`fix/ci-information-pr-number-branch`](https://github.com/pedroyan/nx-console/tree/fix/ci-information-pr-number-branch) at `8b5aa6c392ab24792de491af9ca9386a7e355dde`.

This branch holds only the build output, so `npx` can run it without cloning or building
nx-console:

```bash
claude mcp add nx-mcp-patched -- npx -y github:pedroyan/nx-console#nx-mcp-patched --minimal
```

Delete this branch once these changes ship in the published `nx-mcp`.

Built from `nx-mcp-patched-build` at `49271ed2f25ddb9144daa911e90a6863767cc4a4`. To update it, rebase
[`nx-mcp-patched-build`](https://github.com/pedroyan/nx-console/tree/nx-mcp-patched-build) onto
the branches above and run `node tools/scripts/publish-nx-mcp-patched.mjs`.
