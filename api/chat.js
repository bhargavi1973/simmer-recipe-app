module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Server is missing GROQ_API_KEY. Add it in your Vercel project under Settings → Environment Variables, then redeploy.'
    });
    return;
  }

  try {
    const { model, system, messages, maxTokens, jsonMode } = req.body || {};

    if (!model || !messages) {
      res.status(400).json({ error: 'Request body must include "model" and "messages".' });
      return;
    }

    const fullMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;

    const payload = {
      model,
      messages: fullMessages,
      max_tokens: maxTokens || 1024
    };
    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }
    // gpt-oss models spend tokens on internal reasoning before writing the
    // final answer; keep that light so the JSON output doesn't get truncated.
    if (model.startsWith('openai/gpt-oss')) {
      payload.reasoning_effort = 'low';
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      res.status(groqRes.status).json({
        error: (data && data.error && data.error.message) || 'Groq API request failed.'
      });
      return;
    }

    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || 'Unexpected server error.' });
  }
};
