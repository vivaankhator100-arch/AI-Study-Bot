import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { supabase } from '../../../lib/supabase-server';

const getAnthropicModel = (modelId: string) => {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN;

  if (!apiKey && !authToken) {
    throw new Error('Missing Anthropic API key or auth token.');
  }

  return createAnthropic({ apiKey, authToken })(modelId);
};

function buildSystemPrompt(row: Record<string, unknown> | null, subject: string, concept: string) {
  const title = [subject, concept].filter(Boolean).join(' - ') || 'a learning topic';
  const weakAreas = row?.weak_areas ? String(row.weak_areas).trim() : '';
  const strongAreas = row?.strong_areas ? String(row.strong_areas).trim() : '';
  const masteryLevel = row?.mastery_level ? String(row.mastery_level).trim() : '';

  let modeText: string;

  if (!row) {
    modeText = `Mode A: beginner friendly, analogy-first, define all terms. Assume the learner is encountering this material for the first time and keep the explanation clear and concrete.`;
  } else if (masteryLevel === 'Introduced' || masteryLevel === 'Developing') {
    modeText = `Mode B: reference prior knowledge, mention weak areas, and use a moderate pace. Help the learner build on what they already know while supporting their weaker skills.`;
  } else if (masteryLevel === 'Proficient' || masteryLevel === 'Strong') {
    modeText = `Mode C: technical, skip basics, and focus on nuance. Assume the learner already understands core concepts and concentrate on deeper insights, advanced examples, and subtle distinctions.`;
  } else {
    modeText = `Mode A: beginner friendly, analogy-first, define all terms. Assume the learner may need foundational support and keep the explanation clear.`;
  }

  let contextText = `You are a knowledgeable tutor answering a question about ${title}. ${modeText}`;

  if (weakAreas || strongAreas) {
    contextText += ' Use the learner profile below as context:';
    if (weakAreas) {
      contextText += ` Weak areas: ${weakAreas}.`;
    }
    if (strongAreas) {
      contextText += ` Strong areas: ${strongAreas}.`;
    }
  }

  contextText += ' Keep the answer supportive, focused on the learner, and aligned with the indicated level of mastery.';

  return contextText;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const concept = typeof body?.concept === 'string' ? body.concept.trim() : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage in request body.' }, { status: 400 });
    }

    let row: Record<string, unknown> | null = null;

    if (subject && concept) {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('subject', subject)
        .eq('concept', concept)
        .maybeSingle();

      if (error) {
        console.error('Supabase query failed:', error);
        return NextResponse.json({ error: 'Failed to query Supabase concepts.' }, { status: 500 });
      }

      row = data ?? null;
    }

    const systemPrompt = buildSystemPrompt(row, subject, concept);

    const streamResult = await streamText({
      model: getAnthropicModel('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textResponse = streamResult.toTextStreamResponse();

    return new NextResponse(textResponse.body, {
      status: textResponse.status,
      statusText: textResponse.statusText,
      headers: textResponse.headers,
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
