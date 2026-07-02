/**
 * public/ 정적 자산에 base-aware 경로를 부여.
 * - dev: /foo.html
 * - build (GitHub Pages): /kcbc/foo.html
 */
export const asset = (p: string): string =>
  import.meta.env.BASE_URL + p.replace(/^\//, '')
