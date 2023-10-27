import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
// export default defineConfig(async () => ({
//   // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
//   // prevent vite from obscuring rust errors
//   clearScreen: false,
//   // tauri expects a fixed port, fail if that port is not available
//   server: {
//     port: 1420,
//     strictPort: true,
//   },
//   // to make use of `TAURI_DEBUG` and other env variables
//   // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
//   envPrefix: ["VITE_", "TAURI_"],
//   build: {
//     // Tauri supports es2021
//     target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
//     // don't minify for debug builds
//     minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
//     // produce sourcemaps for debug builds
//     sourcemap: !!process.env.TAURI_DEBUG,
//     rollupOptions: {
//       input: {
//         main: resolve(__dirname, 'index.html'),
//         newplaylist: resolve(__dirname, 'newplaylist/index.html'),
//       },
//     },
//   },
// }));

export default defineConfig({
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
  },
  // to access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: ['VITE_', 'TAURI_PLATFORM', 'TAURI_ARCH', 'TAURI_FAMILY', 'TAURI_PLATFORM_VERSION', 'TAURI_PLATFORM_TYPE', 'TAURI_DEBUG'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari16',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        newplaylist: resolve(__dirname, 'newplaylist/index.html'),
        settings: resolve(__dirname, 'settings/index.html'),
      },
    },
  },
})
