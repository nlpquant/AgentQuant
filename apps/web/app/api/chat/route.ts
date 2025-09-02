// app/api/chat/route.ts
// NO import from 'ai' is needed for the response itself, only for types if you use them.
import { TextUIPart, type UIMessage } from 'ai';

export const maxDuration = 60;

// Define your custom data structure
interface IntermediateData {
  id: string;
  parent_id: string;
  type: string;
  name: string;
  payload: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(message => ({
          role: message.role,
          content: (message.parts[0] as TextUIPart).text,
        })),
        stream: true,
      }),
    });

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const transformStream = new TransformStream<Uint8Array, string>({
      transform: (function () {
        const decoder = new TextDecoder();
        let buffer = '';

        return function (chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || line.includes('[DONE]')) {
              continue;
            }

            if (line.startsWith('intermediate_data:')) {
              if (line.includes('Function Complete:')) {
                const jsonString = line.substring('intermediate_data:'.length);
                try {
                  const jsonData: IntermediateData = JSON.parse(jsonString);
                  controller.enqueue(`2:${JSON.stringify(jsonData)}\n`);
                } catch (e) {
                  console.error('Failed to parse intermediate_data JSON:', e);
                }
              }
            } else if (line.startsWith('data:')) {
              const jsonString = line.substring('data:'.length);
              try {
                const json = JSON.parse(jsonString);
                const content =
                  json.choices[0]?.delta?.content ||
                  json.choices[0]?.message?.content ||
                  '';
                if (content) {
                  controller.enqueue(`0:${JSON.stringify(content)}\n`);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        };
      })(),
    });

    const customStream = response.body.pipeThrough(transformStream);

    // Manually create a Response object with the correct headers.
    // This replaces the deprecated StreamingTextResponse helper.
    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff', // Recommended security header
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
