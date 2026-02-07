// aiService.js
// =============================
// Simple AI Service (No Popup)
// API Key is hardcoded by default
// =============================

class AIService {
    constructor() {
        // 🔴 ADD YOUR API KEY HERE
        this.apiKey = "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";

        // OpenAI config
        this.baseURL = "https://api.openai.com/v1/chat/completions";
        this.model = "gpt-4o-mini";
        this.maxTokens = 2000;
        this.temperature = 0.7;
    }

    async makeRequest(prompt) {
        if (!this.apiKey || this.apiKey === "PASTE_YOUR_API_KEY_HERE") {
            throw new Error("OpenAI API key is missing in aiService.js");
        }

        const response = await fetch(this.baseURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful AI coding assistant. Provide clear, concise, and accurate answers."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI API error");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // -------- Feature Helpers --------

    explainCode(code, language) {
        return this.makeRequest(
            `Explain the following ${language} code clearly:\n\n${code}`
        );
    }

    debugCode(code, language) {
        return this.makeRequest(
            `Find bugs and fix the following ${language} code:\n\n${code}`
        );
    }

    optimizeCode(code, language) {
        return this.makeRequest(
            `Optimize the following ${language} code for performance and readability:\n\n${code}`
        );
    }

    generateCode(prompt, language) {
        return this.makeRequest(
            `Generate ${language} code for the following request:\n\n${prompt}`
        );
    }
}

// Make globally available
window.AIService = AIService;
