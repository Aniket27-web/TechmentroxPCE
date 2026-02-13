/*
  VoiceAssistant - simple voice-driven assistant using Web Speech API.
  - Listens for wake word "wake up" (or "hey jarvis") in continuous background.
  - On wake, prompts the user (TTS) and listens for a single command.
  - Sends the command to the AI service (via customPrompt) with optional selected code context.
  - Speaks the AI response and displays it in the UI. Offers to apply code fixes if response contains a code block.

  Notes:
  - Requires secure context (https) or localhost for SpeechRecognition.
  - Uses `window.SpeechRecognition` or `webkitSpeechRecognition`.
  - Add `?` or manually toggle using the `#voice-toggle` button in the header.
*/

class VoiceAssistant {
    constructor(aiService, editor, actionManager) {
        this.aiService = aiService;
        this.editor = editor;
        this.actionManager = actionManager;
        this.wakeRec = null;
        this.cmdRec = null;
        this.listening = false;
        this.lastResponse = null;
        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition not supported in this browser. Voice assistant disabled.');
            return;
        }

        this.SpeechRecognition = SpeechRecognition;

        // Wake recognizer (continuous)
        this.wakeRec = new SpeechRecognition();
        this.wakeRec.continuous = true;
        this.wakeRec.interimResults = false;
        this.wakeRec.lang = 'en-US';

        this.wakeRec.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript;
            transcript = transcript.trim().toLowerCase();
            if (transcript.includes('wake up') || transcript.includes('wakeup') || transcript.includes('hey jarvis')) {
                this.onWake();
            }
        };

        this.wakeRec.onend = () => {
            // auto-restart while enabled
            if (this.listening) {
                try { this.wakeRec.start(); } catch (e) {}
            }
        };

        // Wire UI toggle if available
        const btn = document.getElementById('voice-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    }

    start() {
        if (!this.wakeRec || this.listening) return;
        try {
            this.listening = true;
            this.wakeRec.start();
            this._setButtonActive(true);
        } catch (e) {
            console.warn('Could not start wake recognition', e);
        }
    }

    stop() {
        if (!this.wakeRec || !this.listening) return;
        this.listening = false;
        try { this.wakeRec.stop(); } catch (e) {}
        this._setButtonActive(false);
    }

    toggle() {
        if (this.listening) this.stop(); else this.start();
    }

    _setButtonActive(active) {
        const btn = document.getElementById('voice-toggle');
        if (!btn) return;
        btn.style.background = active ? '#2ecc71' : '';
    }

    speak(text) {
        if (!text) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    }

    async onWake() {
        // stop wake listening while we interact
        try { this.wakeRec.stop(); } catch (e) {}
        this.speak('Yes, I am listening. Ask your code question.');

        // One-shot command recognition
        try {
            await this._listenForCommand();
        } finally {
            // resume wake listening
            try { if (this.listening) this.wakeRec.start(); } catch (e) {}
        }
    }

    _listenForCommand() {
        return new Promise((resolve) => {
            const SpeechRecognition = this.SpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';
            let handled = false;

            rec.onresult = async (e) => {
                let transcript = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript;
                transcript = transcript.trim();
                handled = true;
                try {
                    await this._handleCommand(transcript);
                } catch (err) {
                    console.error('Command handling error', err);
                }
                resolve();
            };

            rec.onerror = (e) => {
                resolve();
            };

            rec.onend = () => {
                if (!handled) resolve();
            };

            try { rec.start(); } catch (e) { resolve(); }
        });
    }

    async _handleCommand(transcript) {
        if (!transcript) return;
        const lower = transcript.toLowerCase();

        // control commands
        if (lower.includes('sleep') || lower.includes('stop listening')) {
            this.speak('Going to sleep');
            this.stop();
            return;
        }

        // If user asked to run code
        if (lower.includes('run code') || lower.includes('execute') || lower.includes('run this')) {
            this.speak('Running the code now');
            try { window.AI_IDE_App?.simpleExecutor?.executeCode(); } catch (e) {}
            return;
        }

        // Otherwise send to AI as a coding query. Provide selected code context if available.
        const language = this.editor.currentLanguage;
        let code = '';
        try { code = this.editor.getSelectedText() || ''; } catch (e) { code = ''; }

        this.speak('Let me think about that');
        try {
            const prompt = transcript;
            const response = await this.aiService.customPrompt(prompt, code, language);
            this.lastResponse = response;
            // display in UI
            try { this.actionManager.displayResponse(response); } catch (e) {}

            // speak a short summary (first 250 chars)
            const plain = (typeof response === 'string') ? response.replace(/```[\s\S]*?```/g, '') : String(response);
            const speakText = plain.length > 300 ? plain.slice(0, 300) + '... (see UI for full response)' : plain;
            this.speak(speakText);

            // If the response contains a code block, offer to apply it
            if (/```[\s\S]*?```/.test(response)) {
                this.speak('I found a suggested code change. Would you like me to apply it? Say yes or no.');
                // listen for yes/no
                const confirmed = await this._listenForYesNo();
                if (confirmed) {
                    try {
                        const applied = this.actionManager.tryApplyFixesFromResponse(response, language);
                        if (applied) this.speak('Applied the suggested changes'); else this.speak('I could not apply the changes');
                    } catch (e) { this.speak('Failed to apply changes'); }
                } else {
                    this.speak('Okay, I will not apply the changes');
                }
            }

        } catch (err) {
            console.error(err);
            this.speak('Sorry, I had an error processing your request');
        }
    }

    _listenForYesNo() {
        return new Promise((resolve) => {
            const SpeechRecognition = this.SpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';
            let handled = false;
            rec.onresult = (e) => {
                let transcript = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript;
                transcript = transcript.trim().toLowerCase();
                handled = true;
                resolve(transcript.includes('y') || transcript.includes('yes') || transcript.includes('apply'));
            };
            rec.onerror = () => resolve(false);
            rec.onend = () => { if (!handled) resolve(false); };
            try { rec.start(); } catch (e) { resolve(false); }
        });
    }
}

window.VoiceAssistant = VoiceAssistant;
