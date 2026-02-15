class VoiceAssistant {
    constructor(aiService, editor, actionManager) {
        this.aiService = aiService;
        this.editor = editor;
        this.actionManager = actionManager;

        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;

        this.memory = {
            conversation: [],
            architecture: []
        };

        this.personality = "serious";

        this.noticeEl = document.getElementById("voice-notice");
        this.panel = document.getElementById("jarvis-panel");

        this.init();
    }

    /* ---------------- INIT ---------------- */

    init() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn("SpeechRecognition not supported");
            return;
        }

        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.lang = "en-US";
        this.recognition.interimResults = false;

        this.recognition.onresult = e => this.onSpeech(e);
        this.recognition.onend = () => {
            if (this.isListening) {
                try { this.recognition.start(); } catch {}
            }
        };

        // runtime error detection
        window.addEventListener("error", err => {
            this.speak("I detected a runtime error.");
            this.autoFix(err.message);
        });

        // auto explain after typing stops
        if (this.editor?.onDidChangeModelContent) {
            let t;
            this.editor.onDidChangeModelContent(() => {
                clearTimeout(t);
                t = setTimeout(() => this.autoExplain(), 2500);
            });
        }

        console.log("Jarvis ready");
    }

    /* ---------------- CONTROL ---------------- */

    start() {
        if (this.isListening || !this.recognition) return;
        this.isListening = true;
        this.recognition.start();
        this.notice("Jarvis listening");
        this.speak("Jarvis online.");
    }

    stop() {
        this.isListening = false;
        try { this.recognition.stop(); } catch {}
        this.speak("Jarvis offline.");
    }

    toggle() {
        this.isListening ? this.stop() : this.start();
    }

    /* ---------------- SPEECH INPUT ---------------- */

    async onSpeech(event) {
        const text = event.results[event.results.length - 1][0].transcript.trim();
        if (!text) return;

        if (this.isSpeaking) speechSynthesis.cancel();

        // personality switch
        if (/friendly mode/i.test(text)) return this.setPersonality("friendly");
        if (/hacker mode/i.test(text)) return this.setPersonality("hacker");
        if (/serious mode/i.test(text)) return this.setPersonality("serious");

        await this.askAI(text);
    }

    /* ---------------- PERSONALITY ---------------- */

    setPersonality(mode) {
        this.personality = mode;
        this.speak("Personality switched to " + mode);
    }

    personalityPrompt() {
        return {
            serious: "You are a professional AI assistant.",
            hacker: "You are a sharp technical AI assistant.",
            friendly: "You are a friendly helpful AI assistant."
        }[this.personality];
    }

    /* ---------------- AI CONVERSATION ---------------- */

    async askAI(text) {
        this.memory.conversation.push(text);

        const code = this.editor?.getValue?.() || "";

        const prompt = `
${this.personalityPrompt()}
Explain clearly and briefly.

User: ${text}
Code:
${code}
`;

        try {
            const res = await this.aiService.customPrompt(prompt, code, this.editor.currentLanguage);
            this.actionManager.displayResponse?.(res);

            const clean = res.replace(/```[\s\S]*?```/g, "");
            this.speak(clean.slice(0,250));

            // architecture learning
            if (/function|class|module|api/i.test(res)) {
                this.memory.architecture.push(res.slice(0,120));
                this.updatePanel();
            }

        } catch {
            this.speak("I couldn't process that.");
        }
    }

    /* ---------------- AUTO EXPLAIN ---------------- */

    async autoExplain() {
        const code = this.editor?.getValue?.();
        if (!code || code.length < 30) return;

        const res = await this.aiService.customPrompt(
            "Explain this code briefly.",
            code,
            this.editor.currentLanguage
        );

        const clean = res.replace(/```[\s\S]*?```/g, "");
        this.speak(clean.slice(0,180));
    }

    /* ---------------- AUTO BUG FIX ---------------- */

    async autoFix(errorMsg) {
        const code = this.editor?.getValue?.();
        if (!code) return;

        const res = await this.aiService.customPrompt(
            "Fix this error and return corrected code only:\n" + errorMsg,
            code,
            this.editor.currentLanguage
        );

        if (/```/.test(res)) {
            const fixed = res.replace(/```[\w]*|```/g, "");
            this.editor.setValue(fixed);
            this.speak("I fixed the issue.");
        }
    }

    /* ---------------- SPEECH OUTPUT ---------------- */

    speak(text) {
        if (!text) return;
        const u = new SpeechSynthesisUtterance(text);
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        this.isSpeaking = true;
        u.onend = () => this.isSpeaking = false;
    }

    /* ---------------- UI ---------------- */

    notice(msg) {
        if (!this.noticeEl) return;
        this.noticeEl.innerText = msg;
    }

    updatePanel() {
        if (!this.panel) return;
        this.panel.innerHTML =
            "<b>Project Architecture</b><br>" +
            this.memory.architecture.map(x => "• " + x).join("<br>");
    }
}

window.VoiceAssistant = VoiceAssistant;
