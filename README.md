# Nano Banana MCP Server

MCP服务器，用于通过Google AI Studio API调用Gemini Nano Banana Pro (gemini-3-pro-image-preview) 图像生成模型。

版本: 1.0.0

## 功能
- 调用Google Gemini Nano Banana模型生成图像
- 支持通过MCP协议在opencode等客户端中使用
- 生成图片会保存到本地文件

## 安装

```bash
npm install
npm run build
```

## 配置

1. 复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

2. 在 `.env` 中设置你的Google API Key：
```
GOOGLE_API_KEY=your_api_key_here
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GOOGLE_API_KEY` | Google AI Studio API密钥 | (必填) |
| `HTTPS_PROXY` | HTTPS代理地址 | 系统代理 |

## 运行

```bash
npm start
```

## 在opencode中使用

在opencode的mcp配置中添加：

```json
{
  "mcp": {
    "nanobanana": {
      "type": "local",
      "command": ["node", "/path/to/nanobanana-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
```

## 工具

### generate_image

生成图像

**参数：**
- `prompt` (required): 图像描述文本
- `output_dir`: 图片保存目录 (默认当前目录)

**示例：**
```
用nano banana画一只可爱的猫咪
```
