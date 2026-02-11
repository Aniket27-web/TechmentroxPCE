import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("xxxxxxxx") || process.env.GEMINI_API_KEY === "your-gemini-api-key-here") {
    console.warn("\n⚠️  WARNING: Set GEMINI_API_KEY in backend/.env for AI features to work.");
    console.warn("   Get a free key at https://aistudio.google.com/apikey\n");
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
