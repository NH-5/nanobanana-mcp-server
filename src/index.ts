import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import path from 'path';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';

function httpRequest(url: string, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      ...(agent && { agent }),
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

interface GenerateImageArgs {
  prompt: string;
  aspect_ratio?: string;
  quality?: string;
  number_of_images?: number;
}

const server = new Server(
  {
    name: 'nanobanana-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_image',
        description: 'Generate images using Google Gemini Nano Banana (gemini-2.5-flash-image) model',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
            },
            aspect_ratio: {
              type: 'string',
              description: 'Aspect ratio of the image (e.g., "16:9", "1:1", "9:16")',
              default: '16:9',
            },
            quality: {
              type: 'string',
              description: 'Quality of the image (standard or high)',
              default: 'standard',
            },
            number_of_images: {
              type: 'number',
              description: 'Number of images to generate (1-4)',
              default: 1,
            },
          },
          required: ['prompt'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'generate_image') {
    try {
      const genArgs = args as unknown as GenerateImageArgs;
      const { prompt, aspect_ratio, quality, number_of_images } = genArgs;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`;
      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const responseText = await httpRequest(apiUrl, requestBody);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      const images = data.candidates?.[0]?.content?.parts?.filter(
        (part: any) => part.inlineData?.data
      ) || [];

      if (images.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      const imageResults = images.map((img: any, index: number) => ({
        index: index + 1,
        mimeType: img.inlineData.mimeType,
        data: img.inlineData.data,
      }));

      for (const img of imageResults) {
        const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
        const filename = `generated_image_${Date.now()}_${img.index}.${ext}`;
        const filepath = path.join(OUTPUT_DIR, filename);
        const buffer = Buffer.from(img.data, 'base64');
        fs.writeFileSync(filepath, buffer);
        console.error(`Image saved to: ${filepath}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Generated ${imageResults.length} image(s):\n${JSON.stringify(imageResults.map((r: any) => ({
              index: r.index,
              mimeType: r.mimeType,
              hasData: !!r.data
            })), null, 2)}`,
          },
          ...imageResults.map((img: any) => ({
            type: 'image',
            data: img.data,
            mimeType: img.mimeType,
          })),
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_API_KEY environment variable is not set');
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nano Banana MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
