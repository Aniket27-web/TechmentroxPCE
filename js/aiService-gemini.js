// Default API key to use when no runtime prompt is desired.
// Replace the empty string below with your default key or put it into localStorage under 'gemini-api-key'.
const DEFAULT_GEMINI_API_KEY = '';

class AIServiceGemini {
    constructor() {
        this.apiKey = "";
        // Use local express backend when running on localhost, otherwise use relative serverless path
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            this.backendURL = "http://localhost:5001/api/ai";
        } else {
            this.backendURL = "/api/ai"; // use relative path for Vercel serverless functions
        }
        // Priority: explicit default in code -> localStorage -> empty
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('gemini-api-key');
            this.apiKey = DEFAULT_GEMINI_API_KEY || (stored || '');
            // persist default into localStorage for consistency (if a default is set)
            if (DEFAULT_GEMINI_API_KEY && (!stored || stored !== DEFAULT_GEMINI_API_KEY)) {
                try { localStorage.setItem('gemini-api-key', DEFAULT_GEMINI_API_KEY); } catch (e) {}
            }
        } else {
            this.apiKey = DEFAULT_GEMINI_API_KEY || '';
        }
    }

    async makeRequest(endpoint, payload) {
        // Prefer server-side proxy if available (avoids exposing API keys client-side)
        if (this.backendURL) {
            try {
                const resp = await fetch(this.backendURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint, payload })
                });

                const data = await resp.json().catch(() => null);
                if (!resp.ok) {
                    const msg = data?.error || `Backend error (${resp.status})`;
                    throw new Error(msg);
                }
                return data?.result || '';
            } catch (err) {
                if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                    throw new Error('Network error when contacting backend AI proxy.');
                }
                throw err;
            }
        }

        // Fallback: if no backend URL, attempt direct client-side call (uses DEFAULT_GEMINI_API_KEY or localStorage)
        const key = DEFAULT_GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini-api-key') : null);
        if (!key) {
            throw new Error('No Gemini API key configured. Deploy server with `GEMINI_API_KEY` or set `DEFAULT_GEMINI_API_KEY`.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

        // Build the prompt depending on endpoint
        let prompt = '';
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
                throw new Error('Unknown AI endpoint');
        }

        const body = JSON.stringify({
            contents: [ { role: 'user', parts: [{ text: prompt }] } ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        });

        let resp;
        try {
            resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        } catch (err) {
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                throw new Error('Network error when contacting Gemini API. Check your network and CORS policy.');
            }
            throw err;
        }

        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
            const msg = data?.error?.message || `Gemini API error (${resp.status})`;
            throw new Error(msg);
        }

        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return result;
    }

    explainCode(code, language) {
        return this.makeRequest("explain", { code, language });
    }

    debugCode(code, language) {
        return this.makeRequest("debug", { code, language });
    }

    generateCode(prompt, language) {
        return this.makeRequest("generate", { prompt, language });
    }

    optimizeCode(code, language) {
        return this.makeRequest("optimize", { code, language });
    }

    customPrompt(prompt, code, language) {
        return this.makeRequest("custom", { prompt, code, language });
    }

    normalizePrismLang(lang) {
        const map = { js: "javascript", py: "python", html: "markup", xml: "markup", sh: "bash" };
        return map[lang.toLowerCase()] || lang.toLowerCase();
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    formatResponse(response) {
        if (!response || typeof response !== "string") return "<em>No response</em>";
        const parts = [];
        let lastIndex = 0;
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(response)) !== null) {
            const beforeCode = response.slice(lastIndex, match.index);
            if (beforeCode) {
                parts.push(`<div class="ai-response-text">${this.escapeHtml(beforeCode).replace(/\n/g, "<br>")}</div>`);
            }
            const lang = this.normalizePrismLang(match[1] || "text");
            const code = match[2].trim();
            const codeEscaped = this.escapeHtml(code);
            parts.push(`
                <div class="ai-code-block">
                    <div class="ai-code-header">
                        <span class="ai-code-lang">${this.escapeHtml(match[1] || "text")}</span>
                        <button class="ai-code-copy" type="button" title="Copy code">📋 Copy</button>
                    </div>
                    <pre class="ai-code-content"><code class="language-${lang}">${codeEscaped}</code></pre>
                </div>
            `);
            lastIndex = match.index + match[0].length;
        }
        const remaining = response.slice(lastIndex);
        if (remaining) {
            parts.push(`<div class="ai-response-text">${this.escapeHtml(remaining).replace(/\n/g, "<br>")}</div>`);
        }
        return parts.length ? parts.join("") : `<div class="ai-response-text">${this.escapeHtml(response).replace(/\n/g, "<br>")}</div>`;
    }

    isReady() {
        // If a backend is configured (localhost or serverless path), assume server will provide the key.
        if (this.backendURL && (this.backendURL.includes('localhost') || this.backendURL.startsWith('/api/ai'))) {
            return true;
        }

        // Otherwise require a client-side API key to be present.
        const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gemini-api-key') : null);
        return !!(key && key.trim());
    }
}

window.AIService = AIServiceGemini;
