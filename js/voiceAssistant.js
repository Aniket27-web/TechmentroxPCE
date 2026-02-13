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
        console.debug('VoiceAssistant: init');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition not supported in this browser. Voice assistant disabled.');
            return;
        }

        this.SpeechRecognition = SpeechRecognition;

        // Wake recognizer (continuous) - use Hinglish-friendly locale
        this.wakeRec = new SpeechRecognition();
        this.wakeRec.continuous = true;
        this.wakeRec.interimResults = false;
        // Use English locale for wake detection
        this.wakeRec.lang = 'en-US';

        this.wakeRec.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) transcript += e.results[i][0].transcript;
            transcript = transcript.trim().toLowerCase();
            console.debug('VoiceAssistant wakeRec.onresult:', transcript);
            // Recognize the new wake phrase "wake upp" (Hinglish-friendly)
            if (transcript.includes('wake upp') || transcript.includes('wakeup') || transcript.includes('wake up') || transcript.includes('hey jarvis')) {
                this.onWake();
            }
        };

        this.wakeRec.onstart = () => {
            console.debug('VoiceAssistant wakeRec started');
            if (this.debugEl) this._appendDebug('wake recognizer started');
        };

        this.wakeRec.onerror = (err) => {
            console.error('VoiceAssistant wakeRec error', err);
            this._showTransientNotice('Voice assistant error');
            if (this.debugEl) this._appendDebug('wakeRec error: ' + (err && err.error ? err.error : String(err)));
        };

        this.wakeRec.onnomatch = (e) => {
            console.debug('VoiceAssistant wakeRec non-match', e);
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

        // Ensure persistent UI notice exists to inform users about the voice assistant
        let notice = document.getElementById('voice-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'voice-notice';
            notice.className = 'voice-notice';
            notice.innerText = 'Voice assistant available — say "wake upp" to activate';
            document.body.appendChild(notice);
        } else {
            notice.innerText = 'Voice assistant available — say "wake upp" to activate';
        }

        // Debug panel element (on-screen) for easier diagnostics
        this.debugEl = document.getElementById('voice-debug');
        if (this.debugEl) {
            this._appendDebug('VoiceAssistant initialized');
        }
    }

    start() {
        if (!this.wakeRec || this.listening) return;
        try {
            // Request microphone permission explicitly to ensure browser prompts
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                        try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                    }).catch(err => {
                        console.warn('Microphone permission denied or unavailable', err);
                        if (this.debugEl) this._appendDebug('Mic permission denied: ' + String(err));
                        this._showTransientNotice('Please allow microphone access');
                    });
                } catch (e) {
                    console.debug('getUserMedia request failed', e);
                }
            }
            this.listening = true;
            this.wakeRec.start();
            this._setButtonActive(true);
            this._showTransientNotice('Voice assistant active');
            console.debug('VoiceAssistant start() called');
            if (this.debugEl) this._appendDebug('started listening');
        } catch (e) {
            console.warn('Could not start wake recognition', e);
            if (this.debugEl) this._appendDebug('start failed: ' + String(e));
        }
    }

    stop() {
        if (!this.wakeRec || !this.listening) return;
        this.listening = false;
        try { this.wakeRec.stop(); } catch (e) {}
        this._setButtonActive(false);
        this._showTransientNotice('Voice assistant stopped');
        console.debug('VoiceAssistant stop() called');
        if (this.debugEl) this._appendDebug('stopped listening');
    }

    toggle() {
        if (this.listening) this.stop(); else this.start();
    }

    // Programmatically trigger the wake flow (useful for a button)
    async wake() {
        try {
            // If wake recognizer is running, temporarily stop it to avoid interference
            try { if (this.wakeRec && this.listening) this.wakeRec.stop(); } catch (e) {}
            await this.onWake();
        /*
          VoiceAssistant - simple voice-driven assistant using Web Speech API.
          - Listens for wake word "wake up" (or "hey jarvis") in continuous background. 
          - On wake, prompts the user (TTS) and listens for a single command.
          - Sends the command to the AI service (via customPrompt) with optional selected code context.                                                                   - Speaks the AI response and displays it in the UI. Offers to apply code fixes
         if response contains a code block.                                              
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
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeec
        hRecognition;                                                                           if (!SpeechRecognition) {
                    console.warn('SpeechRecognition not supported in this browser. Voice
         assistant disabled.');                                                                     return;
                }

                this.SpeechRecognition = SpeechRecognition;

                // Wake recognizer (continuous)
                this.wakeRec = new SpeechRecognition();
                this.wakeRec.continuous = true;
                this.wakeRec.interimResults = false;
                this.wakeRec.lang = 'en-US';

                this.wakeRec.onresult = (e) => {
                    let transcript = '';
                    for (let i = e.resultIndex; i < e.results.length; ++i) transcript +=
         e.results[i][0].transcript;                                                                transcript = transcript.trim().toLowerCase();
                    if (transcript.includes('wake up') || transcript.includes('wakeup') 
        || transcript.includes('hey jarvis')) {                                                         this.onWake();
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
                        for (let i = e.resultIndex; i < e.results.length; ++i) transcrip
        t += e.results[i][0].transcript;                                                                transcript = transcript.trim();
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
                if (lower.includes('run code') || lower.includes('execute') || lower.inc
        ludes('run this')) {                                                                        this.speak('Running the code now');
                    try { window.AI_IDE_App?.simpleExecutor?.executeCode(); } catch (e) 
        {}                                                                                          return;
                }

                // Otherwise send to AI as a coding query. Provide selected code context
         if available.                                                                          const language = this.editor.currentLanguage;
                let code = '';
                try { code = this.editor.getSelectedText() || ''; } catch (e) { code = '
        '; }                                                                            
                this.speak('Let me think about that');
                try {
                    const prompt = transcript;
                    const response = await this.aiService.customPrompt(prompt, code, lan
        guage);                                                                                     this.lastResponse = response;
                    // display in UI
                    try { this.actionManager.displayResponse(response); } catch (e) {}  

                    // speak a short summary (first 250 chars)
                    const plain = (typeof response === 'string') ? response.replace(/```
        [\s\S]*?```/g, '') : String(response);                                                      const speakText = plain.length > 300 ? plain.slice(0, 300) + '... (s
        ee UI for full response)' : plain;                                                          this.speak(speakText);

                    // If the response contains a code block, offer to apply it
                    if (/```[\s\S]*?```/.test(response)) {
                        this.speak('I found a suggested code change. Would you like me t
        o apply it? Say yes or no.');                                                                   // listen for yes/no
                        const confirmed = await this._listenForYesNo();
                        if (confirmed) {
                            try {
                                const applied = this.actionManager.tryApplyFixesFromResp
        onse(response, language);                                                                               if (applied) this.speak('Applied the suggested changes')
        ; else this.speak('I could not apply the changes');                                                 } catch (e) { this.speak('Failed to apply changes'); }      
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
                        for (let i = e.resultIndex; i < e.results.length; ++i) transcrip
        t += e.results[i][0].transcript;                                                                transcript = transcript.trim().toLowerCase();
                        handled = true;
                        resolve(transcript.includes('y') || transcript.includes('yes') ||
        | transcript.includes('apply'));
                    };
                    rec.onerror = () => resolve(false);
                    rec.onend = () => { if (!handled) resolve(false); };
                    try { rec.start(); } catch (e) { resolve(false); }
                });
            }
        }

        window.VoiceAssistant = VoiceAssistant;
