import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    allowedHosts: ['osintx.loca.lt']
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-d3': ['d3-geo', 'react-simple-maps'],
          'vendor-ui': ['lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-utils': ['prop-types'],
          'vendor-tools-heavy': [
            './src/components/tools/EmailIntelTool',
            './src/components/tools/GHuntTool',
            './src/components/tools/SherlockTool',
            './src/components/tools/IPIntelligenceTool',
          ],
          'page-case-detail': ['./src/pages/dashboards/user/CaseDetailPage'],
          'page-dashboard': ['./src/pages/dashboards/user/CyberAvatarDashboard'],
          'page-workspace': ['./src/pages/dashboards/user/InvestigationWorkspace'],
          'page-student': ['./src/pages/dashboards/student/RestrictedFieldInterface'],
        }
      }
    },
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@contexts': path.resolve(__dirname, 'src/context'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    }
  }
})
