import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

const llm = createOpenAI({
    name: 'nvidia-nemo-agent',
    baseURL: 'http://localhost:8000/v1',
});

export async function POST(req: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await req.json();

        const result = streamText({
            model: llm('default'),
            messages: convertToModelMessages(messages)
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}