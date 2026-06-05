import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { loadEnvLocal } from '../../../lib/load-env-local';

loadEnvLocal();

const getAnthropicModel = (modelId: string) => {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN;

  if (!apiKey && !authToken) {
    throw new Error('Missing Anthropic API key or auth token.');
  }

  return createAnthropic({ apiKey, authToken })(modelId);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage in request body.' }, { status: 400 });
    }

    const prompt = `Extract the academic subject and concept from the following student message. Respond with ONLY a JSON object containing exactly two string fields: subject and concept. If the message is not about studying a concept, return subject: '' and concept: ''.\n\nMessage: ${userMessage}`;

    const response = await generateText({
      model: getAnthropicModel('claude-haiku-4-5-20251001'),
      prompt,
    });

    const text = response.text?.trim() ?? '';

    let parsed = { subject: '', concept: '' };

    try {
      const jsonStart = text.indexOf('{');
      const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
      const data = JSON.parse(jsonText);
      parsed.subject = typeof data.subject === 'string' ? data.subject : '';
      parsed.concept = typeof data.concept === 'string' ? data.concept : '';
    } catch (parseError) {
      console.warn('Failed to parse extraction response:', parseError, 'raw:', text);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('detect-concept API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
