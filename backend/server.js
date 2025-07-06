const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

console.log("🔐 Loaded API Key:", process.env.OPENROUTER_API_KEY?.slice(0, 10) + '...');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// -------------------- Routes --------------------

// General Chat (fallback/default)
app.post('/api/chat', async (req, res) => {
  const { message, model = 'mistralai/mistral-7b-instruct' } = req.body;
  if (!message || message.trim() === "") return res.status(400).json({ error: 'Message is required' });

  try {
    console.log("📨 Sending /api/chat request to OpenRouter...");

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'My Ai App'
      }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("❌ AI Chat Request Failed:", error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Analyze PDF
app.post('/api/analyze-pdf', upload.single('file'), async (req, res) => {
  const { model } = req.body;

  try {
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;
    const result = await analyzeTextWithAI(extractedText, model);
    res.json(result);
  } catch (error) {
    console.error("❌ PDF Analysis Error:", error.message);
    res.status(500).json({ error: 'Failed to analyze PDF feedback' });
  }
});

// Analyze CSV
app.post('/api/analyze-csv', upload.single('file'), async (req, res) => {
  const { model } = req.body;

  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').slice(1);
    const text = lines.map(row => row.split(',')[1]).join('\n');
    const result = await analyzeTextWithAI(text, model);
    res.json(result);
  } catch (err) {
    console.error("❌ CSV Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze CSV feedback' });
  }
});

// Analyze Google Sheet
app.post('/api/analyze-sheet', async (req, res) => {
  const { sheetUrl, model } = req.body;
  try {
    const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
    if (!publicId) throw new Error("Invalid Google Sheet link");
    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    const response = await axios.get(csvUrl);
    const lines = response.data.split('\n');

    const feedbackText = lines.slice(1).map(row => {
      const cols = row.split(',');
      const deliveryRating = cols[4]?.trim();
      const timely = cols[5]?.trim();
      const trial = cols[6]?.trim();
      const checkBefore = cols[7]?.trim();
      const suggestion = cols[8]?.trim();
      const reviewSupport = cols[9]?.trim();
      return `Rating: ${deliveryRating}, Timely: ${timely}, Trial: ${trial}, Checked: ${checkBefore}, Suggestion: ${suggestion}, Google Review: ${reviewSupport}`;
    }).filter(Boolean).join('\n');

    const result = await analyzeTextWithAI(feedbackText, model);
    res.json(result);

  } catch (err) {
    console.error("❌ Sheet Analysis Failed:", err.message);
    res.status(500).json({ error: 'Failed to analyze sheet feedback' });
  }
});

// Analyze raw text
app.post('/api/analyze-text', async (req, res) => {
  const { text, model } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = await analyzeTextWithAI(text, model);
    res.json(result);
  } catch (err) {
    console.error("❌ Text Analysis Failed:", err.message);
    res.status(500).json({ error: 'Failed to analyze text feedback' });
  }
});

// -------------------- Core AI Logic --------------------

async function analyzeTextWithAI(inputText, model = 'mistralai/mistral-7b-instruct') {
  const prompt = `
You are a customer experience expert for a luxury bridal rental brand.

Analyze the following customer feedback:
"""
${inputText}
"""

If there are any negative reviews or pain points:
1. List the 2–3 most common issues raised by customers.
2. Explain the likely reasons these problems are occurring.
3. Provide 3–5 actionable, specific solutions to fix those problems.

If the feedback is mostly positive or generic:
- Say: "No major issues detected. Feedback appears mostly positive or neutral."
- Still give 2 suggestions for improving the customer experience.

Return only valid JSON in this format:
{
  "mainIssues": [...],
  "rootCauses": [...],
  "actionPlan": [...]
}
`;

  try {
    console.log(`📨 Sending request to OpenRouter using model: ${model}`);

    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Feedback Analyzer'
      }
    });

    const raw = aiResponse.data.choices[0].message.content;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("⚠️ Raw AI Response:", raw);
      return { error: "AI returned invalid format. Please refine the input or prompt." };
    }
  } catch (error) {
    console.error("❌ AI Request Failed:", error.response?.data || error.message);
    return { error: 'Failed to connect to AI service.' };
  }
}

// -------------------- Start Server --------------------
const PORT = 5000;
app.listen(PORT, () => {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY is missing — check .env file or Render environment settings");
  }
  console.log(`✅ Server running at http://localhost:${PORT}`);
});




