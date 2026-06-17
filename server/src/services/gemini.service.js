import { GoogleGenerativeAI } from '@google/generative-ai';
import { COMPLAINT_CATEGORIES } from '../models/complaint.model.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel() {
    return genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
}

function safeParseJSON(text) {
    try {
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return null;
    }
}

export async function classifyComplaint(description) {
    const fallback = { category: 'Other', confidence: 0 };
    if (!process.env.GEMINI_API_KEY) return fallback;

    try {
        const model = getModel();
        const prompt = `
You are a civic issue classifier. Given the complaint description below,
return ONLY a JSON object (no markdown, no extra text):
{
  "category": "<one of: ${COMPLAINT_CATEGORIES.join(', ')}>",
  "confidence": <float 0.0–1.0>
}

Complaint: "${description}"
`.trim();

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = safeParseJSON(text);

        if (parsed?.category && COMPLAINT_CATEGORIES.includes(parsed.category)) {
            return {
                category: parsed.category,
                confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.7)),
            };
        }
        return fallback;
    } catch (err) {
        console.warn('[Gemini] classifyComplaint failed:', err.message);
        return fallback;
    }
}

export async function scoreSeverity(imageUrl) {
    const fallback = { severity: 5, reason: 'AI scoring unavailable' };
    if (!process.env.GEMINI_API_KEY || !imageUrl) return fallback;

    try {
        const model = getModel();
        const prompt = `
You are a civic infrastructure assessor. Look at this image of a civic issue
and return ONLY a JSON object (no markdown):
{
  "severity": <integer 1–10>,
  "reason": "<one sentence explaining the score>"
}

Scoring guide:
1–3: Minor cosmetic issue, no immediate risk
4–6: Moderate — affects daily use, needs attention soon
7–9: Serious — safety risk or large-scale damage
10 : Emergency — immediate danger to life or property

Return severity 5 if you cannot determine the issue from the image.
`.trim();

        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = response.headers.get('content-type') ?? 'image/jpeg';

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType, data: base64 } },
        ]);

        const text = result.response.text();
        const parsed = safeParseJSON(text);

        if (parsed?.severity && parsed.severity >= 1 && parsed.severity <= 10) {
            return {
                severity: Math.round(parsed.severity),
                reason: parsed.reason ?? '',
            };
        }
        return fallback;
    } catch (err) {
        console.warn('[Gemini] scoreSeverity failed:', err.message);
        return fallback;
    }
}

export async function generateTitle(description) {
    if (!process.env.GEMINI_API_KEY) {
        return description.slice(0, 80);
    }

    try {
        const model = getModel();
        const prompt = `
Create a short, factual title (max 10 words) for this civic complaint.
Return ONLY the title text — no quotes, no punctuation at the end.

Complaint: "${description}"
`.trim();

        const result = await model.generateContent(prompt);
        const title = result.response.text().trim().slice(0, 120);
        return title || description.slice(0, 80);
    } catch (err) {
        console.warn('[Gemini] generateTitle failed:', err.message);
        return description.slice(0, 80);
    }
}

export async function checkDuplicateText(newDesc, existingDesc) {
    if (!process.env.GEMINI_API_KEY) {
        return { isDuplicate: false, similarity: 0 };
    }

    try {
        const model = getModel();
        const prompt = `
Are these two civic complaints describing the same physical issue?
Return ONLY JSON (no markdown):
{
  "isDuplicate": <true|false>,
  "similarity": <float 0.0–1.0>
}

Complaint A: "${newDesc}"
Complaint B: "${existingDesc}"
`.trim();

        const result = await model.generateContent(prompt);
        const parsed = safeParseJSON(result.response.text());

        return {
            isDuplicate: parsed?.isDuplicate === true,
            similarity: parsed?.similarity ?? 0,
        };
    } catch (err) {
        console.warn('[Gemini] checkDuplicateText failed:', err.message);
        return { isDuplicate: false, similarity: 0 };
    }
}
