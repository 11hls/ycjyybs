/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './flappy.html'],
  theme: {
    extend: {
      colors: {
        bg:      '#14161d',
        card:    '#1b1e26',
        line:    '#33363d',
        soft:    '#d3d5dc',
        dim:     '#c8cbd2',
        brand:   '#3b82f6',
        brand2:  '#7dd3fc',
      },
      fontFamily: {
        sans: ['system-ui', '"Segoe UI"', 'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['system-ui', '"Segoe UI"', 'Roboto', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
