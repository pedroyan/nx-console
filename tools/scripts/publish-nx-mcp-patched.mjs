// tools/scripts/publish-nx-mcp-patched.mjs
// Usage: node tools/scripts/publish-nx-mcp-patched.mjs [--dry-run]
//
// Builds nx-mcp from this branch (nx-console master, the SOURCES fixes and this script)
// and commits the bundle to the orphan nx-mcp-patched branch, which holds only main.js,
// package.json and README.md so `npx github:pedroyan/nx-console#nx-mcp-patched` runs
// it without cloning or building nx-console. --dry-run commits locally but skips the push.
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const REMOTE = 'origin';
const REPO = 'pedroyan/nx-console';
const DIST_BRANCH = 'nx-mcp-patched';
// Fixes not yet merged upstream, each carried from its own branch, which this branch
// must be rebased onto. `marker` is a string that only a bundle built with the fix contains.
const SOURCES = [];
// Fixes already merged into master that no published nx-mcp includes yet. The build
// picks them up from master; the marker check proves it did. Drop an entry once a
// release ships it, and the whole branch once both lists are empty.
const UNRELEASED = [
  {
    pr: 3300,
    summary:
      'CI tools find the CIPE for a branch when Nx Cloud labels it with the PR number',
    marker: 'includeRecentBranches',
  },
];

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
    ...[...SOURCES.map((source) => source.branch), DIST_BRANCH].map(
      (branch) => `+refs/heads/${branch}:refs/remotes/${REMOTE}/${branch}`,
    ),
  ],
  { stdio: 'inherit' },
);
// Compared by patch rather than ancestry, because rebasing this branch rewrites the
// fix commits it carries.
for (const source of SOURCES) {
  source.sha = git(['rev-parse', `${REMOTE}/${source.branch}`]);
  if (
    git(['cherry', 'HEAD', source.sha])
      .split('\n')
      .some((line) => line.startsWith('+'))
  ) {
    fail(
      `Rebase onto ${REMOTE}/${source.branch} first, so the build includes its latest commit.`,
    );
  }
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
for (const fix of [...SOURCES, ...UNRELEASED]) {
  if (!bundle.includes(fix.marker)) {
    fail(
      `The bundle lacks the fix from nrwl/nx-console#${fix.pr}. Is this branch rebased onto master, and is node_modules/@nx-console linked to this checkout?`,
    );
  }
}
// The latest nx-mcp release this build is ahead of, for the README and the version.
const release = git([
  'describe',
  '--tags',
  '--abbrev=0',
  '--match',
  'nx-mcp-v*',
  'HEAD',
]).replace(/^nx-mcp-v/, '');
const fixLine = (fix) =>
  `- [nrwl/nx-console#${fix.pr}](https://github.com/nrwl/nx-console/pull/${fix.pr}): ${fix.summary}.`;

const readme = `# nx-mcp (patched build)

Prebuilt \`nx-mcp\` from nx-console \`master\`, ahead of the latest published release
(\`${release}\`).
${
  SOURCES.length
    ? `
It carries these changes, which are proposed upstream:

${SOURCES.map(
  (source) =>
    `${fixLine(source)} From [\`${source.branch}\`](https://github.com/${REPO}/tree/${source.branch}) at \`${source.sha}\`.`,
).join('\n')}
`
    : ''
}${
  UNRELEASED.length
    ? `
It includes these changes, merged into \`master\` but not yet in a published release:

${UNRELEASED.map(fixLine).join('\n')}
`
    : ''
}
This branch holds only the build output, so \`npx\` can run it without cloning or building
nx-console:

\`\`\`bash
claude mcp add nx-mcp-patched -- npx -y github:${REPO}#${DIST_BRANCH} --minimal
\`\`\`

Delete this branch once these changes ship in the published \`nx-mcp\`.

Built from \`${buildBranch}\` at \`${headSha}\`. To update it, rebase
[\`nx-mcp-patched-build\`](https://github.com/${REPO}/tree/nx-mcp-patched-build) onto
\`master\`${SOURCES.length ? ' and the branches above' : ''} and run \`node tools/scripts/publish-nx-mcp-patched.mjs\`.
`;

const packageJson = {
  name: 'nx-mcp',
  // Build metadata, so the version names both the release it builds on and the commit.
  version: `${release}+patched.${headSha.slice(0, 7)}`,
  description: `nx-mcp built from ${REPO} ${buildBranch} (nx-console master ahead of ${release})`,
  license: 'MIT',
  bin: 'main.js',
  files: ['main.js', 'README.md'],
};

const worktree = mkdtempSync(join(tmpdir(), `${DIST_BRANCH}-`));
try {
  git(['worktree', 'add', '--detach', worktree, `${REMOTE}/${DIST_BRANCH}`]);
  const inWorktree = { cwd: worktree };
  writeFileSync(join(worktree, 'main.js'), `#!/usr/bin/env node\n${bundle}`, {
    mode: 0o755,
  });
  writeFileSync(join(worktree, 'README.md'), readme);
  writeFileSync(
    join(worktree, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  git(['add', '-A'], inWorktree);
  if (!git(['status', '--porcelain'], inWorktree)) {
    console.log(`${DIST_BRANCH} already holds this build; nothing to publish.`);
  } else {
    git(
      [
        'commit',
        '-q',
        '-m',
        `Build nx-mcp from ${[`${buildBranch} (${headSha.slice(0, 7)})`, ...SOURCES.map((source) => `${source.branch} (${source.sha.slice(0, 7)})`)].join(', ')}`,
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
