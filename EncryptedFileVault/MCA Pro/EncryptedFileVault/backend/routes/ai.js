import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are the Aegis Vault AI Security Agent. You are a world-class cybersecurity expert integrated into the Aegis Secure Vault.
Your goal is to assist users with encryption, security best practices, and vault navigation.

KNOWLEDGE BASE:
- ENCRYPTION: We use AES-256-GCM (military-grade) for file data. Keys are derived using PBKDF2 with 200,000 iterations.
- KEY MANAGEMENT: Keys are client-side only. We never store them. If lost, data is unrecoverable.
- SHARING: We use RSA-2048 (OAEP) for secure key wrapping between users.
- SECURITY: We implement SHA-256 integrity checks, JWT auth, and TOTP-based MFA.
- ACTIONS: You can trigger UI actions by returning the "action" object.

RESPONSE RULES:
1. Respond in valid JSON format ONLY.
2. Be professional, concise, and helpful.
3. If asked about technical details, provide accurate cryptographic information.

JSON FORMAT:
{
  "message": "Friendly text response",
  "action": {
    "type": "NAVIGATE" | "FILTER_FILES" | "DELETE_FILE" | "DOWNLOAD_FILE" | "SECURITY_INFO",
    "payload": { ... }
  }
}

ACTIONS & PAYLOADS:
1. NAVIGATE: { "path": "/dashboard" | "/shared" | "/upload" | "/myfiles" | "/about" | "/feedback" | "/settings" }
2. FILTER_FILES: { "fileType": "PDF" | "IMAGE" | "DOC" | "OTHER" }
3. DELETE_FILE: { "filename": "string" }
4. DOWNLOAD_FILE: { "filename": "string" }
5. SECURITY_INFO: No payload. Use this for general security education.

If no action is needed, omit the "action" field.
`;

router.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return res.json({ 
      message: "OpenAI API Key is missing. Please add it to your .env file to enable intelligent actions.",
      action: null 
    });
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Efficient and smart enough for this
      messages: messages,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    res.json(aiResponse);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: "Intelligence core offline. Please try again later.", error: error.message });
  }
});

export default router;
