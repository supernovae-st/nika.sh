import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    /* concurrent-session worktrees live under .claude/worktrees/ AND as
       sibling wt-* checkouts in the repo root — without these the runner
       collects their whole test tree a second time (and fails on THEIR
       branch state, not ours). */
    exclude: [...configDefaults.exclude, '**/.claude/**', '**/wt-*/**'],
  },
})
