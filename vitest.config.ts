import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Unit tests for pure logic (no DB / React / network). tsconfigPaths resolves
// the `@/*` alias from tsconfig.json so test files can import like the app does.
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        globals: false,
        include: ['lib/**/*.test.ts'],
    },
})
