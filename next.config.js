/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScriptの厳密チェックを有効化
  typescript: {
    // ビルド時にTypeScriptエラーを無視しない
    ignoreBuildErrors: false,
  },
  // ESLintの厳密チェックを有効化
  eslint: {
    // ビルド時にESLintエラーを無視しない
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig