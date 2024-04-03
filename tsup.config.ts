import { defineConfig } from "tsup";


export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  external: ['react', 'react-dom'],
  target: 'es2016',
  treeshake: true,
});
