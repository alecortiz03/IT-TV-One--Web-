import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],

	server: {
		// Allows access from other devices on your network
		host: '0.0.0.0',

		// Vite development server
		port: 5173,

		// Allow Cloudflare Quick Tunnel URLs
		allowedHosts: ['.trycloudflare.com'],

		// Send /api requests to the Rust server
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
			},
		},
	},
});
