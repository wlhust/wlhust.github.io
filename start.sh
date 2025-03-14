#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 检查端口是否被占用的函数
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口可用
    fi
}

# 终止指定端口上的进程
kill_port() {
    local port=$1
    echo "正在终止端口 $port 上的进程..."
    lsof -ti :$port | xargs kill -9 2>/dev/null
}

# 清理函数
cleanup() {
    echo "正在清理进程..."
    kill_port 8000
    kill_port 8765
    deactivate 2>/dev/null  # 退出虚拟环境
    exit 0
}

# 设置清理钩子
trap cleanup SIGINT SIGTERM

# 检查并清理端口
if check_port 8000; then
    echo "端口 8000 已被占用，正在清理..."
    kill_port 8000
fi

if check_port 8765; then
    echo "端口 8765 已被占用，正在清理..."
    kill_port 8765
fi

# 检查必要文件是否存在
if [ ! -f "$SCRIPT_DIR/cartpole_server.py" ]; then
    echo "错误：找不到 cartpole_server.py 文件"
    echo "当前目录: $SCRIPT_DIR"
    echo "请确保文件位于正确位置"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/requirements.txt" ]; then
    echo "错误：找不到 requirements.txt 文件"
    echo "当前目录: $SCRIPT_DIR"
    echo "请确保文件位于正确位置"
    exit 1
fi

# 进入脚本目录
cd "$SCRIPT_DIR"

# 创建并激活虚拟环境
echo "正在设置Python虚拟环境..."
python -m venv venv
source venv/bin/activate

# 升级pip
echo "正在升级pip..."
pip install --upgrade pip

# 安装依赖
echo "正在安装依赖..."
pip install -r requirements.txt

# 验证依赖安装
echo "正在验证依赖..."
if ! python -c "import websockets" 2>/dev/null; then
    echo "错误：websockets 包安装失败"
    echo "尝试单独安装 websockets..."
    pip install websockets
fi

if ! python -c "import websockets" 2>/dev/null; then
    echo "错误：无法安装 websockets 包"
    cleanup
    exit 1
fi

# 启动Python训练服务器
echo "正在启动训练服务器..."
python "$SCRIPT_DIR/cartpole_server.py" &
server_pid=$!

# 等待训练服务器启动
sleep 2

# 检查训练服务器是否成功启动
if ! check_port 8765; then
    echo "错误：训练服务器启动失败"
    cleanup
    exit 1
fi

# 启动HTTP服务器
echo "正在启动HTTP服务器..."
cd "$SCRIPT_DIR"  # 确保在正确的目录下启动HTTP服务器
python -m http.server 8000 &
http_pid=$!

# 等待HTTP服务器启动
sleep 1

# 检查HTTP服务器是否成功启动
if ! check_port 8000; then
    echo "错误：HTTP服务器启动失败"
    cleanup
    exit 1
fi

echo "系统启动成功！"
echo "请在浏览器中访问 http://localhost:8000/reinforcement_learning.html"
echo "按Ctrl+C退出..."

# 等待子进程
wait $server_pid $http_pid 