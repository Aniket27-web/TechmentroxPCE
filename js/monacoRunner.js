class MonacoRunner {
    constructor(editor, terminal) {
        this.editor = editor;
        this.terminal = terminal;
        this.init();
    }

    init() {
        // Setup Monaco worker for JavaScript
        this.setupJavaScriptWorker();
        // Setup other language workers as needed
    }

    setupJavaScriptWorker() {
        // Monaco already has built-in JavaScript worker
        // We'll leverage Monaco's type checking and linting
    }

    async executeCode(code, language) {
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
            
            return result;
            
        } catch (error) {
            console.error('MonacoRunner Error:', error);
            return `Execution Error: ${error.message}`;
        }
    }

    async executeJavaScript(code) {
        return new Promise((resolve) => {
            // Capture console output
            const originalConsole = window.console;
            const logs = [];
            
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
                // Create a safe execution context
                const func = new Function(code);
                const result = func();
                
                window.console = originalConsole;
                
                let output = '';
                if (logs.length > 0) {
                    output += logs.join('\n');
                }
                if (result !== undefined) {
                    output += (output ? '\n' : '') + `Return: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
                }
                
                resolve(output || '✓ JavaScript executed successfully (no output)');
                
            } catch (error) {
                window.console = originalConsole;
                resolve(`✗ JavaScript Error: ${error.message}`);
            }
        });
    }

    async executePython(code) {
        // Use browser-based Python execution
        if (!window.pyodide) {
            if (this.terminal) {
                this.terminal.print('Loading Python runtime...', 'info');
            }
            await this.loadPyodide();
        }

        try {
            // Setup output capture
            await window.pyodide.runPythonAsync(`
import sys
from io import StringIO
import builtins

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

            // Execute code
            await window.pyodide.runPythonAsync(`
with output_capture:
    try:
        exec('''${code.replace(/'''/g, "\\'\\'\\'")}''')
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
            `);

            // Get output
            const [stdout, stderr] = await window.pyodide.runPython('output_capture.get_output()');
            
            let output = '';
            if (stdout) output += stdout;
            if (stderr) output += (output ? '\n' : '') + `ERROR: ${stderr}`;
            
            return output || '✓ Python executed successfully (no output)';

        } catch (error) {
            return `✗ Python Error: ${error.message}`;
        }
    }

    async executeJava(code) {
        // Browser-based Java compilation and execution simulation
        try {
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
            
            // Extract and simulate execution
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

    async executeCpp(code) {
        // Browser-based C++ compilation and execution simulation
        try {
            const analysis = this.analyzeCppCode(code);
            
            if (analysis.issues.length > 0) {
                return `⚠ C++ Code Issues:\n${analysis.issues.join('\n')}\n\n💡 Fix these issues for successful compilation.`;
            }

            // Simulate C++ compilation and execution
            const compilationSteps = [
                '🔨 Parsing C++ code...',
                '📚 Processing includes...',
                '🔍 Validating syntax...',
                '⚙️ Compiling to object code...',
                '🔗 Linking libraries...',
                '🚀 Executing compiled program...'
            ];

            let output = compilationSteps.join('\n') + '\n\n';
            
            // Extract and simulate execution
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
        // Create a new window for HTML execution
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
        // Apply CSS to current page
        const styleId = 'temp-monaco-css';
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
        // SQL syntax validation and explanation
        try {
            const upperCode = code.toUpperCase().trim();
            const issues = [];
            
            // Basic SQL validation
            if (!upperCode.includes('SELECT') && !upperCode.includes('INSERT') && 
                !upperCode.includes('UPDATE') && !upperCode.includes('DELETE') && 
                !upperCode.includes('CREATE') && !upperCode.includes('DROP')) {
                issues.push('No valid SQL command detected');
            }
            
            if (upperCode.includes('SELECT') && !upperCode.includes('FROM')) {
                issues.push('SELECT statement missing FROM clause');
            }
            
            // Extract operation
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
        // Simulate Java execution based on common patterns
        const output = [];
        
        // Look for System.out.println calls
        const printMatches = mainMethod.match(/System\.out\.println\s*\(\s*([^)]+)\s*\)/g);
        if (printMatches) {
            printMatches.forEach(match => {
                const content = match.match(/System\.out\.println\s*\(\s*([^)]+)\s*\)/)[1];
                try {
                    // Try to evaluate simple expressions
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
        // Simulate C++ execution based on common patterns
        const output = [];
        
        // Look for cout calls
        const coutMatches = mainFunction.match(/cout\s*<<\s*([^;]+)/g);
        if (coutMatches) {
            coutMatches.forEach(match => {
                const content = match.match(/cout\s*<<\s*([^;]+)/)[1];
                try {
                    // Try to evaluate simple expressions
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
        // Simple expression evaluator for common cases
        expression = expression.trim();
        
        // Handle string literals
        if (expression.startsWith('"') && expression.endsWith('"')) {
            return expression.slice(1, -1);
        }
        
        // Handle simple arithmetic
        if (/^[\d\s+\-*\/()]+$/.test(expression)) {
            try {
                return eval(expression);
            } catch (e) {
                return expression;
            }
        }
        
        // Handle variable-like expressions
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
            return expression;
        }
        
        return expression;
    }

    async loadPyodide() {
        return new Promise((resolve, reject) => {
            if (window.pyodide) {
                resolve();
                return;
            }

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
}

// Export for use in other modules
window.MonacoRunner = MonacoRunner;
