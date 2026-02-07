class CodeExecutor {
    constructor(editor, terminal) {
        this.editor = editor;
        this.terminal = terminal;
        this.monacoRunner = new MonacoRunner(editor, terminal);
        this.init();
    }

    init() {
        this.setupExecutionButton();
    }

    setupExecutionButton() {
        // Add execute button to editor toolbar
        const editorActions = document.querySelector('.editor-actions');
        if (editorActions) {
            const executeBtn = document.createElement('button');
            executeBtn.id = 'execute-code';
            executeBtn.className = 'btn btn-success';
            executeBtn.innerHTML = '▶ Run Code';
            executeBtn.addEventListener('click', () => this.executeCode());
            editorActions.appendChild(executeBtn);
        }

        // Add keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.executeCode();
            }
        });
    }

    async executeCode() {
        const code = this.editor.getValue();
        const language = this.editor.currentLanguage;
        
        if (!code.trim()) {
            this.terminal.print('No code to execute.', 'warning');
            return;
        }

        // Use MonacoRunner for execution
        await this.monacoRunner.executeCode(code, language);
    }
}

// Export for use in other modules
window.CodeExecutor = CodeExecutor;
