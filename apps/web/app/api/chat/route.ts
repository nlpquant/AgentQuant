import { TextUIPart, type UIMessage } from 'ai';

export const maxDuration = 60;

interface IntermediateData {
  id: string;
  parent_id: string;
  type: string;
  name: string;
  payload: string | { input: any; output: any };
}
interface OpenAIChatChunk {
  choices: { delta?: { content: string } }[];
}

type ParsedPayloadValue = Record<string, unknown> | string | null;

function parsePayload(payload: string): {
  input: ParsedPayloadValue;
  output: ParsedPayloadValue;
} {
  const result: { input: ParsedPayloadValue; output: ParsedPayloadValue } = {
    input: null,
    output: null,
  };

  const inputRegex =
    /\*\*Function Input:\*\*\s*```(?:json|python)\n([\s\S]*?)\n```/;
  const outputRegex =
    /\*\*Function Output:\*\*\s*```(?:json|python)\n([\s\S]*?)\n```/;

  const inputMatch = payload.match(inputRegex);
  const outputMatch = payload.match(outputRegex);

  // 提取、清理并解析 Input
  if (inputMatch && inputMatch[1]) {
    try {
      const sanitizedString = inputMatch[1]
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/'/g, '"');
      result.input = JSON.parse(sanitizedString);
    } catch (e) {
      console.error('Failed to parse Function Input:', inputMatch[1], e);
    }
  }

  if (outputMatch && outputMatch[1]) {
    try {
      const sanitizedString = outputMatch[1]
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/'/g, '"');
      result.output = JSON.parse(sanitizedString);
    } catch (e) {
      console.warn('Could not parse Function Output as JSON:', outputMatch[1]);

      // Try to extract JSON from ChatResponseChunk format
      try {
        // Look for content='...' pattern (original format)
        let chunkMatch = outputMatch[1].match(/content='([^']+)'/);
        if (chunkMatch && chunkMatch[1]) {
          const jsonContent = chunkMatch[1].replace(/\\"/g, '"');
          result.output = JSON.parse(jsonContent);
          console.log(
            'Successfully parsed JSON from ChatResponseChunk (quoted):',
            result.output
          );
        } else {
          // Look for content="..." pattern (double quotes)
          chunkMatch = outputMatch[1].match(/content="([^"]+)"/);
          if (chunkMatch && chunkMatch[1]) {
            const jsonContent = chunkMatch[1].replace(/\\"/g, '"');
            result.output = JSON.parse(jsonContent);
            console.log(
              'Successfully parsed JSON from ChatResponseChunk (double-quoted):',
              result.output
            );
          } else {
            // Look for content field with JSON content directly
            chunkMatch = outputMatch[1].match(/content='({\s*[\s\S]*?\s*})'/);
            if (chunkMatch && chunkMatch[1]) {
              result.output = JSON.parse(chunkMatch[1]);
              console.log(
                'Successfully parsed JSON from ChatResponseChunk (JSON block):',
                result.output
              );
            } else {
              // Try to extract the entire JSON block that might be in the content
              const jsonBlockMatch =
                outputMatch[1].match(/({\s*"[\s\S]*?\s*})/);
              if (jsonBlockMatch && jsonBlockMatch[1]) {
                result.output = JSON.parse(jsonBlockMatch[1]);
                console.log(
                  'Successfully parsed JSON block from ChatResponseChunk:',
                  result.output
                );
              } else {
                result.output = outputMatch[1];
              }
            }
          }
        }
      } catch (innerError) {
        console.warn(
          'Failed to parse ChatResponseChunk format as well:',
          innerError
        );
        result.output = outputMatch[1];
      }
    }
  }

  console.log('[Parsed Payload]:', result);
  return result;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const agentUrl = process.env.AGENT_SERVER_URL || 'http://localhost:8000';
    const response = await fetch(`${agentUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(message => ({
          role: message.role,
          content:
            (message.parts.find(part => part.type === 'text') as TextUIPart)
              ?.text || '',
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Upstream API failed with status ${response.status}:`,
        errorBody
      );
      throw new Error(`Upstream API error: ${response.statusText}`);
    }

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

                  if (typeof jsonData.payload === 'string') {
                    jsonData.payload = parsePayload(jsonData.payload);
                  }

                  controller.enqueue(
                    `data: ${JSON.stringify({ type: 'data-json', data: jsonData })}\n\n`
                  );
                } catch (e) {
                  console.error('Failed to parse intermediate_data JSON:', e);
                }
              }
            } else if (line.startsWith('data:')) {
              const jsonString = line.substring('data:'.length);
              try {
                const json: OpenAIChatChunk = JSON.parse(jsonString);
                const content = json.choices[0]?.delta?.content || '';

                if (content) {
                  controller.enqueue(
                    `data: ${JSON.stringify({ type: 'text', text: content })}\n\n`
                  );
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
    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
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
