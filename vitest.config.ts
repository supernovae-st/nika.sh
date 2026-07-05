import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    /* concurrent-session worktrees live under .claude/worktrees/ — without
       this the runner collects their whole test tree a second time. */
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
