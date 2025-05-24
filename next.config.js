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
  // Firebaseをクライアントサイドでのみ実行
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでのFirebase関連モジュールを外部化
      config.externals = config.externals || [];
      config.externals.push({
        'firebase/firestore': 'commonjs firebase/firestore',
        'firebase/firestore/lite': 'commonjs firebase/firestore/lite'
      });
    }
    return config;
  }
}

module.exports = nextConfig