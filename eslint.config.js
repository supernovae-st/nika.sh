import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    /* R3F scene code is deliberately imperative — per-frame mutation of
       cameras / materials / uniforms inside useFrame is the canonical
       react-three-fiber pattern (never setState per frame), and
       Math.random() inside useMemo is one-shot procedural generation.
       The React-Compiler lint rules (purity / immutability / use-memo)
       are structurally wrong for this layer — disabled HERE ONLY. */
    files: ['src/scene/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/use-memo': 'off',
    },
  },
])
