// Gemini API çağrılarını client'tan gizlemek için proxy.
// GEMINI_API_KEY burada, sunucu tarafında (Supabase secret) tutulur — hiçbir zaman
// uygulama paketine (APK/IPA) gömülmez.
//
// Deploy: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=xxxxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_MODEL = 'gemini-1.5-flash';

const SYSTEM_PROMPT = `
Sen "ŞanlıAsistan" adında yardımcı bir yapay zekasın.
GÖREVLERİN:
1. Sadece Şanlıurfa şehri, otobüs saatleri, öğrenci indirimleri ve yerel etkinlikler hakkında bilgi vermek.
2. Kullanıcı bu konuların DIŞINDA bir şey sorarsa (örneğin: matematik sorusu, yemek tarifi, siyaset, dünya gündemi vb.) kibarca "Ben sadece Şanlıurfa ve ulaşım konularında yardımcı olabilirim." diyerek reddetmek.
3. Cevapların her zaman kısa, net ve samimi olsun.
4. Asla kod yazma veya teknik konularda destek verme.
`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Sunucu yapılandırma hatası.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text }] }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      const status = data.error.code === 429 ? 429 : 502;
      return new Response(JSON.stringify({ error: data.error.message || 'Gemini API hatası.' }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return new Response(JSON.stringify({ error: 'Cevap alınamadı.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'İnternet bağlantısında sorun var.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
