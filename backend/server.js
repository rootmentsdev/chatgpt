


const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();
console.log("🔐 Loaded API Key:", process.env.OPENROUTER_API_KEY); 

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// General chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatgpt-zeta-hazel.vercel.app',
        'X-Title': 'My AI App'
      }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Analyze PDF
app.post('/api/analyze-pdf', upload.single('file'), async (req, res) => {
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;
    const result = await analyzeTextWithAI(extractedText);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze PDF feedback' });
  }
});

// Analyze CSV
app.post('/api/analyze-csv', upload.single('file'), async (req, res) => {
  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').slice(1);
    const text = lines.map(row => row.split(',')[1]).join('\n');
    const result = await analyzeTextWithAI(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze CSV feedback' });
  }
});

// Analyze Google Sheet (extended)
app.post('/api/analyze-sheet', async (req, res) => {
  const { sheetUrl } = req.body;
  try {
    const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
    if (!publicId) throw new Error("Invalid Google Sheet link");
    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    const response = await axios.get(csvUrl);
    const lines = response.data.split('\n');
    const headers = lines[0].split(',');

    // Extract feedback columns
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

    const result = await analyzeTextWithAI(feedbackText);
    res.json(result);

  } catch (err) {
    console.error("❌ Sheet Analysis Failed:", err.message);
    res.status(500).json({ error: 'Failed to analyze sheet feedback' });
  }
});

// Analyze raw paragraph
app.post('/api/analyze-text', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  try {
    const result = await analyzeTextWithAI(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze text feedback' });
  }
});

// Core logic: AI prompt
async function analyzeTextWithAI(inputText) {
  const prompt = `
You are an assistant for a premium bridal rental brand.

Carefully read the following customer feedback:
"""
${inputText}
"""

If you find any negative or repetitive concerns, then:

1. List 2 specific problems customers mentioned
2. Explain why those problems may be happening
3. Give 3–5 clear action steps to fix them

If the feedback is mostly positive or generic, say:
- "No major issues detected. Most feedback appears positive or neutral."
- Also give 2 suggestions to improve the store experience

Respond only in JSON format:
{
  "mainIssues": [...],
  "rootCauses": [...],
  "actionPlan": [...]
}
`;

  try {
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatgpt-zeta-hazel.vercel.app',
        'X-Title': 'Feedback Analyzer'
      },
    });

    const raw = aiResponse.data.choices[0].message.content;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("⚠️ Raw AI Response:", raw);
      return { error: "AI returned invalid format. Please refine the input or prompt." };
    }
  } catch (error) {
    console.error("❌ AI Request Failed:", error.message);
    return { error: 'Failed to connect to AI service.' };
  }
}

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
