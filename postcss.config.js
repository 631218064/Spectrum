// postcss.config.js
// PostCSS 配置文件，用于处理 CSS 的转换和优化
// Next.js 项目通常需要此文件来集成 Tailwind CSS

module.exports = {
  plugins: {
    // Tailwind CSS 插件：生成 Tailwind 工具类
    // 必须安装 tailwindcss 依赖
    tailwindcss: {},

    // Autoprefixer 插件：自动添加浏览器厂商前缀，以支持不同浏览器
    // 必须安装 autoprefixer 依赖
    autoprefixer: {},

    // 如果需要使用其他 PostCSS 插件，可以在此添加
    // 例如：postcss-preset-env 用于使用未来的 CSS 特性
    // 'postcss-preset-env': {},
    
    // 注意：插件顺序通常不影响，但某些插件可能需要特定顺序
    // 如有特殊需求，可以查阅插件文档调整顺序
  },
};