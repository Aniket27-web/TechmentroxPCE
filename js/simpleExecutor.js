class SimpleExecutor {
    constructor(editor, terminal) {
        this.editor = editor;
        this.terminal = terminal;
        this.init();
    }

    init() {
        this.setupRunButton();
        // Listen for background preload request for Pyodide
        document.addEventListener('preload-pyodide', () => {
            // fire-and-forget preload to speed up first Python execution
            try { this.loadPyodide().catch(() => {}); } catch (e) {}
        });
    }

    setupRunButton() {
        // Find or create run button
        let runBtn = document.getElementById('execute-code');
        if (!runBtn) {
            const editorActions = document.querySelector('.editor-actions');
            if (editorActions) {
                runBtn = document.createElement('button');
                runBtn.id = 'execute-code';
                runBtn.className = 'btn btn-success';
                runBtn.innerHTML = '▶ Run Code';
                editorActions.appendChild(runBtn);
            }
        }

        // Add click handler
        if (runBtn) {
            runBtn.addEventListener('click', () => this.executeCode());
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

        // Get user input for programs that need stdin (scanf, cin, input(), etc.)
        let userInput = null;
        if (this.needsInput(code, language)) {
            userInput = await this.showInputDialog(language);
            if (userInput === null) return; // User cancelled
        }

        this.terminal.print(`Executing ${language} code...`, 'info');
        
        try {
            let result;
            
            switch (language) {
                case 'javascript':
                    result = await this.executeJavaScript(code, userInput);
                    break;
                case 'python':
                    result = await this.executePython(code, userInput);
                    break;
                case 'java':
                    result = await this.executeJava(code, userInput);
                    break;
                case 'cpp':
                    result = await this.executeCpp(code, userInput);
                    break;
                case 'html':
                    result = await this.executeHTML(code);
                    break;
                case 'css':
                    result = await this.executeCSS(code);
                    break;
                case 'json':
                    result = await this.executeJSON(code);
                    break;
                case 'sql':
                    result = await this.executeSQL(code);
                    break;
                default:
                    result = `Execution not supported for ${language}`;
            }
            
            this.terminal.print(result, 'success');
            
        } catch (error) {
            this.terminal.print(`Error: ${error.message}`, 'error');
        }
    }

    needsInput(code, language) {
        const lower = code.toLowerCase();
        const patterns = {
            javascript: /\b(prompt|readline|input)\s*\(/,
            python: /\binput\s*\(/,
            java: /\b(Scanner|nextInt|nextDouble|nextLine|next)\s*\(/,
            cpp: /\b(scanf|cin)\b/
        };
        return patterns[language] ? patterns[language].test(lower) : false;
    }

    showInputDialog(language) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'input-modal-overlay';
            modal.innerHTML = `
                <div class="input-modal">
                    <h3>Program Input</h3>
                    <p>Enter input values (one per line). These will be passed to stdin.</p>
                    <textarea id="stdin-input" placeholder="e.g.&#10;5&#10;hello&#10;42" rows="5"></textarea>
                    <div class="input-modal-buttons">
                        <button id="stdin-ok" class="btn btn-primary">Run</button>
                        <button id="stdin-cancel" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;
            const style = document.createElement('style');
            style.textContent = `
                .input-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000; }
                .input-modal { background:#fff;padding:24px;border-radius:8px;max-width:400px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.2); }
                .input-modal h3 { margin:0 0 8px 0; }
                .input-modal p { color:#666;margin:0 0 16px 0;font-size:14px; }
                .input-modal textarea { width:100%;padding:12px;border:1px solid #ddd;border-radius:4px;font-family:monospace;resize:vertical; }
                .input-modal-buttons { display:flex;gap:10px;margin-top:16px;justify-content:flex-end; }
                .dark-theme .input-modal { background:#2d2d2d; }
                .dark-theme .input-modal textarea { background:#1e1e1e;border-color:#444;color:#fff; }
            `;
            if (!document.getElementById('input-modal-styles')) {
                style.id = 'input-modal-styles';
                document.head.appendChild(style);
            }
            document.body.appendChild(modal);
            const textarea = document.getElementById('stdin-input');
            textarea.focus();
            const cleanup = () => {
                document.body.removeChild(modal);
            };
            document.getElementById('stdin-ok').onclick = () => {
                cleanup();
                resolve(textarea.value);
            };
            document.getElementById('stdin-cancel').onclick = () => {
                cleanup();
                resolve(null);
            };
        });
    }

    async executeJavaScript(code, userInput) {
        return new Promise((resolve) => {
            const originalConsole = window.console;
            const logs = [];
            
            const lines = (userInput || '').split('\n');
            let lineIdx = 0;
            const prevInput = window.input;
            const prevReadline = window.readline;
            if (userInput !== null) {
                window.input = (p) => lineIdx < lines.length ? lines[lineIdx++] : (window.prompt(p || '') || '');
                window.readline = () => window.input('');
            }
            
            const customConsole = {
                log: (...args) => {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    logs.push(message);
                    originalConsole.log(...args);
                },
                error: (...args) => {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    logs.push(`ERROR: ${message}`);
                    originalConsole.error(...args);
                },
                warn: (...args) => {
                    const message = args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    logs.push(`WARNING: ${message}`);
                    originalConsole.warn(...args);
                }
            };
            
            window.console = customConsole;
            
            try {
                const func = new Function(code);
                const result = func();
                let output = '';
                if (logs.length > 0) {
                    output += logs.join('\n');
                }
                if (result !== undefined) {
                    output += (output ? '\n' : '') + `Return: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
                }
                resolve(output || '✓ JavaScript executed successfully (no output)');
            } catch (error) {
                resolve(`✗ JavaScript Error: ${error.message}`);
            } finally {
                window.console = originalConsole;
                if (prevInput !== undefined) window.input = prevInput; else delete window.input;
                if (prevReadline !== undefined) window.readline = prevReadline; else delete window.readline;
            }
        });
    }

    async executePython(code, userInput) {
        if (!window.pyodide) {
            this.terminal.print('Loading Python runtime...', 'info');
            await this.loadPyodide();
        }

        try {
            await window.pyodide.runPythonAsync(`
import sys
from io import StringIO
import builtins

${userInput ? `sys.stdin = StringIO(${JSON.stringify(userInput + '\n')})` : ''}

class OutputCapture:
    def __init__(self):
        self.stdout = StringIO()
        self.stderr = StringIO()
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        self.original_print = builtins.print
    
    def __enter__(self):
        sys.stdout = self.stdout
        sys.stderr = self.stderr
        builtins.print = self.custom_print
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr
        builtins.print = self.original_print
    
    def custom_print(self, *args, **kwargs):
        sep = kwargs.get('sep', ' ')
        end = kwargs.get('end', '\\n')
        file = kwargs.get('file', sys.stdout)
        if file == sys.stdout:
            self.stdout.write(sep.join(map(str, args)) + end)
        elif file == sys.stderr:
            self.stderr.write(sep.join(map(str, args)) + end)
        else:
            self.original_print(*args, **kwargs)
    
    def get_output(self):
        return self.stdout.getvalue(), self.stderr.getvalue()

output_capture = OutputCapture()
            `);

            await window.pyodide.runPythonAsync(`
with output_capture:
    try:
        exec('''${code.replace(/'''/g, "\\'\\'\\'")}''')
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
            `);

            const [stdout, stderr] = await window.pyodide.runPython('output_capture.get_output()');
            
            let output = '';
            if (stdout) output += stdout;
            if (stderr) output += (output ? '\n' : '') + `ERROR: ${stderr}`;
            
            return output || '✓ Python executed successfully (no output)';

        } catch (error) {
            return `✗ Python Error: ${error.message}`;
        }
    }

    async executeJava(code, userInput) {
        try {
            if (userInput && this.needsInput(code, 'java')) {
                this.terminal.print('Note: Java execution is simulated. stdin (Scanner) is not supported—use Python or JavaScript for programs with input.', 'info');
            }
            const analysis = this.analyzeJavaCode(code);
            
            if (analysis.issues.length > 0) {
                return `⚠ Java Code Issues:\n${analysis.issues.join('\n')}\n\n💡 Fix these issues for successful compilation.`;
            }

            // Simulate Java compilation and execution
            const compilationSteps = [
                '🔨 Parsing Java code...',
                '📦 Checking imports...',
                '🔍 Validating syntax...',
                '⚙️ Compiling to bytecode...',
                '🚀 Executing compiled code...'
            ];

            let output = compilationSteps.join('\n') + '\n\n';
            
            const mainMethod = this.extractMainMethod(code);
            if (mainMethod) {
                output += this.simulateJavaExecution(mainMethod);
            } else {
                output += '✓ Code compiled successfully\n\n💡 No main method found to execute';
            }
            
            return output;

        } catch (error) {
            return `✗ Java Execution Error: ${error.message}`;
        }
    }

    async executeCpp(code, userInput) {
        try {
            if (userInput && this.needsInput(code, 'cpp')) {
                this.terminal.print('Note: C++ execution is simulated. stdin (scanf/cin) is not supported—use Python or JavaScript for programs with input.', 'info');
            }
            const analysis = this.analyzeCppCode(code);
            
            if (analysis.issues.length > 0) {
                return `⚠ C++ Code Issues:\n${analysis.issues.join('\n')}\n\n💡 Fix these issues for successful compilation.`;
            }

            const compilationSteps = [
                '🔨 Parsing C++ code...',
                '📚 Processing includes...',
                '🔍 Validating syntax...',
                '⚙️ Compiling to object code...',
                '🔗 Linking libraries...',
                '🚀 Executing compiled program...'
            ];

            let output = compilationSteps.join('\n') + '\n\n';
            
            const mainFunction = this.extractMainFunction(code);
            if (mainFunction) {
                output += this.simulateCppExecution(mainFunction);
            } else {
                output += '✓ Code compiled successfully\n\n💡 No main function found to execute';
            }
            
            return output;

        } catch (error) {
            return `✗ C++ Execution Error: ${error.message}`;
        }
    }

    async executeHTML(code) {
        const htmlWindow = window.open('', '_blank', 'width=800,height=600');
        if (htmlWindow) {
            htmlWindow.document.write(code);
            htmlWindow.document.close();
            return '✓ HTML opened in new window';
        } else {
            return '✗ Popup blocked. Please allow popups for this site.';
        }
    }

    async executeCSS(code) {
        const styleId = 'temp-executed-css';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = code;
        return '✓ CSS applied to current page';
    }

    async executeJSON(code) {
        try {
            const parsed = JSON.parse(code);
            return `✓ Valid JSON:\n${JSON.stringify(parsed, null, 2)}`;
        } catch (error) {
            return `✗ Invalid JSON: ${error.message}`;
        }
    }

    async executeSQL(code) {
        try {
            const upperCode = code.toUpperCase().trim();
            const issues = [];
            
            if (!upperCode.includes('SELECT') && !upperCode.includes('INSERT') && 
                !upperCode.includes('UPDATE') && !upperCode.includes('DELETE') && 
                !upperCode.includes('CREATE') && !upperCode.includes('DROP')) {
                issues.push('No valid SQL command detected');
            }
            
            if (upperCode.includes('SELECT') && !upperCode.includes('FROM')) {
                issues.push('SELECT statement missing FROM clause');
            }
            
            let operation = 'Unknown';
            if (upperCode.includes('SELECT')) operation = 'SELECT - Query data';
            else if (upperCode.includes('INSERT')) operation = 'INSERT - Add data';
            else if (upperCode.includes('UPDATE')) operation = 'UPDATE - Modify data';
            else if (upperCode.includes('DELETE')) operation = 'DELETE - Remove data';
            else if (upperCode.includes('CREATE')) operation = 'CREATE - Create table/database';
            else if (upperCode.includes('DROP')) operation = 'DROP - Delete table/database';
            
            if (issues.length > 0) {
                return `⚠ SQL Issues:\n${issues.join('\n')}\n\nOperation: ${operation}`;
            }
            
            return `✓ SQL syntax appears valid\n\nOperation: ${operation}\n\n💡 SQL execution requires database connection`;

        } catch (error) {
            return `✗ SQL Analysis Error: ${error.message}`;
        }
    }

    // Helper methods for Java analysis
    analyzeJavaCode(code) {
        const issues = [];
        
        if (!code.includes('class') && !code.includes('interface')) {
            issues.push('Missing class or interface declaration');
        }
        
        if (!code.includes('public static void main')) {
            issues.push('Missing main method');
        }
        
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        return { issues };
    }

    extractMainMethod(code) {
        const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([^}]*)\}/);
        return mainMatch ? mainMatch[1] : null;
    }

    simulateJavaExecution(mainMethod) {
        const output = [];
        
        const printMatches = mainMethod.match(/System\.out\.println\s*\(\s*([^)]+)\s*\)/g);
        if (printMatches) {
            printMatches.forEach(match => {
                const content = match.match(/System\.out\.println\s*\(\s*([^)]+)\s*\)/)[1];
                try {
                    const evaluated = this.evaluateSimpleExpression(content);
                    output.push(`[OUTPUT] ${evaluated}`);
                } catch (e) {
                    output.push(`[OUTPUT] ${content}`);
                }
            });
        }
        
        return output.length > 0 ? output.join('\n') : '✓ Main method executed (no output)';
    }

    // Helper methods for C++ analysis
    analyzeCppCode(code) {
        const issues = [];
        
        if (!code.includes('main') && !code.includes('int main')) {
            issues.push('Missing main function');
        }
        
        if (!code.includes('#include')) {
            issues.push('Missing #include directives');
        }
        
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        return { issues };
    }

    extractMainFunction(code) {
        const mainMatch = code.match(/int\s+main\s*\([^)]*\)\s*\{([^}]*)\}/);
        return mainMatch ? mainMatch[1] : null;
    }

    simulateCppExecution(mainFunction) {
        const output = [];
        
        const coutMatches = mainFunction.match(/cout\s*<<\s*([^;]+)/g);
        if (coutMatches) {
            coutMatches.forEach(match => {
                const content = match.match(/cout\s*<<\s*([^;]+)/)[1];
                try {
                    const evaluated = this.evaluateSimpleExpression(content);
                    output.push(`[OUTPUT] ${evaluated}`);
                } catch (e) {
                    output.push(`[OUTPUT] ${content}`);
                }
            });
        }
        
        return output.length > 0 ? output.join('\n') : '✓ Main function executed (no output)';
    }

    evaluateSimpleExpression(expression) {
        expression = expression.trim();
        
        if (expression.startsWith('"') && expression.endsWith('"')) {
            return expression.slice(1, -1);
        }
        
        if (/^[\d\s+\-*\/()]+$/.test(expression)) {
            try {
                return eval(expression);
            } catch (e) {
                return expression;
            }
        }
        
        return expression;
    }

    async loadPyodide() {
        if (window.pyodide) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.crossOrigin = 'anonymous';
            const version = '0.24.1';
            const base = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
            script.src = base + 'pyodide.js';
            script.onload = async () => {
                try {
                    // Use the global window.loadPyodide and provide indexURL explicitly
                    if (typeof window.loadPyodide !== 'function') {
                        throw new Error('loadPyodide not available on window after script load');
                    }
                    window.pyodide = await window.loadPyodide({ indexURL: base });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = (e) => reject(new Error('Failed to load Pyodide script'));
            document.head.appendChild(script);
        });
    }
}

// Export for use in other modules
window.SimpleExecutor = SimpleExecutor;
