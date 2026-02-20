# Nano Banana MCP Server

MCP服务器，用于通过Google AI Studio API调用Nano Banana Pro图像生成模型。

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

## 运行

```bash
npm start
```

## 在opencode中使用

在opencode的mcp配置中添加：

```json
{
  "mcpServers": {
    "nanobanana": {
      "type": "local",
      "args": ["node", "/path/to/nanobanana/index.js"],
      "environment": {
        "GOOGLE_API_KEY": "your_api_key"
      }
    }
  }
}
```

## 工具

### generate_image

生成图像

**参数：**
- `prompt` (required): 图像描述文本
- `aspect_ratio`: 宽高比 (如 "16:9", "1:1", "9:16")
- `quality`: 质量 ("standard" 或 "high")
- `number_of_images`: 生成数量 (1-4)

**示例：**
```
用nano banana画一只可爱的猫咪
```
