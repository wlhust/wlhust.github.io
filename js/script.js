document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const markdownInput = document.getElementById('markdown-input');
    const markdownOutput = document.getElementById('markdown-output');
    const clearBtn = document.getElementById('clear-btn');
    const exampleBtn = document.getElementById('example-btn');
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    const downloadBtn = document.getElementById('download-btn');
    const themeSwitch = document.getElementById('checkbox');
    const themeModeText = document.querySelector('.theme-mode-text');
    
    // 初始化highlight.js
    hljs.configure({
        ignoreUnescapedHTML: true,
        throwUnescapedHTML: false
    });
    
    // 初始化marked库配置
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, language) {
            if (language) {
                try {
                    return hljs.highlight(code, {
                        language: language.toLowerCase(),
                        ignoreIllegals: true
                    }).value;
                } catch (err) {
                    console.error('代码高亮错误:', err);
                }
            }
            return hljs.highlightAuto(code).value;
        },
        langPrefix: 'hljs language-',
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: false,
        xhtml: false
    });
    
    // 实时渲染Markdown
    function renderMarkdown() {
        const markdownText = markdownInput.value;
        if (markdownText.trim() === '') {
            markdownOutput.innerHTML = `
                <div class="placeholder-text text-muted">
                    <p>在左侧输入Markdown文本，这里将实时显示渲染结果...</p>
                </div>
            `;
        } else {
            try {
                // 使用DOMPurify清理HTML，防止XSS攻击
                const rawHtml = marked.parse(markdownText);
                const cleanHtml = DOMPurify.sanitize(rawHtml);
                markdownOutput.innerHTML = cleanHtml;
                
                // 为所有链接添加target="_blank"属性
                const links = markdownOutput.querySelectorAll('a');
                links.forEach(link => {
                    if (link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    }
                });
                
                // 为代码块添加语言标签
                const codeBlocks = markdownOutput.querySelectorAll('pre code');
                codeBlocks.forEach(block => {
                    if (block.className) {
                        const language = block.className.replace('hljs language-', '');
                        const pre = block.parentNode;
                        
                        // 创建语言标签
                        const langTag = document.createElement('div');
                        langTag.className = 'code-language';
                        langTag.textContent = language;
                        langTag.style.position = 'absolute';
                        langTag.style.top = '0';
                        langTag.style.right = '0';
                        langTag.style.padding = '2px 8px';
                        langTag.style.fontSize = '0.75rem';
                        langTag.style.color = '#f8f9fa';
                        langTag.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        langTag.style.borderRadius = '0 0 0 4px';
                        
                        // 设置pre为相对定位，以便放置语言标签
                        pre.style.position = 'relative';
                        pre.style.paddingTop = '30px';
                        
                        pre.appendChild(langTag);
                    }
                });
                
                // 手动应用代码高亮
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
                
                // 添加淡入动画效果
                markdownOutput.classList.add('fade-in');
                setTimeout(() => {
                    markdownOutput.classList.remove('fade-in');
                }, 500);
            } catch (error) {
                console.error('Markdown解析错误:', error);
                markdownOutput.innerHTML = `<div class="alert alert-danger">解析错误: ${error.message}</div>`;
            }
        }
    }
    
    // 加载示例Markdown文本
    function loadExample() {
        markdownInput.value = `# Markdown编辑器示例

## 基本语法

### 标题

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

### 强调

*斜体文本* 或 _斜体文本_

**粗体文本** 或 __粗体文本__

***粗斜体文本*** 或 ___粗斜体文本___

### 列表

#### 无序列表

- 项目1
- 项目2
  - 子项目2.1
  - 子项目2.2
- 项目3

#### 有序列表

1. 第一项
2. 第二项
3. 第三项

### 链接

[Markdown编辑器](https://github.com/)

### 图片

![Markdown Logo](https://markdown-here.com/img/icon256.png)

### 引用

> 这是一段引用文本。
> 
> 这是引用的第二段。

### 代码

行内代码 \`const example = "hello world";\`

代码块：

\`\`\`javascript
function sayHello() {
  console.log("Hello, world!");
}

// 调用函数
sayHello();
\`\`\`

\`\`\`python
def say_hello():
    print("Hello, world!")
    
# 调用函数
say_hello()
\`\`\`

### 表格

| 姓名 | 年龄 | 职业 |
| ---- | ---- | ---- |
| 张三 | 25 | 工程师 |
| 李四 | 30 | 设计师 |
| 王五 | 28 | 产品经理 |

### 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项

### 水平线

---

### HTML支持

<details>
  <summary>点击展开详情</summary>
  <p>这里是详情内容，可以包含更多信息。</p>
</details>

<div align="center">
  <p>居中对齐的文本</p>
</div>

### 数学公式 (需要额外支持)

行内公式: $E=mc^2$

块级公式:

$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$

### 脚注

这里有一个脚注[^1]

[^1]: 这是脚注的内容。
`;
        renderMarkdown();
        markdownInput.focus();
    }
    
    // 清空编辑器
    function clearEditor() {
        markdownInput.value = '';
        renderMarkdown();
        markdownInput.focus();
    }
    
    // 复制HTML到剪贴板
    function copyHtml() {
        const htmlContent = markdownOutput.innerHTML;
        navigator.clipboard.writeText(htmlContent)
            .then(() => {
                const originalText = copyHtmlBtn.textContent;
                copyHtmlBtn.textContent = '已复制!';
                copyHtmlBtn.classList.add('btn-success');
                copyHtmlBtn.classList.remove('btn-outline-secondary');
                
                setTimeout(() => {
                    copyHtmlBtn.textContent = originalText;
                    copyHtmlBtn.classList.remove('btn-success');
                    copyHtmlBtn.classList.add('btn-outline-secondary');
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请重试');
            });
    }
    
    // 下载Markdown文件
    function downloadMarkdown() {
        const markdownText = markdownInput.value;
        if (markdownText.trim() === '') {
            alert('没有内容可下载');
            return;
        }
        
        const blob = new Blob([markdownText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'markdown_content.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 切换暗色/亮色模式
    function toggleTheme() {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeModeText.textContent = '亮色模式';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeModeText.textContent = '暗色模式';
            localStorage.setItem('theme', 'light');
        }
    }
    
    // 检查本地存储中的主题设置
    function checkTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeSwitch.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
            themeModeText.textContent = '亮色模式';
        } else {
            themeSwitch.checked = false;
            document.documentElement.setAttribute('data-theme', 'light');
            themeModeText.textContent = '暗色模式';
        }
    }
    
    // 检查本地存储中的Markdown内容
    function checkSavedContent() {
        const savedContent = localStorage.getItem('markdownContent');
        if (savedContent) {
            markdownInput.value = savedContent;
            renderMarkdown();
        }
    }
    
    // 保存Markdown内容到本地存储
    function saveContent() {
        localStorage.setItem('markdownContent', markdownInput.value);
    }
    
    // 自动调整文本区域高度
    function adjustTextareaHeight() {
        markdownInput.style.height = 'auto';
        markdownInput.style.height = (markdownInput.scrollHeight) + 'px';
    }
    
    // 事件监听器
    markdownInput.addEventListener('input', function() {
        renderMarkdown();
        saveContent();
    });
    
    clearBtn.addEventListener('click', clearEditor);
    exampleBtn.addEventListener('click', loadExample);
    copyHtmlBtn.addEventListener('click', copyHtml);
    downloadBtn.addEventListener('click', downloadMarkdown);
    themeSwitch.addEventListener('change', toggleTheme);
    
    // 初始化
    checkTheme();
    checkSavedContent();
    
    // 如果没有保存的内容，显示欢迎信息
    if (markdownInput.value.trim() === '') {
        markdownInput.value = `# 欢迎使用Markdown编辑器

这是一个简单而强大的Markdown编辑器，您可以在左侧输入Markdown格式的文本，右侧将实时显示渲染后的效果。

## 功能特点

- 实时预览Markdown渲染效果
- 支持代码高亮显示
- 暗色/亮色主题切换
- 自动保存编辑内容
- 导出Markdown文件

## 开始使用

点击右上角的"示例"按钮查看Markdown语法示例，或者直接开始编写您的内容。

祝您使用愉快！`;
        renderMarkdown();
    }

    // 添加分隔栏拖动功能
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;
    const rightSide = resizer.nextElementSibling;
    const wrapper = document.querySelector('.editor-wrapper');

    // 鼠标按下事件处理
    function mouseDownHandler(e) {
        resizer.classList.add('dragging');
        
        // 获取鼠标按下时的初始位置
        const startPos = e.clientX;
        const leftWidth = leftSide.getBoundingClientRect().width;
        const rightWidth = rightSide.getBoundingClientRect().width;
        const wrapperWidth = wrapper.getBoundingClientRect().width;

        // 鼠标移动事件处理
        function mouseMoveHandler(e) {
            // 计算移动距离
            const delta = e.clientX - startPos;
            const newLeftWidth = ((leftWidth + delta) / wrapperWidth * 100);
            const newRightWidth = ((rightWidth - delta) / wrapperWidth * 100);

            // 设置最小宽度限制
            if (newLeftWidth >= 20 && newRightWidth >= 20) {
                leftSide.style.flex = `0 0 ${newLeftWidth}%`;
                rightSide.style.flex = `0 0 ${newRightWidth}%`;
            }
        }

        // 鼠标松开事件处理
        function mouseUpHandler() {
            resizer.classList.remove('dragging');
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }

        // 添加事件监听
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    // 添加鼠标按下事件监听
    resizer.addEventListener('mousedown', mouseDownHandler);
}); 