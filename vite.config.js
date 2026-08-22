import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['a1_logo.png'],
            manifest: {
                name: 'A1 Maligai - Accounts',
                short_name: 'A1 Maligai',
                description: 'Daily shop accounts calculator with synced records',
                theme_color: '#1e40af',
                background_color: '#f8fafc',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'a1_logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'a1_logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'a1_logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
});
