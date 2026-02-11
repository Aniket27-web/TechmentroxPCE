class Terminal {
    constructor() {
        this.container = null;
        this.outputElement = null;
        this.currentLine = null;
        this.history = [];
        this.historyIndex = -1;
        this.init();
    }

    init() {
        this.createTerminal();
        this.setupEventListeners();
    }

    createTerminal() {
        // Create terminal container
        const terminalContainer = document.createElement('div');
        terminalContainer.id = 'terminal-container';
        terminalContainer.className = 'terminal-container';
        terminalContainer.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">
                    <span class="terminal-dot red"></span>
                    <span class="terminal-dot yellow"></span>
                    <span class="terminal-dot green"></span>
                    <span class="terminal-name">Terminal</span>
                </div>
                <div class="terminal-controls">
                    <button id="terminal-clear" class="btn btn-small">Clear</button>
                    <button id="terminal-toggle" class="btn btn-small">Hide</button>
                </div>
            </div>
            <div class="terminal-body" id="terminal-body">
                <div class="terminal-output" id="terminal-output"></div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt">$</span>
                    <input type="text" id="terminal-input" class="terminal-input" autocomplete="off" />
                </div>
            </div>
        `;

        // Add terminal to the left column so it appears under the editor
        const leftColumn = document.querySelector('.left-column') || document.querySelector('.main-container');
        if (leftColumn) {
            leftColumn.appendChild(terminalContainer);
        }

        this.container = terminalContainer;
        this.outputElement = document.getElementById('terminal-output');
        this.currentLine = document.getElementById('terminal-input');
    }

    setupEventListeners() {
        // Terminal input handling
        this.currentLine.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(this.currentLine.value);
                this.currentLine.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Basic tab completion could be added here
            }
        });

        // Clear button
        document.getElementById('terminal-clear').addEventListener('click', () => {
            this.clear();
        });

        // Toggle button
        document.getElementById('terminal-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // Focus terminal when clicking on it
        this.container.addEventListener('click', () => {
            this.currentLine.focus();
        });
    }

    executeCommand(command) {
        if (!command.trim()) return;

        // Add command to history
        this.history.push(command);
        this.historyIndex = this.history.length;

        // Show the command
        this.print(`$ ${command}`, 'command');

        // Execute the command
        this.processCommand(command);
    }

    async processCommand(command) {
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                this.print(`Available commands:
  help     - Show this help message
  clear    - Clear terminal
  run      - Execute the current code in editor
  js       - Execute JavaScript code
  py       - Execute Python code
  echo     - Echo text
  date     - Show current date and time
  ls       - List available features`, 'info');
                break;

            case 'clear':
                this.clear();
                break;

            case 'run':
                await this.runEditorCode();
                break;

            case 'js':
                if (args.length === 0) {
                    this.print('Usage: js <javascript_code>', 'error');
                } else {
                    await this.executeJavaScript(args.join(' '));
                }
                break;

            case 'py':
                if (args.length === 0) {
                    this.print('Usage: py <python_code>', 'error');
                } else {
                    await this.executePython(args.join(' '));
                }
                break;

            case 'echo':
                this.print(args.join(' '), 'output');
                break;

            case 'date':
                this.print(new Date().toString(), 'info');
                break;

            case 'ls':
                this.print(`AI IDE Features:
  🤖 AI Assistant (Explain, Debug, Generate, Optimize)
  💻 Code Editor (Monaco Editor)
  🚀 Code Execution (JavaScript, Python, HTML, CSS)
  🎨 Dark/Light Theme
  ⌨️  Keyboard Shortcuts`, 'info');
                break;

            default:
                this.print(`Command not found: ${cmd}. Type 'help' for available commands.`, 'error');
        }
    }

    async runEditorCode() {
        try {
            const editor = window.AI_IDE_App?.getEditor();
            if (!editor) {
                this.print('Editor not found', 'error');
                return;
            }

            const code = editor.getValue();
            const language = editor.currentLanguage;

            if (!code.trim()) {
                this.print('No code to execute', 'warning');
                return;
            }

            this.print(`Executing ${language} code...`, 'info');

            let result;
            switch (language) {
                case 'javascript':
                    result = await this.executeJavaScript(code);
                    break;
                case 'python':
                    result = await this.executePython(code);
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
                default:
                    result = `Execution not supported for ${language}`;
            }

            this.print(result, 'success');

        } catch (error) {
            this.print(`Error: ${error.message}`, 'error');
        }
    }

    async executeJavaScript(code) {
        return new Promise((resolve) => {
            const originalConsole = window.console;
            const originalLog = [];

            const customConsole = {
                log: (...args) => {
                    originalLog.push(args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                    originalConsole.log(...args);
                },
                error: (...args) => {
                    originalLog.push('ERROR: ' + args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                    originalConsole.error(...args);
                },
                warn: (...args) => {
                    originalLog.push('WARNING: ' + args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                    originalConsole.warn(...args);
                }
            };

            window.console = customConsole;

            try {
                const func = new Function(code);
                const result = func();
                window.console = originalConsole;

                let finalOutput = '';
                if (originalLog.length > 0) {
                    finalOutput += originalLog.join('\n');
                }
                if (result !== undefined) {
                    finalOutput += (finalOutput ? '\n' : '') + `→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
                }

                resolve(finalOutput || '✓ Code executed successfully');

            } catch (error) {
                window.console = originalConsole;
                resolve(`✗ JavaScript Error: ${error.message}`);
            }
        });
    }

    async executePython(code) {
        if (!window.pyodide) {
            this.print('Loading Python runtime...', 'info');
            try {
                await this.loadPyodide();
            } catch (error) {
                return `✗ Failed to load Python: ${error.message}`;
            }
        }

        try {
            await window.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
            `);

            await window.pyodide.runPythonAsync(code);

            const stdout = window.pyodide.runPython('sys.stdout.getvalue()');
            const stderr = window.pyodide.runPython('sys.stderr.getvalue()');

            let output = '';
            if (stdout) output += stdout;
            if (stderr) output += (output ? '\n' : '') + `ERROR: ${stderr}`;

            return output || '✓ Python code executed successfully';

        } catch (error) {
            return `✗ Python Error: ${error.message}`;
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
        const styleId = 'temp-terminal-css';
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

    async executeJava(code) {
        // For Java, we'll provide syntax checking and basic analysis
        try {
            // Basic Java syntax validation
            if (!code.includes('class') && !code.includes('interface')) {
                return '⚠ Java code must contain a class or interface';
            }
            
            if (!code.includes('public static void main')) {
                return '⚠ Java code should include a main method for execution';
            }
            
            // Check for common syntax issues
            const issues = [];
            
            if (!code.match(/public\s+class\s+\w+/)) {
                issues.push('Missing public class declaration');
            }
            
            if (!code.match(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w*\s*\)/)) {
                issues.push('Missing or incorrect main method signature');
            }
            
            // Check for balanced braces
            const openBraces = (code.match(/\{/g) || []).length;
            const closeBraces = (code.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
            }
            
            if (issues.length > 0) {
                return `⚠ Java Syntax Issues:\n${issues.join('\n')}\n\n✓ Code structure looks valid but needs compilation`;
            }
            
            return '✓ Java code syntax appears valid\n\nNote: Full Java execution requires server-side compilation. Use online Java compilers for full execution.';
            
        } catch (error) {
            return `✗ Java Analysis Error: ${error.message}`;
        }
    }

    async executeCpp(code) {
        // For C++, we'll provide syntax checking and basic analysis
        try {
            // Basic C++ syntax validation
            const issues = [];
            
            if (!code.includes('#include') && !code.includes('using namespace')) {
                issues.push('Consider adding #include directives');
            }
            
            if (!code.includes('main') && !code.includes('int main')) {
                issues.push('Missing main function');
            }
            
            // Check for balanced braces
            const openBraces = (code.match(/\{/g) || []).length;
            const closeBraces = (code.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
            }
            
            // Check for common syntax patterns
            if (code.includes('cout') && !code.includes('#include <iostream>')) {
                issues.push('Using cout but missing #include <iostream>');
            }
            
            if (code.includes('cin') && !code.includes('#include <iostream>')) {
                issues.push('Using cin but missing #include <iostream>');
            }
            
            if (issues.length > 0) {
                return `⚠ C++ Syntax Issues:\n${issues.join('\n')}\n\n✓ Code structure looks valid but needs compilation`;
            }
            
            return '✓ C++ code syntax appears valid\n\nNote: Full C++ execution requires server-side compilation. Use online C++ compilers for full execution.';
            
        } catch (error) {
            return `✗ C++ Analysis Error: ${error.message}`;
        }
    }

    async executeSQL(code) {
        // For SQL, we'll provide syntax validation and explanation
        try {
            const upperCode = code.toUpperCase().trim();
            const issues = [];
            
            // Basic SQL syntax validation
            if (!upperCode.includes('SELECT') && !upperCode.includes('INSERT') && 
                !upperCode.includes('UPDATE') && !upperCode.includes('DELETE') && 
                !upperCode.includes('CREATE') && !upperCode.includes('DROP')) {
                issues.push('No valid SQL command detected (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP)');
            }
            
            // Check for basic syntax
            if (upperCode.includes('SELECT') && !upperCode.includes('FROM')) {
                issues.push('SELECT statement missing FROM clause');
            }
            
            if (upperCode.includes('WHERE') && upperCode.split('WHERE').length - 1 > 1) {
                issues.push('Multiple WHERE clauses detected');
            }
            
            // Check for unmatched quotes
            const singleQuotes = (code.match(/'/g) || []).length;
            if (singleQuotes % 2 !== 0) {
                issues.push('Unmatched single quotes');
            }
            
            // Extract and explain the SQL operation
            let operation = 'Unknown';
            if (upperCode.includes('SELECT')) operation = 'SELECT - Query data';
            else if (upperCode.includes('INSERT')) operation = 'INSERT - Add data';
            else if (upperCode.includes('UPDATE')) operation = 'UPDATE - Modify data';
            else if (upperCode.includes('DELETE')) operation = 'DELETE - Remove data';
            else if (upperCode.includes('CREATE')) operation = 'CREATE - Create table/database';
            else if (upperCode.includes('DROP')) operation = 'DROP - Delete table/database';
            
            if (issues.length > 0) {
                return `⚠ SQL Syntax Issues:\n${issues.join('\n')}\n\nOperation: ${operation}\n\nNote: SQL execution requires database connection.`;
            }
            
            return `✓ SQL syntax appears valid\n\nOperation: ${operation}\n\nNote: SQL execution requires database connection. Use online SQL editors for full execution.`;
            
        } catch (error) {
            return `✗ SQL Analysis Error: ${error.message}`;
        }
    }

    async executePython(code) {
        if (!window.pyodide) {
            this.print('Loading Python runtime...', 'info');
            try {
                await this.loadPyodide();
            } catch (error) {
                return `✗ Failed to load Python: ${error.message}`;
            }
        }

        try {
            await window.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
            `);

            await window.pyodide.runPythonAsync(code);

            const stdout = window.pyodide.runPython('sys.stdout.getvalue()');
            const stderr = window.pyodide.runPython('sys.stderr.getvalue()');

            let output = '';
            if (stdout) output += stdout;
            if (stderr) output += (output ? '\n' : '') + `ERROR: ${stderr}`;

            return output || '✓ Python code executed successfully';

        } catch (error) {
            return `✗ Python Error: ${error.message}`;
        }
    }

    async loadPyodide() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            script.onload = async () => {
                try {
                    window.pyodide = await loadPyodide();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    print(text, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;
        line.textContent = text;
        
        this.outputElement.appendChild(line);
        this.scrollToBottom();
    }

    clear() {
        this.outputElement.innerHTML = '';
        this.print('Terminal cleared. Type "help" for commands.', 'info');
    }

    toggle() {
        const terminalBody = document.getElementById('terminal-body');
        const toggleBtn = document.getElementById('terminal-toggle');
        
        if (terminalBody.style.display === 'none') {
            terminalBody.style.display = 'block';
            toggleBtn.textContent = 'Hide';
            this.currentLine.focus();
        } else {
            terminalBody.style.display = 'none';
            toggleBtn.textContent = 'Show';
        }
    }

    scrollToBottom() {
        const terminalBody = document.getElementById('terminal-body');
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return;

        if (direction === -1 && this.historyIndex > 0) {
            this.historyIndex--;
        } else if (direction === 1 && this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
        }

        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            this.currentLine.value = this.history[this.historyIndex];
        }
    }

    focus() {
        this.currentLine.focus();
    }

    // Public API for external code execution
    async executeCode(code, language) {
        this.print(`Executing ${language} code...`, 'info');
        
        try {
            let result;
            
            switch (language) {
                case 'javascript':
                    result = await this.executeJavaScript(code);
                    break;
                case 'python':
                    result = await this.executePython(code);
                    break;
                case 'java':
                    result = await this.executeJava(code);
                    break;
                case 'cpp':
                    result = await this.executeCpp(code);
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
            
            this.print(result, 'success');
            
        } catch (error) {
            this.print(`Error: ${error.message}`, 'error');
        }
    }
}

// Export for use in other modules
window.Terminal = Terminal;
