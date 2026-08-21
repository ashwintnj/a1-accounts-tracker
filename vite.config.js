import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'A1 Shop Accounts',
                short_name: 'A1 Accounts',
                description: 'Daily shop accounts calculator with synced records',
                theme_color: '#1e40af',
                background_color: '#f8fafc',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'pwa-512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'pwa-512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
});
