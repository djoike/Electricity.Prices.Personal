import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Use a relative base so assets load correctly under any subpath (GH Pages, custom domain, local preview)
export default defineConfig({
  plugins: [vue()],
  base: './',
});
