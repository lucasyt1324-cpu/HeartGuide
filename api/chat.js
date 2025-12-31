// api/chat.js - Vercel Serverless Function for Groq AI
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  try {
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and powerful model
        messages: [
          {
            role: 'system',
            content: 'You are HeartGuide, a compassionate and understanding relationship advice assistant. You provide thoughtful, empathetic guidance on relationships, dating, and love. You ask clarifying questions to better understand situations and give personalized advice. Keep responses warm, supportive, and conversational.'
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.status(200).json({ response: data.choices[0].message.content });
    } else {
      throw new Error('Invalid response from Groq API');
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
}
