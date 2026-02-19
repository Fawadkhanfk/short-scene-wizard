import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url, title, duration } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    const prompt = `You are a viral content expert. Analyze this YouTube video:
Title: "${title}"
Duration: ${duration} seconds

Suggest 4 short clip highlights (15–60 seconds each) that would perform best as TikTok/Reels/Shorts. 
For each highlight, provide startTime (seconds), endTime (seconds), a catchy title, why it's engaging, and a confidence score (0–1).

Respond ONLY with valid JSON array: [{"startTime":0,"endTime":30,"title":"...","reason":"...","score":0.95}]`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const highlights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Clamp to video duration
    const clamped = highlights.map((h: { startTime: number; endTime: number; title: string; reason: string; score: number }) => ({
      ...h,
      startTime: Math.max(0, Math.min(h.startTime, duration - 15)),
      endTime: Math.max(15, Math.min(h.endTime, duration)),
    }));

    return new Response(JSON.stringify({ highlights: clamped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, highlights: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
