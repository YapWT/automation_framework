import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue"; // <--- 1. Import the plugin

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [vue()], // <--- 2. Add the plugin here

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring tauri errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is used
    server: {
        port: 1420,
        strictPort: true,
        host: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 1421,
        },
    },
    // 3. to make use of `TAURI_DEBUG` and other env variables
    // https://tauri.app/v1/api/config#buildconfig.beforedevcommand
    envPrefix: ["VITE_", "TAURI_"],
}));
