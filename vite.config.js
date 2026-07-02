import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// kcbc/ 폴더 루트에 위치. CLAUDE.md / 스킬.md 를 ?raw import 로 가져온다.
// 프로덕션 빌드에서 React는 ESM CDN(esm.sh)에서 로드 → 단일 HTML 인라인 시 크기 절감.
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        plugins: [react()],
        // dev = 루트, 프로덕션 빌드 = GitHub Pages 프로젝트 경로 (cosan75.github.io/kcbc/)
        base: command === 'build' ? '/kcbc/' : '/',
        server: { port: 5174, strictPort: true },
        assetsInclude: ['**/*.md'],
        build: command === 'build'
            ? {
                rollupOptions: {
                    external: ['react', 'react-dom', 'react-dom/client'],
                },
            }
            : {},
    });
});
