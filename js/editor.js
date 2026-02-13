class EditorManager {
    constructor() {
        this.editor = null;
        this.currentLanguage = 'javascript';
        this.isDarkTheme = false;
        this.init();
    }

    async init() {
        try {
            await this.loadMonaco();
            this.createEditor();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            this.showError('Failed to load editor. Please refresh the page.');
        }
    }

    async loadMonaco() {
        return new Promise((resolve, reject) => {
            if (window.monaco) {
                resolve();
                return;
            }

            require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
            
            require(['vs/editor/editor.main'], function () {
                resolve();
            }, function (error) {
                reject(error);
            });
        });
    }

    createEditor() {
        const editorContainer = document.getElementById('monaco-editor');
        if (!editorContainer) {
            throw new Error('Monaco editor container not found');
        }

        this.editor = monaco.editor.create(editorContainer, {
            value: this.getDefaultCode(),
            language: this.currentLanguage,
            theme: this.isDarkTheme ? 'vs-dark' : 'vs',
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            contextmenu: true,
            mouseWheelZoom: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
                indentation: true,
                bracketPairs: true
            }
        });

        this.editor.onDidChangeModelContent(() => {
            this.onContentChange();
        });

        this.editor.onDidChangeCursorPosition((e) => {
            this.updateCursorPosition(e.position);
        });
    }

    getDefaultCode() {
        const defaults = {
            javascript: `// Welcome to AI-Powered IDE
function helloWorld() {
    console.log("Hello, World!");
    return "Welcome to AI-Powered Coding Environment";
}

// Write your code here and use AI assistance!
helloWorld();`,
            python: `# Welcome to AI-Powered IDE
def hello_world():
    print("Hello, World!")
    return "Welcome to AI-Powered Coding Environment"

# Write your code here and use AI assistance!
hello_world()`,
            java: `// Welcome to AI-Powered IDE
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to AI-Powered Coding Environment");
    }
}`,
            cpp: `// Welcome to AI-Powered IDE
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "Welcome to AI-Powered Coding Environment" << endl;
    return 0;
}`,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Powered IDE</title>
</head>
<body>
    <h1>Welcome to AI-Powered Coding Environment</h1>
    <p>Write your HTML code here!</p>
</body>
</html>`,
            css: `/* Welcome to AI-Powered IDE */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}`,
            json: `{
  "name": "AI-Powered IDE",
  "version": "1.0.0",
  "description": "An intelligent coding environment",
  "features": [
    "Code generation",
    "Debugging assistance",
    "Code optimization",
    "Real-time AI help"
  ]
}`,
            sql: `-- Welcome to AI-Powered IDE
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Write your SQL queries here!
SELECT * FROM users;`
        };

        return defaults[this.currentLanguage] || defaults.javascript;
    }

    setupEventListeners() {
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }

        const newFileBtn = document.getElementById('new-file');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                this.newFile();
            });
        }

        const saveFileBtn = document.getElementById('save-file');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', () => {
                this.saveFile();
            });
        }
    }

    changeLanguage(language) {
        if (this.editor && language !== this.currentLanguage) {
            const currentContent = this.editor.getValue();
            // Capture the previous default (for the currently set language)
            const prevDefault = this.getDefaultCode();
            // Update language
            this.currentLanguage = language;

            monaco.editor.setModelLanguage(this.editor.getModel(), language);

            // If the user hasn't modified the default content (it matches the previous default),
            // replace it with the new language's default template. This avoids overwriting user code.
            if (currentContent.trim() === (prevDefault || '').trim()) {
                this.editor.setValue(this.getDefaultCode());
            }

            // If the user switched to Python, trigger background preload of Pyodide for faster execution.
            if (language === 'python') {
                try { document.dispatchEvent(new Event('preload-pyodide')); } catch (e) {}
            }
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        if (this.editor) {
            const newTheme = this.isDarkTheme ? 'vs-dark' : 'vs';
            monaco.editor.setTheme(newTheme);
        }
        return this.isDarkTheme;
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    getSelectedText() {
        if (!this.editor) return '';
        
        const selection = this.editor.getSelection();
        if (selection.isEmpty()) {
            return this.editor.getValue();
        }
        
        return this.editor.getModel().getValueInRange(selection);
    }

    insertText(text, atCursor = true) {
        if (!this.editor) return;
        
        if (atCursor) {
            const position = this.editor.getPosition();
            this.editor.executeEdits('', [{
                range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                ),
                text: text
            }]);
        } else {
            this.editor.setValue(text);
        }
    }

    newFile() {
        if (this.editor) {
            this.editor.setValue(this.getDefaultCode());
        }
    }

    saveFile() {
        const content = this.getValue();
        const language = this.currentLanguage;
        const filename = `code.${this.getFileExtension()}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getFileExtension() {
        const extensions = {
            javascript: 'js',
            python: 'py',
            java: 'java',
            cpp: 'cpp',
            html: 'html',
            css: 'css',
            json: 'json',
            sql: 'sql'
        };
        return extensions[this.currentLanguage] || 'txt';
    }

    onContentChange() {
        // This can be used for auto-save or other features
        console.log('Editor content changed');
    }

    updateCursorPosition(position) {
        // This can be used to display cursor position
        console.log(`Cursor at line ${position.lineNumber}, column ${position.column}`);
    }

    showError(message) {
        const responseContainer = document.getElementById('response-container');
        if (responseContainer) {
            responseContainer.innerHTML = `<div style="color: red; font-weight: bold;">Error: ${message}</div>`;
        }
    }

    formatCode() {
        if (this.editor) {
            this.editor.getAction('editor.action.formatDocument').run();
        }
    }

    commentCode() {
        if (this.editor) {
            this.editor.getAction('editor.action.commentLine').run();
        }
    }

    findAndReplace() {
        if (this.editor) {
            this.editor.getAction('editor.actions.findWithSelection').run();
        }
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}

// Export for use in other modules
window.EditorManager = EditorManager;
