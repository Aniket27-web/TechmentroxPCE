class AIService {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.openai.com/v1';
        this.model = 'gpt-3.5-turbo';
        this.maxTokens = 2000;
        this.temperature = 0.7;
        this.init();
    }

    init() {
        // Try to load API key from localStorage
        this.apiKey = localStorage.getItem('ai-api-key');
        
        // For debugging - you can uncomment this line to test with your API key
        // this.apiKey = 'your-openai-api-key-here';
        
        if (!this.apiKey) {
            this.showApiKeyDialog();
        }
    }

    showApiKeyDialog() {
        const modal = document.createElement('div');
        modal.className = 'api-key-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Enter Your OpenAI API Key</h3>
                <p>To use AI features, please enter your OpenAI API key.</p>
                <input type="password" id="api-key-input" placeholder="sk-..." />
                <div class="modal-buttons">
                    <button id="save-api-key" class="btn btn-primary">Save</button>
                    <button id="skip-api-key" class="btn btn-secondary">Skip</button>
                </div>
                <p class="api-key-info">
                    Your API key will be stored locally in your browser only.
                    <a href="https://platform.openai.com/api-keys" target="_blank">Get your API key here</a>
                </p>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .api-key-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                max-width: 400px;
                width: 90%;
                text-align: center;
            }
            
            .modal-content h3 {
                margin-bottom: 15px;
                color: #333;
            }
            
            .modal-content p {
                margin-bottom: 20px;
                color: #666;
            }
            
            #api-key-input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-bottom: 15px;
            }
            
            .api-key-info {
                font-size: 12px;
                color: #888;
            }
            
            .api-key-info a {
                color: #007acc;
                text-decoration: none;
            }
            
            .api-key-info a:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Handle modal events
        document.getElementById('save-api-key').addEventListener('click', () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (apiKey) {
                this.setApiKey(apiKey);
                document.body.removeChild(modal);
                document.head.removeChild(style);
            } else {
                alert('Please enter a valid API key');
            }
        });

        document.getElementById('skip-api-key').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        // Handle Enter key in input
        document.getElementById('api-key-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('save-api-key').click();
            }
        });
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('ai-api-key', apiKey);
    }

    async makeRequest(prompt, code = '', language = '') {
        if (!this.apiKey) {
            throw new Error('API key not set. Please set your OpenAI API key.');
        }

        const fullPrompt = this.buildPrompt(prompt, code, language);
        console.log('Making API request with prompt:', fullPrompt.substring(0, 100) + '...');

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI coding assistant. Provide clear, concise, and accurate coding help. When providing code examples, use proper formatting and explain your reasoning.'
                        },
                        {
                            role: 'user',
                            content: fullPrompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            console.log('API Response Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: { message: errorText } };
                }
                
                throw new Error(`API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response Data:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('AI Service Error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to OpenAI API. Check your internet connection.');
            }
            
            throw error;
        }
    }

    buildPrompt(action, code, language) {
        const prompts = {
            explain: `Please explain the following ${language} code in detail. Explain what each part does, the overall purpose, and any important concepts or patterns used:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            
            debug: `Please analyze the following ${language} code for bugs, errors, or potential issues. Identify any problems and suggest fixes:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            
            generate: `Generate ${language} code based on this request:\n\n${code}\n\nPlease provide complete, working code with proper formatting and comments where necessary.`,
            
            optimize: `Please optimize the following ${language} code for better performance, readability, and best practices. Suggest improvements and provide the optimized version:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            
            custom: `${code}`
        };

        return prompts[action] || prompts.custom;
    }

    async explainCode(code, language) {
        try {
            return await this.makeRequest('explain', code, language);
        } catch (error) {
            throw new Error(`Failed to explain code: ${error.message}`);
        }
    }

    async debugCode(code, language) {
        try {
            return await this.makeRequest('debug', code, language);
        } catch (error) {
            throw new Error(`Failed to debug code: ${error.message}`);
        }
    }

    async generateCode(prompt, language) {
        try {
            return await this.makeRequest('generate', prompt, language);
        } catch (error) {
            throw new Error(`Failed to generate code: ${error.message}`);
        }
    }

    async optimizeCode(code, language) {
        try {
            return await this.makeRequest('optimize', code, language);
        } catch (error) {
            throw new Error(`Failed to optimize code: ${error.message}`);
        }
    }

    async customPrompt(prompt, code, language) {
        try {
            const fullPrompt = code ? `${prompt}\n\nCode context:\n\`\`\`${language}\n${code}\n\`\`\`` : prompt;
            return await this.makeRequest('custom', fullPrompt, language);
        } catch (error) {
            throw new Error(`Failed to process custom prompt: ${error.message}`);
        }
    }

    updateSettings(settings) {
        if (settings.model) this.model = settings.model;
        if (settings.maxTokens) this.maxTokens = settings.maxTokens;
        if (settings.temperature) this.temperature = settings.temperature;
        if (settings.baseURL) this.baseURL = settings.baseURL;
    }

    getSettings() {
        return {
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            baseURL: this.baseURL,
            hasApiKey: !!this.apiKey
        };
    }

    clearApiKey() {
        this.apiKey = null;
        localStorage.removeItem('ai-api-key');
    }

    // Helper method to format AI responses
    formatResponse(response) {
        // Code block formatting
        response = response.replace(/```(\w+)?\n/g, '<pre><code class="language-$1">');
        response = response.replace(/```/g, '</code></pre>');
        
        // Bold text
        response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Line breaks
        response = response.replace(/\n\n/g, '</p><p>');
        response = response.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        if (!response.startsWith('<p>')) {
            response = '<p>' + response + '</p>';
        }
        
        return response;
    }

    // Method to check if service is ready
    isReady() {
        return !!this.apiKey;
    }
}

// Export for use in other modules
window.AIService = AIService;
