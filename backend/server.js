const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint for debugging
app.get('/api/test-key', (req, res) => {
  console.log("🧪 Test endpoint called");
  res.json({ 
    success: true, 
    response: "Backend is running properly",
    timestamp: new Date().toISOString(),
    apiKeyLoaded: !!OPENROUTER_API_KEY
  });
});

// Custom analysis endpoint - ChatGPT style prompting
app.post('/api/custom-analyze', async (req, res) => {
  const { prompt, googleSheetUrl, timestamp } = req.body;
  
  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Custom prompt is required' });
  }

  try {
    console.log("📨 Custom analysis request:", { 
      prompt: prompt.substring(0, 100) + "...", 
      hasSheetUrl: !!googleSheetUrl,
      timestamp: timestamp || 'no timestamp',
      fullPromptLength: prompt.length
    });
    
    let sheetData = '';
    
    // If Google Sheet URL is provided, fetch the data
    if (googleSheetUrl?.trim()) {
      try {
        const sheetId = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (sheetId) {
          const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
          const sheetResponse = await axios.get(csvUrl);
          sheetData = sheetResponse.data;
          console.log("📊 Google Sheet data fetched, rows:", sheetData.split('\n').length);
        }
      } catch (sheetError) {
        console.log("⚠️ Could not fetch Google Sheet data:", sheetError.message);
      }
    }

    // Use only the user's prompt - no backend prompting
    const fullPrompt = `${sheetData ? `Here is the data to analyze:\n\n${sheetData}\n\n` : ''}${prompt}`;

    // Send to AI with no system context - pure user prompt
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [
        { role: "user", content: fullPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7 // Higher temperature for more varied responses
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Custom Analysis'
      },
      timeout: 60000
    });

    const analysis = response.data.choices[0].message.content;
    console.log("📊 Custom analysis completed");
    
    // Return the analysis in a structured format
    res.json({
      success: true,
      analysis: analysis,
      prompt: prompt,
      hasSheetData: !!sheetData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Custom Analysis Failed:", error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Custom analysis failed. Please try again.',
      details: error.message 
    });
  }
});

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
        'X-Title': 'Chat'
      },
      timeout: 30000
    });

    const reply = response.data.choices[0].message.content;
    res.json({ success: true, reply });
  } catch (error) {
    console.error("❌ Chat Failed:", error.response?.data || error.message);
    res.status(500).json({ error: 'Chat failed. Please try again.' });
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
    console.error("❌ PDF Analysis Error:", error);
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
      return res.status(400).json({ error: "Invalid Google Sheet URL format" });
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${publicId}/export?format=csv`;
    console.log("🔗 CSV Export URL:", csvUrl);

    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const lines = response.data.split('\n');
    console.log(`📊 Raw CSV data received: ${lines.length} lines`);
    
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
    
    if (!dsrData.trim()) {
      console.error("❌ No valid data found in Google Sheet");
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
      return res.status(400).json({ error: "Request timeout. The Google Sheet might be too large or inaccessible." });
    }
    
    return res.status(500).json({ 
      error: `Failed to analyze DSR sheet: ${err.message}` 
    });
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
      timeout: 15000
    });

    res.json({ 
      success: true, 
      message: "API key is working correctly!",
      model: response.data.model,
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error("❌ API Key Test Failed:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || error.message 
    });
  }
});

// Test Google Sheet Access
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

// Simple AI analysis function - no hardcoded prompts
async function analyzeTextWithAI(inputText, userPrompt = null, retryCount = 0) {
  const maxRetries = 3;
  
  // Use user's prompt if provided, otherwise use simple default
  const prompt = userPrompt ? `${inputText}\n\n${userPrompt}` : inputText;

  try {
    // Try primary model first, fallback to alternative if needed
    const models = ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'];
    const selectedModel = models[retryCount] || models[0];
    
    console.log(`📨 Sending analyzeTextWithAI() request to OpenRouter using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: selectedModel,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.1
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Text Analysis'
      },
      timeout: 60000
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log("✅ AI Analysis completed successfully");
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(aiResponse);
      console.log("✅ Successfully parsed AI response as JSON:", parsed);
      return parsed;
    } catch (parseError) {
      console.log("📝 AI response is not JSON, returning as plain text");
      return { analysis: aiResponse };
    }

  } catch (error) {
    console.error(`❌ analyzeTextWithAI() failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.response?.data || error.message);
    
    // Retry logic for specific errors
    if (retryCount < maxRetries && (
        error.response?.status === 429 || // Rate limiting
        error.response?.status === 500 || // Server error
        error.response?.status === 503 || // Service unavailable
        error.response?.status === 401 || // API key issues
        error.response?.status === 429    // Rate limiting
      )) {
      console.log(`🔄 Retrying request in 2 seconds... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return analyzeTextWithAI(inputText, userPrompt, retryCount + 1);
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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔑 API Key loaded: ${!!OPENROUTER_API_KEY}`);
});
