class ActionManager {
    constructor(editor, aiService) {
        this.editor = editor;
        this.aiService = aiService;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupActionButtons();
        this.setupCustomPrompt();
        this.setupResponseActions();
        this.setupKeyboardShortcuts();
    }

    setupActionButtons() {
        const actionButtons = document.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                await this.handleAction(action);
            });
        });
    }

    setupCustomPrompt() {
        const customPromptBtn = document.getElementById('custom-prompt-btn');
        const promptInput = document.getElementById('prompt-input');
        
        if (customPromptBtn && promptInput) {
            customPromptBtn.addEventListener('click', async () => {
                const prompt = promptInput.value.trim();
                if (prompt) {
                    await this.handleCustomPrompt(prompt);
                } else {
                    this.showError('Please enter a custom prompt');
                }
            });

            // Handle Enter key in prompt input (Ctrl+Enter to send)
            promptInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    customPromptBtn.click();
                }
            });
        }
    }

    setupResponseActions() {
        const copyBtn = document.getElementById('copy-response');
        const clearBtn = document.getElementById('clear-response');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyResponse();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearResponse();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + E: Explain
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
                e.preventDefault();
                this.handleAction('explain');
            }
            
            // Ctrl/Cmd + Shift + D: Debug
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.handleAction('debug');
            }
            
            // Ctrl/Cmd + G: Generate
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                this.handleAction('generate');
            }
            
            // Ctrl/Cmd + O: Optimize
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.handleAction('optimize');
            }
        });
    }

    async handleAction(action) {
        if (this.isLoading) return;
        
        if (!this.aiService.isReady()) {
            // Show the API key banner and focus input so user can save a key quickly
            const apiKeyBanner = document.getElementById('api-key-banner');
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyBanner) apiKeyBanner.classList.remove('hidden');
            if (apiKeyInput) {
                apiKeyInput.classList.add('highlight');
                apiKeyInput.focus();
                // Scroll to top to ensure banner/input is visible
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            this.showError('AI service not ready. Please set your API key.');
            return;
        }

        try {
            this.setLoading(true);
            const code = this.editor.getSelectedText();
            const language = this.editor.currentLanguage;
            
            let response;
            
            switch (action) {
                case 'explain':
                    response = await this.aiService.explainCode(code, language);
                    break;
                case 'debug':
                    response = await this.aiService.debugCode(code, language);
                    break;
                case 'generate':
                    response = await this.handleGenerateAction(code, language);
                    break;
                case 'optimize':
                    response = await this.aiService.optimizeCode(code, language);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
            
            this.displayResponse(response);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async handleGenerateAction(code, language) {
        // For generate action, if there's selected text, treat it as a prompt
        // Otherwise, show a dialog to get the generation prompt
        if (code.trim() && !this.looksLikeCode(code)) {
            return await this.aiService.generateCode(code, language);
        } else {
            const prompt = await this.showGenerateDialog();
            if (prompt) {
                return await this.aiService.generateCode(prompt, language);
            }
            return null;
        }
    }

    looksLikeCode(text) {
        // Simple heuristic to determine if text looks like code
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /class\s+\w+/,
            /def\s+\w+\s*\(/,
            /import\s+\w+/,
            /#include\s*<\w+>/,
            /var\s+\w+\s*=/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /if\s*\(/,
            /for\s*\(/,
            /while\s*\(/,
            /{\s*}/,
            /\(\s*\)/
        ];
        
        return codePatterns.some(pattern => pattern.test(text));
    }

    async showGenerateDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'generate-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Generate Code</h3>
                    <p>Describe what you want to generate:</p>
                    <textarea id="generate-prompt" placeholder="e.g., Create a function that sorts an array of numbers..." rows="4"></textarea>
                    <div class="modal-buttons">
                        <button id="generate-confirm" class="btn btn-primary">Generate</button>
                        <button id="generate-cancel" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            // Add modal styles if not already added
            if (!document.querySelector('#generate-modal-styles')) {
                const style = document.createElement('style');
                style.id = 'generate-modal-styles';
                style.textContent = `
                    .generate-modal {
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
                    
                    .generate-modal .modal-content {
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        max-width: 500px;
                        width: 90%;
                        text-align: center;
                    }
                    
                    .generate-modal h3 {
                        margin-bottom: 15px;
                        color: #333;
                    }
                    
                    .generate-modal p {
                        margin-bottom: 20px;
                        color: #666;
                    }
                    
                    #generate-prompt {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        resize: vertical;
                        min-height: 80px;
                    }
                    
                    .modal-buttons {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(modal);
            
            const promptInput = document.getElementById('generate-prompt');
            const confirmBtn = document.getElementById('generate-confirm');
            const cancelBtn = document.getElementById('generate-cancel');
            
            const handleConfirm = () => {
                const prompt = promptInput.value.trim();
                document.body.removeChild(modal);
                resolve(prompt || null);
            };
            
            const handleCancel = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            
            // Handle Enter key (Ctrl+Enter to confirm)
            promptInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    handleConfirm();
                }
            });
            
            // Focus on input
            promptInput.focus();
        });
    }

    async handleCustomPrompt(prompt) {
        if (this.isLoading) return;
        
        if (!this.aiService.isReady()) {
            this.showError('AI service not ready. Please set your API key.');
            return;
        }

        try {
            this.setLoading(true);
            const code = this.editor.getSelectedText();
            const language = this.editor.currentLanguage;
            
            const response = await this.aiService.customPrompt(prompt, code, language);
            this.displayResponse(response);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    displayResponse(response) {
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            const formattedResponse = this.aiService.formatResponse(response);
            responseContainer.innerHTML = formattedResponse;
            
            // Syntax highlight code blocks with Prism (VS Code-like colors)
            responseContainer.querySelectorAll('.ai-code-content code[class^="language-"]').forEach(el => {
                if (typeof Prism !== 'undefined') {
                    Prism.highlightElement(el);
                }
            });
            
            // Attach copy handlers to code block copy buttons
            responseContainer.querySelectorAll('.ai-code-copy').forEach(btn => {
                btn.addEventListener('click', () => {
                    const codeEl = btn.closest('.ai-code-block')?.querySelector('.ai-code-content code');
                    if (codeEl) {
                        const text = codeEl.textContent;
                        navigator.clipboard.writeText(text).then(() => {
                            btn.textContent = '✓ Copied!';
                            setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
                            this.showToast('Code copied to clipboard!');
                        }).catch(() => {
                            const textArea = document.createElement('textarea');
                            textArea.value = text;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            btn.textContent = '✓ Copied!';
                            setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
                            this.showToast('Code copied to clipboard!');
                        });
                    }
                });
            });
            
            responseContainer.scrollTop = 0;
        }
    }

    showError(message) {
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            responseContainer.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const loadingOverlay = document.getElementById('loading-overlay');
        const actionButtons = document.querySelectorAll('[data-action]');
        const customPromptBtn = document.getElementById('custom-prompt-btn');
        
        if (loading) {
            loadingOverlay?.classList.remove('hidden');
            actionButtons.forEach(btn => btn.disabled = true);
            if (customPromptBtn) customPromptBtn.disabled = true;
        } else {
            loadingOverlay?.classList.add('hidden');
            actionButtons.forEach(btn => btn.disabled = false);
            if (customPromptBtn) customPromptBtn.disabled = false;
        }
    }

    copyResponse() {
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            const text = responseContainer.textContent || responseContainer.innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Response copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast('Response copied to clipboard!');
            });
        }
    }

    clearResponse() {
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            responseContainer.innerHTML = '<div class="placeholder-text">AI responses will appear here...</div>';
        }
    }

    showToast(message) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // Add toast styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
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
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Add error message styling
    addErrorStyles() {
        if (!document.querySelector('#error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .error-message {
                    color: #dc3545;
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    padding: 12px;
                    border-radius: 4px;
                    margin: 10px 0;
                }
                
                .dark-theme .error-message {
                    background-color: #721c24;
                    border-color: #842029;
                    color: #f8d7da;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Export for use in other modules
window.ActionManager = ActionManager;
