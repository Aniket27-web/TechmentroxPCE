class App {
    constructor() {
        this.editor = null;
        this.aiService = null;
        this.actionManager = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            this.showLoadingState('Initializing AI-Powered IDE...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components
            await this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup theme
            this.setupTheme();
            
            // Hide loading state
            this.hideLoadingState();
            
            this.isInitialized = true;
            
        } catch (error) {
            this.showError('Failed to initialize the IDE. Please refresh the page.');
        }
    }

    async initializeComponents() {
        // Initialize Monaco Editor
        this.showLoadingState('Loading code editor...');
        this.editor = new EditorManager();
        
        // Wait for editor to be ready
        await this.waitForEditor();
        
        // Initialize AI Service
        this.showLoadingState('Initializing AI service...');
        this.aiService = new AIServiceGemini();
        
        // Initialize Terminal
        this.showLoadingState('Setting up terminal...');
        this.terminal = new Terminal();
        
        // Initialize Simple Executor
        this.showLoadingState('Setting up code execution...');
        this.simpleExecutor = new SimpleExecutor(this.editor, this.terminal);
        
        // Initialize Action Manager
        this.actionManager = new ActionManager(this.editor, this.aiService);
        
        // Add error styles
        this.actionManager.addErrorStyles();
    }

    waitForEditor() {
        return new Promise((resolve) => {
            const checkEditor = () => {
                if (this.editor && this.editor.editor) {
                    resolve();
                } else {
                    setTimeout(checkEditor, 100);
                }
            };
            checkEditor();
        });
    }

    setupGlobalEventListeners() {
        // API Key handling
        const apiKeyInput = document.getElementById('api-key-input');
        const saveApiKeyBtn = document.getElementById('save-api-key');
        const apiKeyBanner = document.getElementById('api-key-banner');
        const bannerEnterBtn = document.getElementById('banner-enter-btn');
        const bannerDismiss = document.getElementById('banner-dismiss');
        if (apiKeyInput && saveApiKeyBtn) {
            // Load saved API key (ignore old invalid placeholder)
            const savedKey = localStorage.getItem('gemini-api-key');
            const invalidPlaceholder = "AIzaSyCXUIL_Z4gZG-5f-4ahki499vzNBboGPvA";
            if (savedKey && savedKey !== invalidPlaceholder) {
                apiKeyInput.value = savedKey;
            }

            // Show banner/prompt if no API key saved and banner not dismissed
            const dismissed = localStorage.getItem('api-key-banner-dismissed');
            if (!savedKey && !dismissed && apiKeyBanner) {
                apiKeyBanner.classList.remove('hidden');
                apiKeyInput.classList.add('highlight');
            }

            saveApiKeyBtn.addEventListener('click', () => {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    localStorage.setItem('gemini-api-key', apiKey);
                    if (this.aiService) {
                        this.aiService.apiKey = apiKey;
                    }
                    this.showToast('API Key saved successfully!');
                    // hide banner and remove highlight
                    if (apiKeyBanner) {
                        apiKeyBanner.classList.add('hidden');
                    }
                    apiKeyInput.classList.remove('highlight');
                } else {
                    this.showToast('Please enter a valid API key.');
                }
            });

            if (bannerEnterBtn) {
                bannerEnterBtn.addEventListener('click', () => {
                    apiKeyInput.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            if (bannerDismiss) {
                bannerDismiss.addEventListener('click', () => {
                    if (apiKeyBanner) apiKeyBanner.classList.add('hidden');
                    apiKeyInput.classList.remove('highlight');
                    localStorage.setItem('api-key-banner-dismissed', '1');
                });
            }
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            if (this.editor && this.editor.editor) {
                this.editor.editor.layout();
            }
        });

        // Before unload - warn if there are unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Keyboard shortcuts help
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + ? for help
            if ((e.ctrlKey || e.metaKey) && e.key === '?') {
                e.preventDefault();
                this.showHelpDialog();
            }
            
            // Ctrl/Cmd + Enter for code execution
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.simpleExecutor) {
                    this.simpleExecutor.executeCode();
                }
            }
        });
    }

    setupTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('ide-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.enableDarkTheme();
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('ide-theme')) {
                if (e.matches) {
                    this.enableDarkTheme();
                } else {
                    this.enableLightTheme();
                }
            }
        });
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        const themeToggle = document.getElementById('theme-toggle');
        
        if (isDark) {
            this.enableDarkTheme();
        } else {
            this.enableLightTheme();
        }
        
        // Save preference
        localStorage.setItem('ide-theme', isDark ? 'dark' : 'light');
    }

    enableDarkTheme() {
        document.body.classList.add('dark-theme');
        if (this.editor) {
            this.editor.toggleTheme();
        }
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = '☀️';
        }
    }

    enableLightTheme() {
        document.body.classList.remove('dark-theme');
        if (this.editor) {
            this.editor.toggleTheme();
        }
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = '🌙';
        }
    }

    hasUnsavedChanges() {
        // This is a simple implementation - you could enhance this with actual change tracking
        if (this.editor) {
            const currentContent = this.editor.getValue();
            const defaultContent = this.editor.getDefaultCode();
            return currentContent !== defaultContent;
        }
        return false;
    }

    showHelpDialog() {
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>E</kbd>
                        <span>Explain code</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>
                        <span>Debug code</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>G</kbd>
                        <span>Generate code</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>O</kbd>
                        <span>Optimize code</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                        <span>Execute code</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>?</kbd>
                        <span>Show this help</span>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="help-close" class="btn btn-primary">Got it!</button>
                </div>
            </div>
        `;

        // Add help modal styles
        if (!document.querySelector('#help-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'help-modal-styles';
            style.textContent = `
                .help-modal {
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
                
                .help-modal .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                }
                
                .dark-theme .help-modal .modal-content {
                    background: var(--dark-surface);
                    color: var(--text-light);
                }
                
                .shortcuts-list {
                    margin: 20px 0;
                    text-align: left;
                }
                
                .shortcut-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .dark-theme .shortcut-item {
                    border-bottom-color: var(--dark-border);
                }
                
                kbd {
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    padding: 2px 6px;
                    font-family: monospace;
                    font-size: 12px;
                    margin: 0 2px;
                }
                
                .dark-theme kbd {
                    background: var(--dark-bg);
                    border-color: var(--dark-border);
                    color: var(--text-light);
                }
                
                .modal-buttons {
                    margin-top: 20px;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(modal);
        
        document.getElementById('help-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showLoadingState(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast { position: fixed; bottom: 20px; right: 20px; background: #333; color: white;
                    padding: 12px 20px; border-radius: 4px; z-index: 10001; opacity: 0;
                    transform: translateY(20px); transition: opacity 0.3s, transform 0.3s; }
                .toast.show { opacity: 1; transform: translateY(0); }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.parentNode?.removeChild(toast), 300);
        }, 3000);
    }

    showError(message) {
        this.hideLoadingState();
        
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            responseContainer.innerHTML = `
                <div class="error-message">
                    <strong>Initialization Error:</strong> ${message}
                </div>
            `;
        }
    }

    // Public methods for external access
    getEditor() {
        return this.editor;
    }

    getAIService() {
        return this.aiService;
    }

    getSimpleExecutor() {
        return this.simpleExecutor;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the app when the script loads
let app;

// Wait for everything to be loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
    });
} else {
    app = new App();
}

// Make app globally accessible for debugging
window.AI_IDE_App = app;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
