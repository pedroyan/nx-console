// tools/scripts/publish-nx-mcp-patched.mjs
// Usage: node tools/scripts/publish-nx-mcp-patched.mjs [--dry-run]
//
// Builds nx-mcp from this branch (fix/nx-cloud-oauth-credentials plus this script) and
// commits the bundle to the orphan nx-mcp-patched branch, which holds only main.js,
// package.json and README.md so `npx github:pedroyan/nx-console#nx-mcp-patched` runs
// it without cloning or building nx-console. --dry-run commits locally but skips the push.
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const REMOTE = 'origin';
const REPO = 'pedroyan/nx-console';
const SOURCE_BRANCH = 'fix/nx-cloud-oauth-credentials';
const DIST_BRANCH = 'nx-mcp-patched';
const UPSTREAM_PR = 'https://github.com/nrwl/nx-console/pull/3299';

const dryRun = process.argv.includes('--dry-run');

function git(args, opts = {}) {
  return (
    execFileSync('git', args, { encoding: 'utf8', ...opts }) ?? ''
  ).trim();
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (git(['status', '--porcelain'])) {
  fail(
    'Commit or stash your changes first; the README records HEAD as the build source.',
  );
}

// Explicit refspecs, because a clone may fetch only some branches from REMOTE.
git(
  [
    'fetch',
    REMOTE,
    ...[SOURCE_BRANCH, DIST_BRANCH].map(
      (branch) => `+refs/heads/${branch}:refs/remotes/${REMOTE}/${branch}`,
    ),
  ],
  { stdio: 'inherit' },
);
const sourceSha = git(['rev-parse', `${REMOTE}/${SOURCE_BRANCH}`]);
try {
  git(['merge-base', '--is-ancestor', sourceSha, 'HEAD']);
} catch {
  fail(
    `Rebase onto ${REMOTE}/${SOURCE_BRANCH} first, so the build includes its latest commit.`,
  );
}
const headSha = git(['rev-parse', 'HEAD']);
const buildBranch = git(['branch', '--show-current']) || headSha;

// nx-mcp needs no Gradle, but the @nx/gradle plugin would run it (and need a JDK) to
// build the project graph. Without the daemon, a running one can't bring it back.
// The cache is skipped because its hash ignores where node_modules links the libs from.
execFileSync(
  'npx',
  ['nx', 'build', 'nx-mcp', '--configuration=production', '--skip-nx-cache'],
  {
    stdio: 'inherit',
    env: { ...process.env, NX_GRADLE_DISABLE: 'true', NX_DAEMON: 'false' },
  },
);
const bundle = readFileSync('dist/apps/nx-mcp/main.js', 'utf8');
// The workspace libs resolve through node_modules symlinks, so a node_modules shared
// with another checkout silently bundles that checkout's libs instead of this branch's.
if (!bundle.includes('Nx-Cloud-OAuth-Access-Token')) {
  fail(
    'The bundle lacks the OAuth fix. Is node_modules/@nx-console linked to another checkout?',
  );
}

const readme = `# nx-mcp (patched build)

Prebuilt \`nx-mcp\` from [\`${SOURCE_BRANCH}\`](https://github.com/${REPO}/tree/${SOURCE_BRANCH})
at \`${sourceSha}\`, the change proposed in [nrwl/nx-console#3299](${UPSTREAM_PR}): Nx Cloud
requests authenticate with the \`nx login\` OAuth credential.

This branch holds only the build output, so \`npx\` can run it without cloning or building
nx-console:

\`\`\`bash
claude mcp add nx-mcp-patched -- npx -y github:${REPO}#${DIST_BRANCH} --minimal
\`\`\`

Delete this branch once the fix ships in the published \`nx-mcp\`.

Built from \`${buildBranch}\` at \`${headSha}\`. To update it, rebase
[\`nx-mcp-patched-build\`](https://github.com/${REPO}/tree/nx-mcp-patched-build) onto
\`${SOURCE_BRANCH}\` and run \`node tools/scripts/publish-nx-mcp-patched.mjs\`.
`;

const worktree = mkdtempSync(join(tmpdir(), `${DIST_BRANCH}-`));
try {
  git(['worktree', 'add', '--detach', worktree, `${REMOTE}/${DIST_BRANCH}`]);
  const inWorktree = { cwd: worktree };
  writeFileSync(join(worktree, 'main.js'), `#!/usr/bin/env node\n${bundle}`, {
    mode: 0o755,
  });
  writeFileSync(join(worktree, 'README.md'), readme);

  git(['add', '-A'], inWorktree);
  if (!git(['status', '--porcelain'], inWorktree)) {
    console.log(`${DIST_BRANCH} already holds this build; nothing to publish.`);
  } else {
    git(
      [
        'commit',
        '-q',
        '-m',
        `Build nx-mcp from ${SOURCE_BRANCH} (${sourceSha.slice(0, 7)})`,
      ],
      inWorktree,
    );
    console.log(git(['show', '--stat', '--format=%h %s', 'HEAD'], inWorktree));
    if (dryRun) {
      console.log(`Dry run: not pushing to ${REMOTE}/${DIST_BRANCH}.`);
    } else {
      git(['push', REMOTE, `HEAD:refs/heads/${DIST_BRANCH}`], {
        ...inWorktree,
        stdio: 'inherit',
      });
    }
  }
} finally {
  git(['worktree', 'remove', '--force', worktree]);
  rmSync(worktree, { recursive: true, force: true });
}
