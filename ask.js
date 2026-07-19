// api/ask.js
// Vercel serverless function — foydalanuvchi savolini BEPUL Google Gemini API
// orqali javoblaydi. API kalit shu faylda emas, Vercel'ning
// "Environment Variables" bo'limida saqlanadi.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so\'rovlar qabul qilinadi' });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Savol matni kerak' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server sozlanmagan: GEMINI_API_KEY yo\'q' });
  }

  const systemInstruction = "Sen \"Musiqashunos\" ilovasining AI yordamchisisan. Foydalanuvchilarga musiqa nazariyasi, musiqa adabiyoti (o'zbek va jahon), bastakorlar, cholg'u asboblari, maqom va milliy musiqa haqidagi savollariga o'zbek tilida aniq, qisqa va tushunarli javob ber. Agar savol musiqadan uzoq mavzuda bo'lsa, muloyimlik bilan mavzuga qaytar.";

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: message.trim().slice(0, 2000) }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(500).json({ error: 'AI xizmatida xatolik yuz berdi' });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Javob topilmadi, qaytadan urinib ko\'ring.';

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server xatoligi yuz berdi' });
  }
}
