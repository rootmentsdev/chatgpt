// ✅ BACKEND: server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
if (!OPENROUTER_API_KEY) {
  console.error("\u274C OPENROUTER_API_KEY is missing.");
}
console.log("\ud83d\udd10 Loaded API Key:", OPENROUTER_API_KEY?.slice(0, 10) + '...');

// CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// 🔁 General Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: message }]
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'My Ai App'
      }
    });

    const reply = response.data.choices[0].message.content;
    const usage = response.data.usage || {};
    res.json({
      reply,
      tokenUsage: {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      }
    });
  } catch (error) {
    console.error("\u274C Chat Request Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ✂️ Common AI Tag Extraction Function
async function extractSuggestionTags(text) {
  const prompt = `
You're an AI assistant. From this feedback data, extract a list of topics the user might want to explore:
Examples: ["Find positive reviews", "Find negative reviews", "Check staff complaints", "Count customers without negative feedback"]

Feedback:
"""
${text}
"""

Return only a JSON array.
`;

  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'mistralai/mistral-7b-instruct',
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const raw = response.data.choices[0].message.content;

  // 🛠 Extract the first valid JSON array from the string
  const match = raw.match(/\[\s*("[^"]*"\s*,?\s*)+\]/s);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      console.error("❌ JSON parse failed:", e.message);
      return [];
    }
  } else {
    console.warn("⚠️ No valid JSON array found in:", raw);
    return [];
  }
}


// 📊 CSV Feedback - Suggestion Tags
app.post('/api/extract-tags-csv', upload.single('file'), async (req, res) => {
  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').slice(1);
    const text = lines.map(row => row.split(',')[1]).join('\n');
    const suggestions = await extractSuggestionTags(text);
    res.json({ suggestions, rawText: text });
  } catch (err) {
    console.error("\u274C Tag CSV Error:", err.message);
    res.status(500).json({ error: 'Failed to extract suggestion tags from CSV' });
  }
});

// 📊 Google Sheet Feedback - Suggestion Tags
app.post('/api/extract-tags-sheet', async (req, res) => {
  const { sheetUrl } = req.body;
  try {
    const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
    if (!publicId) throw new Error("Invalid Google Sheet link");
    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    const response = await axios.get(csvUrl);
    const lines = response.data.split('\n');
    const feedbackText = lines.slice(1).map(row => row.split(',')[4]?.trim()).filter(Boolean).join('\n');
    const suggestions = await extractSuggestionTags(feedbackText);
    res.json({ suggestions, rawText: feedbackText });
  } catch (err) {
    console.error("\u274C Tag Sheet Error:", err.message);
    res.status(500).json({ error: 'Failed to extract suggestion tags from sheet' });
  }
});

// 🔍 Multi-action deep analysis
app.post('/api/multi-analysis', async (req, res) => {
  const { actions, rawText } = req.body;
  if (!actions?.length || !rawText) return res.status(400).json({ error: 'Actions and raw text required' });

  const prompt = `You are analyzing bridal rental feedback.\nHere are the tasks:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nUse this feedback:\n"""\n${rawText}\n"""\n\nFor each action, give summary, common reasons, and suggestions.`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ response: response.data.choices[0].message.content });
  } catch (err) {
    console.error("\u274C Multi-Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze actions' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\u2705 Server running at http://localhost:${PORT}`);
});