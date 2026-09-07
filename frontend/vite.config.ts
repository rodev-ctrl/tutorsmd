import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

const shouldAnalyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),

    shouldAnalyze &&
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  resolve: {
    // <critical>
    // Порядок расширений задан явно, потому что умолчание vite —
    //   ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
    // ставит .js ПЕРЕД .ts, а в src/ рядом с исходниками лежат старые
    // скомпилированные .js (следствие отсутствия noEmit в tsconfig, уже
    // исправлено; сами файлы остались).
    //
    // Из-за этого безрасширенный импорт
    //   lazy(() => import('@pages/auth/LoginPage'))
    // подхватывал LoginPage.js от 18 июня вместо LoginPage.tsx от 3 сентября.
    // В собранном бандле не оказалось ни Google-авторизации, ни карточки
    // саммари урока: соответствующие .tsx просто не попадали в граф модулей.
    //
    // Особенно коварно то, что tsc этого НЕ ловит: у TypeScript обратный
    // приоритет (.ts раньше .js), поэтому typecheck проходил по свежему коду,
    // а сборка шла по старому. Здесь приоритет приводится к тому же, что у tsc.
    // </critical>
    extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:7898',
        changeOrigin: true,
      },

      '/socket.io': {
        target: 'http://localhost:7898',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});