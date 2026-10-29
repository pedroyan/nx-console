# nx-mcp (patched build)

Prebuilt `nx-mcp` from [`fix/nx-cloud-oauth-credentials`](https://github.com/pedroyan/nx-console/tree/fix/nx-cloud-oauth-credentials)
at `78b068844cb32a683713426a5cb6d8882cf4df40`, the change proposed in [nrwl/nx-console#3299](https://github.com/nrwl/nx-console/pull/3299): Nx Cloud
requests authenticate with the `nx login` OAuth credential.

This branch holds only the build output, so `npx` can run it without cloning or building
nx-console:

```bash
claude mcp add nx-mcp-patched -- npx -y github:pedroyan/nx-console#nx-mcp-patched --minimal
```

Delete this branch once the fix ships in the published `nx-mcp`.

Built from `nx-mcp-patched-build` at `905b7568afe152fcfe684e089ae0f8ef4b8145e0`. To update it, rebase
[`nx-mcp-patched-build`](https://github.com/pedroyan/nx-console/tree/nx-mcp-patched-build) onto
`fix/nx-cloud-oauth-credentials` and run `node tools/scripts/publish-nx-mcp-patched.mjs`.
