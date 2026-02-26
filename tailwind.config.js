// tailwind.config.js
// Tailwind CSS 配置文件，用于自定义主题、插件和内容路径

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 内容路径：告诉 Tailwind 应该扫描哪些文件以提取类名
  // 必须包含所有使用 Tailwind 类的文件路径
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',        // 扫描 pages 目录下的所有 JS/TS/JSX/TSX 文件
    './components/**/*.{js,ts,jsx,tsx}',    // 如果有 components 目录，也要扫描
    './app/**/*.{js,ts,jsx,tsx}',            // 如果使用 App Router 模式（可选）
    './lib/**/*.{js,ts,jsx,tsx}',            // lib 目录中可能包含样式类（如条件类名）
    './hooks/**/*.{js,ts,jsx,tsx}',          // hooks 目录
    './layouts/**/*.{js,ts,jsx,tsx}',        // layouts 目录
  ],

  // 主题配置：用于扩展或覆盖默认主题
  theme: {
    extend: {
      // 在此处添加自定义颜色、字体、间距等
      // 例如：
      // colors: {
      //   'brand-pink': '#FF69B4',
      // },
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'],
      // },
      // 动画和关键帧也可以在此扩展
    },
  },

  // 插件：添加官方或第三方插件
  plugins: [
    // 例如：需要表单样式时可添加 @tailwindcss/forms 插件
    // require('@tailwindcss/forms'),
    // 需要排版样式时可添加 @tailwindcss/typography
    // require('@tailwindcss/typography'),
  ],

  // 暗黑模式配置（如果项目需要暗黑模式）
  // darkMode: 'class', // 或 'media'
};
