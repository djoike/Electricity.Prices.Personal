import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';


// IMPORTANT: base must match the GitHub Pages repo name
// so that assets resolve correctly under https://<user>.github.io/<repo>/
export default defineConfig({
    plugins: [vue()],
    base: '/Electricity.Prices.Personal/',
});