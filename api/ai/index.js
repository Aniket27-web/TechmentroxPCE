// Serverless API to proxy requests to Google Gemini using a server-side API key
// Deploy this folder to Vercel and set the environment variable `GEMINI_API_KEY`.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { endpoint, payload } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server not configured with GEMINI_API_KEY' });
    }

    // Build prompt based on endpoint (same logic as client-side service)
    let prompt = '';
    try {
        switch (endpoint) {
            case 'explain':
                prompt = `Explain the following ${payload.language} code:\n\n${payload.code}`;
                break;
            case 'debug':
                prompt = `Find bugs in this ${payload.language} code and suggest fixes:\n\n${payload.code}`;
                break;
            case 'generate':
                prompt = `Generate ${payload.language} code for the following request:\n\n${payload.prompt}`;
                break;
            case 'optimize':
                prompt = `Optimize the following ${payload.language} code:\n\n${payload.code}`;
                break;
            case 'custom':
                prompt = payload.code ? `${payload.prompt}\n\nRelevant code (${payload.language}):\n${payload.code}` : payload.prompt;
                break;
            default:
                return res.status(400).json({ error: 'Unknown endpoint' });
        }

        const body = JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
            const msg = data?.error?.message || `Gemini API error (${resp.status})`;
            return res.status(502).json({ error: msg });
        }

        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ result });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Server error' });
    }
}
