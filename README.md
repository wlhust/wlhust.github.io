# Markdown编辑器

这是一个简单而功能强大的Markdown编辑器网页应用，允许用户在左侧输入原始Markdown格式文本，在右侧实时查看解析后的内容。

## 功能特点

- **实时预览**：输入Markdown文本时，右侧立即显示渲染结果
- **语法高亮**：支持多种编程语言的代码高亮显示
- **主题切换**：支持亮色/暗色模式切换
- **本地存储**：自动保存编辑内容到浏览器本地存储
- **导出功能**：支持下载Markdown文件和复制HTML内容
- **响应式设计**：适配不同屏幕尺寸的设备
- **安全处理**：使用DOMPurify防止XSS攻击

## 技术栈

- HTML5 / CSS3 / JavaScript (ES6+)
- [Bootstrap 5](https://getbootstrap.com/) - 用于UI组件和响应式布局
- [Marked.js](https://marked.js.org/) - Markdown解析器
- [Highlight.js](https://highlightjs.org/) - 代码语法高亮
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML内容净化，防止XSS攻击

## 使用方法

1. 打开`index.html`文件在浏览器中运行
2. 在左侧编辑区输入Markdown格式的文本
3. 右侧预览区将实时显示渲染后的内容
4. 使用顶部的主题切换开关切换亮色/暗色模式
5. 使用编辑区上方的按钮加载示例或清空内容
6. 使用预览区上方的按钮复制HTML或下载Markdown文件

## 本地开发

如果您想在本地开发和修改此项目：

1. 克隆或下载此仓库到本地
2. 使用您喜欢的代码编辑器打开项目
3. 在浏览器中打开`index.html`文件进行测试
4. 修改`css/style.css`自定义样式
5. 修改`js/script.js`自定义功能

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 许可证

MIT

## 贡献

欢迎提交问题和改进建议！ 