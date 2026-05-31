import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_QUESTIONS = [
  '如果只能保留我们的一段回忆，你会选哪段？',
  '你觉得我什么时候最可爱？',
  '见面时你最想做的第一件事是什么？',
  '哪首歌会让你想起我？',
  '你最喜欢和我一起做什么？',
  '如果我们可以一起去任何地方，你想去哪？',
  '我做的什么小事会让你开心？',
  '你是什么时候第一次意识到爱我的？',
  '你对我们未来有什么梦想？',
  '分开的时候什么会让你想起我？',
  '你觉得我们最像哪对虚构情侣？',
  '如果我突然出现在你面前，你会做什么？',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];

    // Check if today's question already exists
    const { data: existing } = await supabaseClient
      .from('daily_questions')
      .select('id')
      .eq('date', today)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Question already exists for today', date: today }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent questions to avoid repeats
    const { data: recent } = await supabaseClient
      .from('daily_questions')
      .select('question_text')
      .order('date', { ascending: false })
      .limit(30);

    const usedTexts = new Set((recent || []).map((q: any) => q.question_text));

    // Try AI generation first
    let questionText: string | null = null;
    const mimoKey = Deno.env.get('XIAOMI_API_KEY');
    const mimoBaseUrl = Deno.env.get('XIAOMI_BASE_URL') ?? 'https://api.xiaomimimo.com/v1';
    const mimoModel = Deno.env.get('MIMO_MODEL') ?? 'mimo-v2.5-pro';

    if (mimoKey) {
      try {
        const usedList = Array.from(usedTexts).join('、');
        const aiResponse = await fetch(`${mimoBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mimoKey}`,
          },
          body: JSON.stringify({
            model: mimoModel,
            messages: [
              {
                role: 'system',
                content: '你是一个恋爱问题生成器。每次只输出一个简短的中文问题，适合情侣之间互相回答。问题要有深度、有趣、能引发思考。不要用引号包裹，不要编号，不要输出其他内容。',
              },
              {
                role: 'user',
                content: `为情侣生成一个每日问答问题。最近已经问过的问题（请避免重复）：${usedList || '无'}`,
              },
            ],
            temperature: 1.0,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const raw = aiData.choices?.[0]?.message?.content?.trim();
          if (raw) {
            // Clean up: remove quotes, numbering, extra whitespace
            questionText = raw
              .replace(/^["'"「【\d\.\s\-\*#]+/g, '')
              .replace(/["'"」】\s]+$/g, '')
              .trim();
          }
        }
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
      }
    }

    // Fallback: pick from hardcoded list
    if (!questionText) {
      const available = FALLBACK_QUESTIONS.filter((q) => !usedTexts.has(q));
      const pool = available.length > 0 ? available : FALLBACK_QUESTIONS;
      questionText = pool[Math.floor(Math.random() * pool.length)];
    }

    // Insert into database
    const { data: inserted, error: insertError } = await supabaseClient
      .from('daily_questions')
      .insert({ question_text: questionText, date: today })
      .select()
      .single();

    if (insertError) {
      // Race condition handling
      const { data: fallback } = await supabaseClient
        .from('daily_questions')
        .select('*')
        .eq('date', today)
        .single();

      return new Response(
        JSON.stringify({
          message: 'Used existing (race condition)',
          question: fallback,
          date: today,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Question generated',
        question: inserted,
        ai_used: !!mimoKey && questionText !== null,
        date: today,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
