import { fileURLToPath } from 'node:url'

// Packages are linked by path aliases rather than npm workspaces: the repo
// lives on an exFAT drive, which can't hold the symlinks workspaces need.
// Keep in sync with "paths" in tsconfig.json.
const src = (name: string) => fileURLToPath(new URL(`./packages/${name}/src`, import.meta.url))

export const packageAliases = {
  '@art-widgets/core': src('core'),
  '@art-widgets/ui': src('ui'),
  '@art-widgets/node-card': src('node-card'),
  '@art-widgets/story': src('story'),
  '@art-widgets/time-map': src('time-map'),
}
