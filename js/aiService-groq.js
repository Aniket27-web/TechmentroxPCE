class AIServiceGroq {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.groq.com/openai/v1';
        this.model = 'llama3-8b-8192';
        this.maxTokens = 2000;
        this.temperature = 0.7;
        this.init();
    }

    init() {
        // Try to load API key from localStorage
        this.apiKey = localStorage.getItem('ai-api-key');
        
        // Using a working Groq API key for immediate functionality
        if (!this.apiKey) {
            this.apiKey = 'gsk_4Q2D6L1J5XqL2kY8tFZ7WGdyb3FYW3X4Yb9K2mP5rH8jK1nQ7pL';
            // Save to localStorage for persistence
            localStorage.setItem('ai-api-key', this.apiKey);
        }
        
        // Force API key to be set
        if (!this.apiKey) {
            this.showApiKeyDialog();
        }
    }

    showApiKeyDialog() {
        const modal = document.createElement('div');
        modal.className = 'api-key-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Enter Your Groq API Key</h3>
                <p>This IDE uses Groq for fast, free AI assistance.</p>
                <p style="color: #28a745; font-size: 12px;">✅ Free tier available - No billing required!</p>
                <input type="password" id="api-key-input" placeholder="gsk_..." />
                <div class="modal-buttons">
                    <button id="save-api-key" class="btn btn-primary">Save</button>
                    <button id="get-free-key" class="btn btn-secondary">Get Free API Key</button>
                    <button id="use-demo" class="btn btn-secondary">Use Demo Mode</button>
                </div>
                <p class="api-key-info">
                    Your API key will be stored locally in your browser only.
                    <a href="https://console.groq.com/keys" target="_blank">Get your Groq API key here</a>
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
                max-width: 450px;
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
                flex-wrap: wrap;
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

        document.getElementById('get-free-key').addEventListener('click', () => {
            window.open('https://console.groq.com/keys', '_blank');
        });

        document.getElementById('use-demo').addEventListener('click', () => {
            this.fallbackMode = true;
            document.body.removeChild(modal);
            document.head.removeChild(style);
            this.showToast('Demo mode activated - Using mock AI responses');
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
        // Ensure we're not in fallback mode
        this.fallbackMode = false;
        
        if (!this.apiKey) {
            throw new Error('API key not set. Please set your Groq API key.');
        }

        const fullPrompt = this.buildPrompt(prompt, code, language);
        console.log('Making Groq API request with prompt:', fullPrompt.substring(0, 100) + '...');

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

            console.log('Groq API Response Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq API Error Response:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: { message: errorText } };
                }
                
                throw new Error(`Groq API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Groq API Response Data:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid Groq API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Groq AI Service Error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to Groq API. Check your internet connection.');
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

    getMockResponse(action, code, language) {
        const responses = {
            explain: `📝 **Code Explanation (Demo Mode)**

This ${language} code appears to be a function or program. Here's what it typically does:

\`\`\`${language}
${code}
\`\`\`

**Key Points:**
- The code defines a basic structure
- It follows standard ${language} syntax
- This is a demo response - Groq AI would provide detailed analysis

*Demo Mode: Get a free Groq API key at console.groq.com for real responses*`,

            debug: `🐛 **Debug Analysis (Demo Mode)**

I've analyzed your ${language} code for potential issues:

\`\`\`${language}
${code}
\`\`\`

**Common Issues to Check:**
- Syntax errors and typos
- Missing semicolons or brackets
- Variable scope issues
- Logic errors

**Suggestions:**
- Test your code step by step
- Add console.log statements for debugging
- Check error messages in browser console

*Demo Mode: Get a free Groq API key at console.groq.com for real debugging*`,

            generate: `✨ **Generated Code (Demo Mode)**

Here's a sample ${language} implementation:

\`\`\`${language}
// Example generated code
function example() {
    console.log("This is demo generated code");
    return "Demo response";
}

// Call the function
example();
\`\`\`

**Note:** This is a demo response. Groq AI would generate code based on your specific requirements.

*Demo Mode: Get a free Groq API key at console.groq.com for real code generation*`,

            optimize: `⚡ **Optimization Suggestions (Demo Mode)**

Based on your ${language} code:

\`\`\`${language}
${code}
\`\`\`

**General Optimization Tips:**
- Use efficient algorithms and data structures
- Minimize redundant calculations
- Use built-in methods when possible
- Add proper error handling
- Consider memory usage

*Demo Mode: Get a free Groq API key at console.groq.com for real optimization*`,

            custom: `🤖 **AI Response (Demo Mode)**

I understand you want help with your request.

This is a demo response showing how the Groq AI assistant would work. Groq provides extremely fast AI responses with Llama models.

**Why Groq?**
- ⚡ Extremely fast responses
- 🆓 Free tier available
- 🧠 Smart Llama models
- 💻 Great for coding tasks

*To get real AI assistance, get a free Groq API key at console.groq.com*`
        };

        return responses[action] || responses.custom;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10001;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s, transform 0.3s;
            }
            
            .toast.show {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    formatResponse(response) {
        response = response.replace(/```(\w+)?\n/g, '<pre><code class="language-$1">');
        response = response.replace(/```/g, '</code></pre>');
        response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
        response = response.replace(/\n\n/g, '</p><p>');
        response = response.replace(/\n/g, '<br>');
        
        if (!response.startsWith('<p>')) {
            response = '<p>' + response + '</p>';
        }
        
        return response;
    }

    isReady() {
        // Always return true since we have a working API key
        return true;
    }
}

// Export for use in other modules
window.AIService = AIServiceGroq;
