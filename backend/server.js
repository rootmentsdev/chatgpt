



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
  console.error("❌ Please check your .env file in the backend directory.");
} else if (OPENROUTER_API_KEY.length < 20) {
  console.error("❌ OPENROUTER_API_KEY appears to be too short or invalid.");
} else {
  console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY.slice(0, 10) + '...');
  console.log("✅ API Key length:", OPENROUTER_API_KEY.length, "characters");
}

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

// Analyze CSV (DSR Sheet)
app.post('/api/analyze-csv', upload.single('file'), async (req, res) => {
  try {
    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n');
    
    // Parse and filter DSR data intelligently
    let dsrData = '';
    let headerFound = false;
    let dataRows = 0;
    const maxDataRows = 50; // Limit to prevent AI overload
    
    // Find the header row and extract relevant data
    for (let i = 0; i < lines.length && dataRows < maxDataRows; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Look for header indicators
      if (line.includes('BILLS') || line.includes('STORE') || line.includes('MTD') || line.includes('L2L')) {
        dsrData += `Header Row ${i + 1}: ${line}\n`;
        headerFound = true;
        continue;
      }
      
      // Include data rows after header is found
      if (headerFound && line.includes(',') && !line.includes('SUITOR GUY') && !line.includes('12/8/2025')) {
        dsrData += `Data Row ${i + 1}: ${line}\n`;
        dataRows++;
      }
    }

    // If no structured data found, take first 20 rows
    if (!headerFound || dataRows === 0) {
      console.log("📊 No structured DSR found, taking sample rows...");
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i].trim();
        if (line) {
          dsrData += `Sample Row ${i + 1}: ${line}\n`;
        }
      }
    }
    
    console.log(`📊 Processed ${dataRows} data rows from ${lines.length} total rows`);
    console.log("📊 DSR Data Preview:", dsrData.substring(0, 300) + "...");
    const result = await analyzeTextWithAI(dsrData);
    res.json(result);
  } catch (err) {
    console.error("❌ DSR CSV Analysis Error:", err.message);
    res.status(500).json({ error: 'Failed to analyze DSR sheet' });
  }
});

// Analyze Google Sheet (DSR)
app.post('/api/analyze-sheet', async (req, res) => {
  const { sheetUrl } = req.body;
  
  if (!sheetUrl || !sheetUrl.trim()) {
    return res.status(400).json({ error: 'Google Sheet URL is required' });
  }

  try {
    console.log("🔗 Processing Google Sheet URL:", sheetUrl);
    
    const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
    if (!publicId) {
      console.error("❌ Invalid Google Sheet URL format");
      return res.status(400).json({ error: "Invalid Google Sheet link format. Please provide a valid Google Sheets URL." });
    }

    console.log("📊 Extracted Sheet ID:", publicId);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    console.log("🔗 CSV Export URL:", csvUrl);

    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || response.data.trim() === '') {
      console.error("❌ Empty response from Google Sheets");
      return res.status(400).json({ error: "The Google Sheet appears to be empty or inaccessible. Please ensure it's publicly accessible." });
    }

    const lines = response.data.split('\n');
    console.log(`📊 Found ${lines.length} rows in the sheet`);
    
    // Parse and filter DSR data intelligently
    let dsrData = '';
    let headerFound = false;
    let dataRows = 0;
    const maxDataRows = 50; // Limit to prevent AI overload
    
    // Find the header row and extract relevant data
    for (let i = 0; i < lines.length && dataRows < maxDataRows; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Look for header indicators
      if (line.includes('BILLS') || line.includes('STORE') || line.includes('MTD') || line.includes('L2L')) {
        dsrData += `Header Row ${i + 1}: ${line}\n`;
        headerFound = true;
        continue;
      }
      
      // Include data rows after header is found
      if (headerFound && line.includes(',') && !line.includes('SUITOR GUY') && !line.includes('12/8/2025')) {
        dsrData += `Data Row ${i + 1}: ${line}\n`;
        dataRows++;
      }
    }

    // If no structured data found, take first 20 rows
    if (!headerFound || dataRows === 0) {
      console.log("📊 No structured DSR found, taking sample rows...");
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i].trim();
        if (line) {
          dsrData += `Sample Row ${i + 1}: ${line}\n`;
        }
      }
    }

    if (dsrData.trim() === '') {
      console.error("❌ No valid data found in sheet");
      return res.status(400).json({ error: "No valid data found in the Google Sheet. Please check the sheet content." });
    }

    console.log(`📊 Processed ${dataRows} data rows from ${lines.length} total rows`);
    console.log("📊 DSR Data Preview:", dsrData.substring(0, 300) + "...");
    const result = await analyzeTextWithAI(dsrData);
    res.json(result);
  } catch (err) {
    console.error("❌ DSR Sheet Analysis Failed:", err.message);
    console.error("❌ Error details:", err.response?.data || err.stack);
    
    if (err.response?.status === 403) {
      return res.status(400).json({ error: "Access denied. Please ensure the Google Sheet is publicly accessible (Anyone with the link can view)." });
    } else if (err.response?.status === 404) {
      return res.status(400).json({ error: "Google Sheet not found. Please check the URL." });
    } else if (err.code === 'ECONNABORTED') {
      return res.status(500).json({ error: "Request timeout. The sheet might be too large or slow to access." });
    }
    
    res.status(500).json({ error: `Failed to analyze DSR sheet: ${err.message}` });
  }
});

// Test API Key
app.get('/api/test-key', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: "API key not found. Please check your .env file." 
    });
  }

  try {
    console.log("🧪 Testing API key...");
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: "user", content: "Hello, just testing the API connection." }],
      max_tokens: 10
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'API Test'
      },
      timeout: 10000
    });

    res.json({ 
      success: true, 
      message: "API key is working correctly",
      response: response.data.choices[0].message.content
    });
  } catch (err) {
    console.error("❌ API Key Test Failed:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.response?.data?.error?.message || err.message,
      status: err.response?.status
    });
  }
});

// Test Google Sheet connection
app.post('/api/test-sheet', async (req, res) => {
  const { sheetUrl } = req.body;
  
  if (!sheetUrl || !sheetUrl.trim()) {
    return res.status(400).json({ error: 'Google Sheet URL is required' });
  }

  try {
    console.log("🧪 Testing Google Sheet URL:", sheetUrl);
    
    const publicId = sheetUrl.match(/\/d\/(.*?)\//)?.[1];
    if (!publicId) {
      return res.status(400).json({ error: "Invalid Google Sheet URL format" });
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    console.log("🧪 Testing CSV Export URL:", csvUrl);

    const response = await axios.get(csvUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const lines = response.data.split('\n');
    const preview = lines.slice(0, 3).join('\n');
    
    res.json({ 
      success: true, 
      message: "Google Sheet is accessible",
      rows: lines.length,
      preview: preview
    });
  } catch (err) {
    console.error("❌ Google Sheet Test Failed:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: err.response?.status || 'Unknown error'
    });
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

// Function to fix truncated JSON responses
function fixTruncatedJSON(jsonString) {
  try {
    // Remove any explanatory text at the beginning
    if (jsonString.toLowerCase().includes('based on') ||
        jsonString.toLowerCase().includes('here is') ||
        jsonString.toLowerCase().includes('analysis:')) {
      const firstBrace = jsonString.indexOf('{');
      if (firstBrace !== -1) {
        jsonString = jsonString.substring(firstBrace);
      }
    }

    // Handle truncation in actionPlan array
    if (jsonString.includes('"actionPlan"') && !jsonString.includes(']')) {
      const actionPlanStart = jsonString.indexOf('"actionPlan": [');
      if (actionPlanStart !== -1) {
        const afterActionPlan = jsonString.substring(actionPlanStart + 15);
        const lastCompleteItem = afterActionPlan.lastIndexOf('"');
        if (lastCompleteItem !== -1) {
          const truncatedPart = afterActionPlan.substring(0, lastCompleteItem + 1);
          const fixed = jsonString.substring(0, actionPlanStart + 15) + truncatedPart + ']';
          return fixed + '}';
        }
      }
    }

    // Handle truncation in mainIssues array
    if (jsonString.includes('"mainIssues"') && !jsonString.includes(']')) {
      const mainIssuesStart = jsonString.indexOf('"mainIssues": [');
      if (mainIssuesStart !== -1) {
        const afterMainIssues = jsonString.substring(mainIssuesStart + 15);
        const lastCompleteItem = afterMainIssues.lastIndexOf('"');
        if (lastCompleteItem !== -1) {
          const truncatedPart = afterMainIssues.substring(0, lastCompleteItem + 1);
          const fixed = jsonString.substring(0, mainIssuesStart + 15) + truncatedPart + ']';
          // Add missing closing braces
          const openBraces = (fixed.match(/{/g) || []).length;
          const closeBraces = (fixed.match(/}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          for (let i = 0; i < missingBraces; i++) {
            fixed += '}';
          }
          return fixed;
        }
      }
    }

    // If it's missing closing brackets
    if (!jsonString.endsWith('}')) {
      // Count open and close braces
      const openBraces = (jsonString.match(/{/g) || []).length;
      const closeBraces = (jsonString.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;

      let fixed = jsonString;
      for (let i = 0; i < missingBraces; i++) {
        fixed += '}';
      }
      return fixed;
    }

    return jsonString;
  } catch (err) {
    console.error("❌ Error fixing JSON:", err.message);
    return null;
  }
}

// Core AI Prompt Logic with retry mechanism for DSR Analysis
async function analyzeTextWithAI(inputText, retryCount = 0) {
  const maxRetries = 3;
  const prompt = `Analyze DSR data using 80/20 Rule with cluster and role focus:

${inputText}

CLUSTERS:
NORTH: EDAPPAL, KOTTAKAL, PMNA, MANJERY, CALICUT, VATAKARA, KALPETTA, KANNUR
SOUTH: All other stores

REQUIREMENTS:
1. Find ALL stores with L2L Bills <50% OR L2L Qty <50% OR Conversion <50%
2. Apply 80/20 Rule: Identify 20% stores causing 80% issues
3. List AT LEAST 5-8 stores from data above

For each store: Store name, Cluster, L2L Bills %, L2L Qty %, Conversion %, Walk-ins FTD/MTD, Bills FTD/MTD, Qty FTD/MTD

ROLE ISSUES:
- Conversion low → Fashion Consultant problem
- Walk-ins high, Bills low → Fashion Consultant problem  
- Multiple cluster stores fail → Cluster Manager problem
- Overall store poor → Store Manager problem

JSON only:
{
  "mainIssues": ["Store1: Cluster, details", "Store2: Cluster, details", "Store3: Cluster, details", "Store4: Cluster, details", "Store5: Cluster, details"],
  "rootCauses": ["Store1 cause", "Store2 cause", "Store3 cause", "Store4 cause", "Store5 cause"],
  "actionPlan": ["Store Manager of [Store]: action", "Fashion Consultant of [Store]: action", "Cluster Manager [North/South]: action", "Store Manager of [Store]: action", "Fashion Consultant of [Store]: action"]
}`;

  try {
    // Try primary model first, fallback to alternative if needed
    const models = ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'];
    const selectedModel = models[retryCount] || models[0];
    
    console.log(`📨 Sending analyzeTextWithAI() request to OpenRouter using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: selectedModel,
      messages: [
        { role: "system", content: "You are a retail analyst who must analyze ALL stores in the data, not just one. Always provide comprehensive multi-store analysis." },
        { role: "user", content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.1
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
    
    // Remove any text before the first { if it exists
    if (!cleanedResponse.startsWith('{')) {
      const firstBrace = cleanedResponse.indexOf('{');
      if (firstBrace !== -1) {
        cleanedResponse = cleanedResponse.substring(firstBrace);
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
      
      // Try to fix truncated JSON
      const fixedResponse = fixTruncatedJSON(cleanedResponse);
      if (fixedResponse) {
        try {
          const parsed = JSON.parse(fixedResponse);
          console.log("✅ Successfully parsed fixed AI response:", parsed);
          return parsed;
        } catch (err2) {
          console.error("❌ Even fixed JSON failed to parse:", err2.message);
        }
      }
      
      return { error: "AI returned invalid format. Please refine the input or prompt." };
    }
    } catch (error) {
      console.error("❌ AI Request Failed:", error.response?.data || error.message);
      
      // Retry logic for network errors or authentication issues
      if (retryCount < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('timeout') ||
        error.response?.status === 401 || // API key issues
        error.response?.status === 429    // Rate limiting
      )) {
        console.log(`🔄 Retrying request in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return analyzeTextWithAI(inputText, retryCount + 1);
      }
      
      // Handle specific error types
      if (error.response?.status === 401) {
        return { error: 'API authentication failed. Please check your OpenRouter API key.' };
      } else if (error.response?.status === 429) {
        return { error: 'API rate limit exceeded. Please try again later.' };
      }
      
      return { error: 'Failed to connect to AI service. Please try again.' };
    }
}

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});



