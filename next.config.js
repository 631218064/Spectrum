/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 React 严格模式，帮助发现潜在问题（如不安全的生命周期）
  reactStrictMode: true,

  // 输出模式设置为 'standalone'，这是为了在 Vercel 等无服务器环境部署时，
  // 生成独立的 .next/standalone 文件夹，包含所有运行所需的代码和依赖。
  // Vercel 会自动处理，但保留此选项可以确保与本地构建的一致性。
  output: 'standalone',

  // 图像优化配置
  images: {
    // 由于 Supabase Storage 提供的图片 URL 是公开的，并且我们可能希望使用 Next.js 的图像优化功能，
    // 可以将 unoptimized 设为 false，并配置远程图片的域名白名单。
    // 如果设为 true，则会绕过优化直接输出原图。
    unoptimized: false,

    // 配置允许加载图片的远程域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // 允许所有 Supabase 子域名
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 允许 Unsplash 图片（用于示例头像）
      },
      // 如果有其他图片源，可以继续添加
    ],
  },

  // 国际化（i18n）配置，支持多语言
  i18n: {
    // 支持的语言列表，en 英文，zh 中文
    locales: ['en', 'zh'],
    // 默认语言，当 URL 中不包含语言前缀时使用
    defaultLocale: 'en',
    // 是否根据浏览器语言自动重定向，建议设为 false 以避免干扰用户选择
    localeDetection: false,
  },

  // 如果需要自定义构建后的静态资源路径（例如使用 CDN），可以在这里设置 assetPrefix
  // assetPrefix: 'https://your-cdn-domain.com',

  // 环境变量前缀：所有 NEXT_PUBLIC_* 开头的变量会自动暴露给浏览器端
  // 无需在此处额外配置
};

module.exports = nextConfig;