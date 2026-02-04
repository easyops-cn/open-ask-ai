import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import { readFileSync } from 'fs'
import { rm } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = __dirname

await rm(join(rootDir, 'dist/esm'), { recursive: true, force: true })
await rm(join(rootDir, 'dist/cjs'), { recursive: true, force: true })

// Read package.json for version and dependencies
const pkg = JSON.parse(
  readFileSync(join(rootDir, 'package.json'), 'utf-8')
)

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'react/jsx-runtime'
]

const plugins = [
  peerDepsExternal(),
  resolve({
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }),
  commonjs(),
  typescript({
    tsconfig: join(rootDir, 'tsconfig.rollup.json'),
    declaration: false,
    declarationMap: false,
  }),
  postcss({
    extract: 'styles.css', // Extract CSS to separate file
    modules: {
      // Enable CSS modules for .module.css files
      generateScopedName: '[local]_[hash:base64:5]'
    },
    autoModules: true, // Auto-detect .module.css files
    minimize: false,
    inject: false
  })
]

export default [
  // ESM build (for modern bundlers like Vite, Webpack 5)
  // Supports code splitting for React.lazy()
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'es',
      sourcemap: true,
      preserveModules: false,
      chunkFileNames: 'ask-ai.js',
    },
    external,
    plugins,
  },

  // CJS build (for Node.js, older bundlers)
  // Inlines dynamic imports for compatibility
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
    },
    external,
    plugins,
  },

  // UMD build (for CDN, includes React)
  // {
  //   input: 'src/index.ts',
  //   output: {
  //     file: 'dist/index.umd.js',
  //     format: 'umd',
  //     name: 'AskAI',
  //     sourcemap: true,
  //     globals: {
  //       react: 'React',
  //       'react-dom': 'ReactDOM',
  //       'react/jsx-runtime': 'jsxRuntime'
  //     },
  //   },
  //   external: [], // Don't externalize anything for UMD
  //   plugins: [
  //     resolve({
  //       extensions: ['.ts', '.tsx', '.js', '.jsx'],
  //       browser: true
  //     }),
  //     commonjs(),
  //     typescript({
  //       tsconfig: join(rootDir, 'tsconfig.rollup.json'),
  //       declaration: false,
  //       declarationMap: false,
  //     }),
  //     postcss({
  //       extract: false,
  //       modules: {
  //         generateScopedName: '[local]_[hash:base64:5]'
  //       },
  //       autoModules: true,
  //       minimize: true,
  //       inject: true
  //     })
  //   ],
  // },
]
