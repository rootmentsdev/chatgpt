
// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const multer = require('multer');
// const pdfParse = require('pdf-parse');
// require('dotenv').config();

// // Confirm API key loaded
// console.log("🔐 Loaded API Key:", process.env.OPENROUTER_API_KEY?.slice(0, 10) + '...');

// const app = express();
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
//   methods: ['GET', 'POST'],
//   credentials: true
// }));
// app.use(express.json());

// const upload = multer({ storage: multer.memoryStorage() });

// // General chat
// app.post('/api/chat', async (req, res) => {
//   const { message } = req.body;
//   if (!message || message.trim() === "") return res.status(400).json({ error: 'Message is required' });

//   try {
//     console.log("📨 Sending /api/chat request to OpenRouter...");

//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'mistralai/mistral-7b-instruct',
//       messages: [{ role: "user", content: message }],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'My Ai App'
//       }
//     });

//     const reply = response.data.choices[0].message.content;
//     res.json({ reply });
//   } catch (error) {
//     console.error("❌ AI Chat Request Failed:", error.response?.data || error.message);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });

// // Analyze PDF
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

// // Analyze CSV
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

// // Analyze Google Sheet
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
//     console.error("❌ Sheet Analysis Failed:", err.message);
//     res.status(500).json({ error: 'Failed to analyze sheet feedback' });
//   }
// });

// // Analyze raw paragraph
// app.post('/api/analyze-text', async (req, res) => {
//   const { text } = req.body;
//   if (!text) return res.status(400).json({ error: 'Text is required' });

//   try {
//     const result = await analyzeTextWithAI(text);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ Text Analysis Failed:", err.message);
//     res.status(500).json({ error: 'Failed to analyze text feedback' });
//   }
// });

// // Core logic: AI prompt
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
//     console.log("📨 Sending analyzeTextWithAI() request to OpenRouter...");

//     const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'mistralai/mistral-7b-instruct',
//       messages: [{ role: "user", content: prompt }],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'Feedback Analyzer'
//       }
//     });

//     const raw = aiResponse.data.choices[0].message.content;
//     try {
//       return JSON.parse(raw);
//     } catch (err) {
//       console.error("⚠️ Raw AI Response:", raw);
//       return { error: "AI returned invalid format. Please refine the input or prompt." };
//     }
//   } catch (error) {
//     console.error("❌ AI Request Failed:", error.response?.data || error.message);
//     return { error: 'Failed to connect to AI service.' };
//   }
// }

// const PORT = 5000;
// app.listen(PORT, () => {
//   if (!process.env.OPENROUTER_API_KEY) {
//     console.error("❌ OPENROUTER_API_KEY is missing — check .env file or Render environment settings");
//   }
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

// ✅ Load and trim API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY is missing or invalid.");
}
console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY.slice(0, 10) + '...');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    console.log("📨 Sending /api/chat request to OpenRouter...");
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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

// Analyze CSV
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

// Analyze Google Sheet
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
    console.error("❌ Sheet Analysis Failed:", err.message);
    res.status(500).json({ error: 'Failed to analyze sheet feedback' });
  }
});

// Analyze Paragraph
app.post('/api/analyze-text', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = await analyzeTextWithAI(text);
    res.json(result);
  } catch (err) {
    console.error("❌ Text Analysis Failed:", err.message);
    res.status(500).json({ error: 'Failed to analyze text feedback' });
  }
});

// Core AI Prompt Logic with retry mechanism
async function analyzeTextWithAI(inputText, retryCount = 0) {
  const maxRetries = 3;
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

IMPORTANT: You MUST respond with ONLY valid JSON. No additional text, explanations, or formatting. The response must start with { and end with }.

Respond in this EXACT JSON format:
{
  "mainIssues": ["issue1", "issue2"],
  "rootCauses": ["cause1", "cause2"],
  "actionPlan": ["action1", "action2", "action3"]
}
`;

  try {
    // Try primary model first, fallback to alternative if needed
    const models = ['mistralai/mistral-7b-instruct', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];
    const selectedModel = models[retryCount] || models[0];
    
    console.log(`📨 Sending analyzeTextWithAI() request to OpenRouter using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Feedback Analyzer'
      },
      timeout: 30000 // 30 second timeout
    });

    const raw = response.data.choices[0].message.content;
    console.log("🔍 Raw AI Response:", raw);
    
    // Handle empty response
    if (!raw || raw.trim() === '') {
      console.error("❌ AI returned empty response");
      return { error: "AI service returned empty response. Please try again." };
    }
    
    // Clean the response - remove any markdown formatting or extra text
    let cleanedResponse = raw.trim();
    
    // Extract JSON from markdown code blocks if present
    if (cleanedResponse.includes('```json')) {
      const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1].trim();
      }
    } else if (cleanedResponse.includes('```')) {
      const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1].trim();
      }
    }
    
    // Find JSON object in the response
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    }
    
    try {
      const parsed = JSON.parse(cleanedResponse);
      console.log("✅ Successfully parsed AI response:", parsed);
      return parsed;
    } catch (err) {
      console.error("❌ Failed to parse AI response as JSON");
      console.error("📝 Cleaned response:", cleanedResponse);
      console.error("🔧 Parse error:", err.message);
      return { error: "AI returned invalid format. Please refine the input or prompt." };
    }
    } catch (error) {
      console.error("❌ AI Request Failed:", error.response?.data || error.message);
      
      // Retry logic for network errors or empty responses
      if (retryCount < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('timeout') ||
        !response?.data?.choices?.[0]?.message?.content
      )) {
        console.log(`🔄 Retrying request in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return analyzeTextWithAI(inputText, retryCount + 1);
      }
      
      return { error: 'Failed to connect to AI service. Please try again.' };
    }
}

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});





// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const multer = require('multer');
// const pdfParse = require('pdf-parse');
// require('dotenv').config();

// console.log("🔐 Loaded API Key:", process.env.OPENROUTER_API_KEY?.slice(0, 10) + '...');

// const app = express();
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://chatgpt-zeta-hazel.vercel.app'],
//   methods: ['GET', 'POST'],
//   credentials: true
// }));
// app.use(express.json());

// const upload = multer({ storage: multer.memoryStorage() });

// // General chat
// app.post('/api/chat', async (req, res) => {
//   const { message } = req.body;
//   if (!message || message.trim() === "") return res.status(400).json({ error: 'Message is required' });

//   try {
//     const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: "mistralai/mixtral-8x7b-instruct",
//       messages: [{ role: "user", content: message }],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'My AI App'
//       }
//     });

//     const reply = response.data.choices[0].message.content;
//     res.json({ reply });
//   } catch (error) {
//     console.error("❌ AI Chat Request Failed:", error.response?.data || error.message);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// });

// // Analyze PDF
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

// // Analyze CSV
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

// // Analyze Google Sheet
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
//       const suggestion = cols[8]?.trim();        // Column I
//       const paymentComment = cols[10]?.trim();   // Column K
//       return `Suggestion: ${suggestion}, Payment Feedback: ${paymentComment}`;
//     }).filter(Boolean).join('\n');

//     const result = await analyzeTextWithAI(feedbackText);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ Sheet Analysis Failed:", err.message);
//     res.status(500).json({ error: 'Failed to analyze sheet feedback' });
//   }
// });

// // Analyze raw paragraph
// app.post('/api/analyze-text', async (req, res) => {
//   const { text } = req.body;
//   if (!text) return res.status(400).json({ error: 'Text is required' });

//   try {
//     const result = await analyzeTextWithAI(text);
//     res.json(result);
//   } catch (err) {
//     console.error("❌ Text Analysis Failed:", err.message);
//     res.status(500).json({ error: 'Failed to analyze text feedback' });
//   }
// });

// // Explain issue
// app.post('/api/explain-issue', async (req, res) => {
//   const { issueText } = req.body;
//   if (!issueText) return res.status(400).json({ error: 'Issue text is required' });

//   const prompt = `
// You are an assistant for a premium bridal rental brand.
// The issue is: "${issueText}"

// Please:
// 1. Explain why this issue might be occurring.
// 2. Give 3–5 practical steps the team can take to resolve or prevent it.

// Respond only in JSON format:
// {
//   "rootCauses": [...],
//   "actionPlan": [...]
// }`;

//   try {
//     const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'mistralai/mixtral-8x7b-instruct',
//       messages: [{ role: "user", content: prompt }],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'Issue Explainer'
//       }
//     });

//     const raw = aiResponse.data.choices[0].message.content;
//     try {
//       res.json(JSON.parse(raw));
//     } catch (err) {
//       console.error("⚠️ Raw AI Response:", raw);
//       res.status(500).json({ error: "AI returned invalid format." });
//     }
//   } catch (error) {
//     console.error("❌ Issue Explanation Failed:", error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to generate explanation.' });
//   }
// });

// // Core AI Feedback Analysis Logic
// async function analyzeTextWithAI(inputText) {
// const prompt = `
// You are an AI feedback analyst for a premium bridal rental brand.

// Your task is to **carefully analyze** the following raw customer feedback:
// """
// ${inputText}
// """

// Instructions:
// - Your job is to spot even the smallest customer concern, dissatisfaction, or improvement request.
// - **Include all minor or rare issues**, even if they appear only once (e.g. card payment availability, extra day rental flexibility).
// - Completely ignore positive words like "Yes", "Good", "Nil", or "Nothing".

// Return exactly this JSON format:
// {
//   "suggestedIssues": [
//     "Lack of card payment option",
//     "Need flexible payment for customers travelling",
//     "..."
//   ]
// }
// `;



//   try {
//     const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//       model: 'mistralai/mixtral-8x7b-instruct',
//       messages: [{ role: "user", content: prompt }],
//     }, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         'Content-Type': 'application/json',
//         'X-Title': 'Feedback Analyzer'
//       }
//     });

//     const raw = aiResponse.data.choices[0].message.content;
//     try {
//       return JSON.parse(raw);
//     } catch (err) {
//       console.error("⚠️ Raw AI Response:", raw);
//       return { error: "AI returned invalid format. Please refine the input or prompt." };
//     }
//   } catch (error) {
//     console.error("❌ AI Request Failed:", error.response?.data || error.message);
//     return { error: 'Failed to connect to AI service.' };
//   }
// }

// const PORT = 5000;
// app.listen(PORT, () => {
//   if (!process.env.OPENROUTER_API_KEY) {
//     console.error("❌ OPENROUTER_API_KEY is missing — check .env file");
//   }
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });