// api/chat.js for Groq
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // Fast and smart
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    res.status(200).json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
}