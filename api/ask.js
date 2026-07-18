// api/ask.js
// Vercel serverless function — foydalanuvchi savolini xavfsiz tarzda
// Claude API'ga yuboradi. API kalit shu faylda emas, Vercel'ning
// "Environment Variables" bo'limida saqlanadi — shuning uchun xavfsiz.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so\'rovlar qabul qilinadi' });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Savol matni kerak' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server sozlanmagan: ANTHROPIC_API_KEY yo\'q' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // tez va arzon model; sifat kerak bo'lsa 'claude-sonnet-5' ga almashtiring
        max_tokens: 800,
        system: "Sen \"Musiqashunos\" ilovasining AI yordamchisisan. Foydalanuvchilarga musiqa nazariyasi, musiqa adabiyoti (o'zbek va jahon), bastakorlar, cholg'u asboblari, maqom va milliy musiqa haqidagi savollariga o'zbek tilida aniq, qisqa va tushunarli javob ber. Agar savol musiqadan uzoq mavzuda bo'lsa, muloyimlik bilan mavzuga qaytar.",
        messages: [{ role: 'user', content: message.trim().slice(0, 2000) }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: 'AI xizmatida xatolik yuz berdi' });
    }

    const answer = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n') || 'Javob topilmadi, qaytadan urinib ko\'ring.';

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server xatoligi yuz berdi' });
  }
}
