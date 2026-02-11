class AIServiceGemini {
    constructor() {
        this.apiKey = ""; // No longer used when backend is active
        this.backendURL = "http://localhost:5001/api/ai";
    }

    async makeRequest(endpoint, payload) {
        let response;
        try {
            response = await fetch(`${this.backendURL}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            if (err.message === "Failed to fetch" || err.name === "TypeError") {
                throw new Error("Cannot connect to backend. Run start.bat or: cd backend && npm start (then npm start for frontend)");
            }
            throw err;
        }

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error(`Backend returned invalid response (${response.status}). Is the server running?`);
        }

        if (!response.ok) {
            const errorMsg = data.error || `Backend error (${response.status})`;
            throw new Error(errorMsg);
        }

        return data.result || "";
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
        // Backend mode: always ready (API key is on server)
        return true;
    }
}

window.AIService = AIServiceGemini;
