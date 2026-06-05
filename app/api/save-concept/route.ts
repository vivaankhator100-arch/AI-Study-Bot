import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      subject,
      concept,
      masteryLevel,
      overviewGist,
      deepDiveGist,
      strongAreas,
      weakAreas,
      nextSteps,
      notes,
    } = body;

    if (!subject || !concept) {
      return NextResponse.json(
        { error: 'Missing required fields: subject and concept.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('concepts')
      .upsert(
        {
          subject,
          concept,
          mastery_level: masteryLevel || null,
          overview_gist: overviewGist || null,
          deep_dive_gist: Array.isArray(deepDiveGist) ? deepDiveGist : [],
          strong_areas: Array.isArray(strongAreas) ? strongAreas : [],
          weak_areas: Array.isArray(weakAreas) ? weakAreas : [],
          next_steps: Array.isArray(nextSteps) ? nextSteps : [],
          notes: notes || null,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'subject,concept' }
      )
      .select();

    if (error) {
      console.error('Supabase upsert failed:', error);
      return NextResponse.json(
        { error: 'Failed to save concept to database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('save-concept API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
