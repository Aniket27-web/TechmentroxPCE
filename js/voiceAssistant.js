class VoiceAssistant {
    constructor(aiService, editor, actionManager) {
        this.aiService = aiService;
        this.editor = editor;
        this.actionManager = actionManager;

        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.synth = window.speechSynthesis;

        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.isProcessing = false;

        // 🔥 Persistent memory
        this.memory = {
            conversation: [],
            projectFacts: [],
            lastFile: null
        };

        this.voiceNotice = document.getElementById('voice-notice');
        this.voiceDebug = document.getElementById('voice-debug');
        this.orb = document.getElementById('jarvis-orb');

        this.init();
    }

    /* ---------------- INIT ---------------- */

    init() {
        if (!this.SpeechRecognition) {
            console.warn("Speech recognition not supported");
            return;
        }

        this.recognition = new this.SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.lang = "en-IN";
        this.recognition.interimResults = false;

        this.recognition.onresult = (e) => this.onSpeech(e);
        this.recognition.onend = () => {
            if (this.isListening) {
                try { this.recognition.start(); } catch {}
            }
        };

        // 🔥 Auto detect runtime errors
        window.addEventListener("error", (e) => {
            this.speak("Alert. Code error detect hua hai.");
        });

        this.debug("Jarvis God Mode Initialized");
    }

    /* ---------------- CONTROL ---------------- */

    start() {
        if (this.isListening) return;
        this.isListening = true;
        this.recognition.start();
        this.notice("Jarvis Active");
        this.animateOrb(true);
        this.speak("Hello. Jarvis online. Ready when you are.");
    }

    stop() {
        this.isListening = false;
        try { this.recognition.stop(); } catch {}
        this.animateOrb(false);
        this.speak("Going offline.");
    }

    /* ---------------- SPEECH INPUT ---------------- */

    async onSpeech(event) {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.trim();
        if (!text) return;

        this.debug("User: " + text);

        // interrupt speech
        if (this.isSpeaking) {
            this.synth.cancel();
            this.isSpeaking = false;
        }

        await this.processConversation(text);
    }

    /* ---------------- CONVERSATION ENGINE ---------------- */

    async processConversation(userText) {

        // store memory
        this.memory.conversation.push({ role: "user", content: userText });

        const code = this.editor.getValue?.() || "";
        const language = this.editor.currentLanguage || "unknown";

        // detect emotion tone
        const tone = /urgent|jaldi|fast|quick/i.test(userText)
            ? "urgent"
            : "calm";

        this.speak(tone === "urgent" ? "Working on it immediately." : "Let me check.");

        const context = this.memory.conversation.slice(-6)
            .map(m => `${m.role}: ${m.content}`).join("\n");

        const projectFacts = this.memory.projectFacts.join("\n");

        const prompt = `
You are Jarvis from Iron Man.
Speak like a calm, intelligent assistant in Hinglish.

Tone: ${tone}

Project facts:
${projectFacts}

Conversation:
${context}

Current code:
${code}

User: ${userText}
`;

        try {
            const response = await this.aiService.customPrompt(prompt, code, language);

            this.memory.conversation.push({ role: "assistant", content: response });

            // store project info automatically
            if (/this project|we are building|app uses/i.test(response)) {
                this.memory.projectFacts.push(response.slice(0,200));
            }

            this.actionManager.displayResponse?.(response);

            const plain = response.replace(/```[\s\S]*?```/g, "");
            this.speak(plain.slice(0, 320));

        } catch (err) {
            console.error(err);
            this.speak("Something went wrong. Please check the system.");
        }
    }

    /* ---------------- SPEECH OUTPUT ---------------- */

    speak(text) {
        if (!this.synth || !text) return;

        const utter = new SpeechSynthesisUtterance(text);

        // Jarvis tone
        utter.rate = 0.9;
        utter.pitch = 0.8;
        utter.volume = 1;

        const voices = this.synth.getVoices();
        let voice =
            voices.find(v => /en-GB/i.test(v.lang)) ||
            voices.find(v => /en-IN/i.test(v.lang)) ||
            voices[0];

        if (voice) utter.voice = voice;

        this.synth.cancel();
        this.synth.speak(utter);

        this.isSpeaking = true;
        utter.onend = () => this.isSpeaking = false;
    }

    /* ---------------- UI HELPERS ---------------- */

    animateOrb(active) {
        if (!this.orb) return;
        this.orb.classList.toggle("active", active);
    }

    notice(text) {
        if (!this.voiceNotice) return;
        this.voiceNotice.innerText = text;
        this.voiceNotice.classList.add("active");
        setTimeout(() => this.voiceNotice.classList.remove("active"), 3000);
    }

    debug(msg) {
        if (!this.voiceDebug) return;
        const line = document.createElement("div");
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.voiceDebug.prepend(line);
    }
}

window.VoiceAssistant = VoiceAssistant;
