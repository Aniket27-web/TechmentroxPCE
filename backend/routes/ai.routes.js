import express from "express";
import { callGemini } from "../services/gemini.service.js";

const router = express.Router();

router.post("/explain", async (req, res) => {
    try {
        const { code, language } = req.body;
        const prompt = `Explain the following ${language} code:\n\n${code}`;
        const result = await callGemini(prompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/debug", async (req, res) => {
    try {
        const { code, language } = req.body;
        const prompt = `Find bugs in this ${language} code and suggest fixes:\n\n${code}`;
        const result = await callGemini(prompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/generate", async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const finalPrompt = `Generate ${language} code for the following request:\n\n${prompt}`;
        const result = await callGemini(finalPrompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/optimize", async (req, res) => {
    try {
        const { code, language } = req.body;
        const prompt = `Optimize the following ${language} code:\n\n${code}`;
        const result = await callGemini(prompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/custom", async (req, res) => {
    try {
        const { prompt, code, language } = req.body;
        const fullPrompt = code
            ? `${prompt}\n\nRelevant code (${language}):\n${code}`
            : prompt;
        const result = await callGemini(fullPrompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
