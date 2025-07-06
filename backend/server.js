



// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const multer = require('multer');
// const pdfParse = require('pdf-parse');
// require('dotenv').config();

// const app = express();
// const upload = multer({ storage: multer.memoryStorage() });

// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
// if (!OPENROUTER_API_KEY) {
//   console.error("❌ OPENROUTER_API_KEY is missing.");
// }
// console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY?.slice(0, 10) + '...');

// // CORS setup
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
//   methods: ['GET', 'POST'],
//   credentials: true
// }));
// app.use(express.json());

// // 🔁 General Chat Endpoint
// app.post('/api/chat', async (req, res) => {
//   const { message, model } = req.body;

//   if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
//   if (!model?.trim()) return res.status(400).json({ error: 'Model is required' });

//   try {
//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model,
//       messages: [{ role: "user", content: message }],
//     }, {
//       headers: {
//         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'My Ai App',
//       }
//     });

//     const reply = response.data.choices[0].message.content;
//     const usage = response.data.usage || {};
//     res.json({
//       reply,
//       tokenUsage: {
//         prompt: usage.prompt_tokens || 0,
//         completion: usage.completion_tokens || 0,
//         total: usage.total_tokens || 0
//       }
//     });
//   } catch (error) {
//     console.error("❌ Chat Request Error:", error.response?.data || error.message);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });

// // 📄 Analyze PDF Feedback
// app.post('/api/analyze-pdf', upload.single('file'), async (req, res) => {
//   try {
//     const pdfData = await pdfParse(req.file.buffer);
//     const extractedText = pdfData.text;
//     const result = await analyzeTextWithAI(extractedText);
//     res.json(result);
//   } catch (error) {
//     console.error("❌ PDF Analysis Error:", error.message);
//     res.status(500).json({ error: 'Failed to analyze PDF feedback' });
//   }
// });

// // 📊 Analyze CSV Feedback
// app.post('/api/analyze-csv', upload.single('file'), async (req, res) => {
//   try {
//     const csvContent = req.file.buffer.toString();
//     const lines = csvContent.split('\n').slice(1);
//     const text = lines.map(row => row.split(',')[1]).join('\n');
//     const result = await analyzeTextWithAI(text);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ CSV Analysis Error:", err.message);
//     res.status(500).json({ error: 'Failed to analyze CSV feedback' });
//   }
// });

// // 📄 Analyze Google Sheet Feedback
// app.post('/api/analyze-sheet', async (req, res) => {
//   const { sheetUrl } = req.body;

//   try {
//     const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
//     if (!publicId) throw new Error("Invalid Google Sheet link");

//     const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
//     const response = await axios.get(csvUrl);
//     const lines = response.data.split('\n');

//     const feedbackText = lines.slice(1).map(row => {
//       const cols = row.split(',');
//       const deliveryRating = cols[4]?.trim();
//       const timely = cols[5]?.trim();
//       const trial = cols[6]?.trim();
//       const checkBefore = cols[7]?.trim();
//       const suggestion = cols[8]?.trim();
//       const reviewSupport = cols[9]?.trim();
//       return `Rating: ${deliveryRating}, Timely: ${timely}, Trial: ${trial}, Checked: ${checkBefore}, Suggestion: ${suggestion}, Google Review: ${reviewSupport}`;
//     }).filter(Boolean).join('\n');

//     const result = await analyzeTextWithAI(feedbackText);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ Sheet Analysis Error:", err.message);
//     res.status(500).json({ error: 'Failed to analyze sheet feedback' });
//   }
// });

// // ✍️ Analyze Raw Text Feedback
// app.post('/api/analyze-text', async (req, res) => {
//   const { text } = req.body;
//   if (!text) return res.status(400).json({ error: 'Text is required' });

//   try {
//     const result = await analyzeTextWithAI(text);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ Text Analysis Error:", err.message);
//     res.status(500).json({ error: 'Failed to analyze text feedback' });
//   }
// });

// // 🤖 Core AI Analysis Function (Returns JSON + Token Usage)
// async function analyzeTextWithAI(inputText) {
//   const prompt = `
// You are an assistant for a premium bridal rental brand.

// Carefully read the following customer feedback:
// """
// ${inputText}
// """

// If you find any negative or repetitive concerns, then:

// 1. List 2 specific problems customers mentioned
// 2. Explain why those problems may be happening
// 3. Give 3–5 clear action steps to fix them

// If the feedback is mostly positive or generic, say:
// - "No major issues detected. Most feedback appears positive or neutral."
// - Also give 2 suggestions to improve the store experience

// Respond only in JSON format:
// {
//   "mainIssues": [...],
//   "rootCauses": [...],
//   "actionPlan": [...]
// }
// `;

//   try {
//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'mistralai/mistral-7b-instruct',
//       messages: [{ role: "user", content: prompt }],
//     }, {
//       headers: {
//         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'Feedback Analyzer'
//       }
//     });

//     const raw = response.data.choices[0].message.content;
//     const usage = response.data.usage || {};

//     try {
//       const parsed = JSON.parse(raw);
//       return {
//         ...parsed,
//         tokenUsage: {
//           prompt: usage.prompt_tokens || 0,
//           completion: usage.completion_tokens || 0,
//           total: usage.total_tokens || 0
//         }
//       };
//     } catch (err) {
//       console.error("⚠️ AI returned non-JSON:", raw);
//       return { error: "AI returned invalid format. Please refine the input or prompt." };
//     }

//   } catch (error) {
//     console.error("❌ AI Request Error:", error.response?.data || error.message);
//     return { error: 'Failed to connect to AI service.' };
//   }
// }

// // 🚀 Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });

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
  console.error("❌ OPENROUTER_API_KEY is missing.");
}
console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY?.slice(0, 10) + '...');

// CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// 🔁 General Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, model } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  if (!model?.trim()) return res.status(400).json({ error: 'Model is required' });

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'My Ai App',
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
    console.error("❌ Chat Request Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// 📄 Analyze PDF Feedback
app.post('/api/analyze-pdf', upload.single('file'), async (req, res) => {
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;
    const result = await analyzeTextWithAI(extractedText);
    res.json(result);
  } catch (error) {
    console.error("❌ PDF Analysis Error:", error.message);
    res.status(500).json({ error: 'Failed to analyze PDF feedback' });
  }
});

// 📊 Analyze CSV Feedback
app.post('/api/analyze-csv', upload.single('file'), async (req, res) => {
  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').slice(1);
    const text = lines.map(row => row.split(',')[1]).join('\n');
    const result = await analyzeTextWithAI(text);
    res.json(result);
  } catch (err) {
    console.error("❌ CSV Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze CSV feedback' });
  }
});

// 📄 Analyze Google Sheet Feedback
app.post('/api/analyze-sheet', async (req, res) => {
  const { sheetUrl } = req.body;

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

    const result = await analyzeTextWithAI(feedbackText);
    res.json(result);
  } catch (err) {
    console.error("❌ Sheet Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze sheet feedback' });
  }
});

// ✍️ Analyze Raw Text Feedback
app.post('/api/analyze-text', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = await analyzeTextWithAI(text);
    res.json(result);
  } catch (err) {
    console.error("❌ Text Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze text feedback' });
  }
});

// 🧠 Suggestion Extractor (Page 1)
app.post('/api/extract-suggestions', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const prompt = `
You are a smart assistant. Read the following customer feedback and suggest 3–5 areas the AI can help with.

Only return a JSON array like:
["Card payment issue", "Delivery delay", "Trial experience", "Staff behaviour"]

Feedback:
"""
${text}
"""
`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const raw = response.data.choices[0].message.content;

    try {
      const parsed = JSON.parse(raw);
      res.json({ suggestions: parsed });
    } catch {
      res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("❌ Suggestion AI Error:", error.message);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// 🔍 Deep Analysis on Click (Page 2)
app.post('/api/deep-analysis', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  const prompt = `
You're a retail business consultant. Explain this issue in detail for a bridal rental store: "${topic}"

Please include:
1. Why this issue happens
2. How it affects business
3. 3–5 steps to fix or improve it

Respond in plain text.
`;

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

    const content = response.data.choices[0].message.content;
    res.json({ response: content });
  } catch (error) {
    console.error("❌ Deep Analysis Error:", error.message);
    res.status(500).json({ error: 'Failed to analyze topic in depth' });
  }
});

// 🤖 Core AI Analysis Function (Used by PDF/CSV/Sheet/Text)
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
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Feedback Analyzer'
      }
    });

    const raw = response.data.choices[0].message.content;
    const usage = response.data.usage || {};

    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        tokenUsage: {
          prompt: usage.prompt_tokens || 0,
          completion: usage.completion_tokens || 0,
          total: usage.total_tokens || 0
        }
      };
    } catch (err) {
      console.error("⚠️ AI returned non-JSON:", raw);
      return { error: "AI returned invalid format. Please refine the input or prompt." };
    }

  } catch (error) {
    console.error("❌ AI Request Error:", error.response?.data || error.message);
    return { error: 'Failed to connect to AI service.' };
  }
}

// 🚀 Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
