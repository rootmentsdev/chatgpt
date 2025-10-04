



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
      model: 'anthropic/claude-3-haiku',
      messages: [
        { role: "user", content: fullPrompt }
      ],
      max_tokens: 4000,
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

// Core AI Prompt Logic with retry mechanism for IT Support Analysis
async function analyzeTextWithAI(inputText, retryCount = 0) {
  const maxRetries = 3;
  const prompt = `You are an AI assistant specialized in analyzing IT support requests for Rootments Enterprises LLP. When processing IT support requests, focus on these CRITICAL COLUMNS:

## Company Context: Rootments Enterprises LLP

**About Rootments:**
Rootments Enterprises LLP is a Kerala-based retail + tech group operating two leading brands:
- **SuitorGuy** – Men's suits, tuxedos, Indo-western, shoes, shirts
- **Zorucci** – Bridal gowns, jewellery, accessories, and party wear

**Operations:**
- 20 stores across Kerala (North & South clusters)
- Expansion plans: Tamil Nadu and Jewellery vertical
- In-house tech systems for operations, finance, training, and dashboards

**Branches (19 Stores):**
- **SuitorGuy (Men's Rentals):** Chavakkad, Palakkad, Thrissur, Edappally, Perumbavur, Kottayam, Trivandrum, MG Road Kochi (upcoming)
- **Zorucci (Bridal & Jewellery):** Edappally, Perumbavur, Thrissur, Kottayam, Trivandrum, Palakkad, Chavakkad
- **Additional/Cluster Outlets:** SuitorGuy South/North Cluster, Zorucci South/North Cluster

**Technology & Internal Sites:**
- **💰 RootFin** – Finance Software (MongoDB + Express + React, hosted on Render/Vercel/MongoDB Atlas)
- **🎓 LMS** – Training Platform (Node.js + MongoDB + React, hosted on Render/Vercel)
- **🖥 Other Tools:** Billing Software, Ziy.ai (AI feedback analyzer), TYM SaaS (WhatsApp ordering), rootments.live
- **🌐 Websites:** suitorguy.com (live), zorucci.com (ready, hosting pending)

**IT Team Structure:**
- **Team Lead** – Overall project coordination and technical decisions
- **MERN Developer** – Backend development, database management, API development
- **Software Tester** – Quality assurance, bug testing, system validation
- **UI/UX Designer** – Frontend design, user interface, user experience
- **Marketing Analyst** – SEO optimization, website performance, digital marketing integration

**IMPORTANT: Analyze ALL IT support requests mentioned in the data, not just one request.**

**Analyze the IT support data and provide a JSON response with the following structure:**
{
  "sprintOverview": {
    "sprintDuration": "1 Week Sprint",
    "totalActiveRequests": "[number]",
    "teamCapacity": "5 members (Team Lead, MERN Developer, Software Tester, UI/UX Designer, Marketing Analyst)",
    "sprintGoal": "Complete high-priority IT requests and system improvements"
  },
  "sprintBacklog": [
    {
      "requestId": "[timestamp]",
      "requester": "[Name] - [Department]",
      "priority": "HIGH/MEDIUM/LOW",
      "system": "[RootFin/LMS/Website/Billing/Other]",
      "issue": "[Brief description]",
      "estimatedEffort": "[X hours/days]",
      "assignedTo": "[Team Member]",
      "sprintDay": "[Day 1-5]",
      "businessImpact": "[Revenue/Operations/Customer Impact]"
    }
  ],
  "sprintPlanning": {
    "day1": ["Task 1", "Task 2"],
    "day2": ["Task 3", "Task 4"],
    "day3": ["Task 5", "Task 6"],
    "day4": ["Task 7", "Task 8"],
    "day5": ["Testing", "Deployment", "Review"]
  },
  "teamAssignment": [
    "Assign to [Team Member]: [Specific task with duration]",
    "Assign to [Team Member]: [Specific task with duration]",
    "Assign to [Team Member]: [Specific task with duration]"
  ],
  "riskAssessment": [
    "Risk 1: [Description] - Mitigation: [Action]",
    "Risk 2: [Description] - Mitigation: [Action]"
  ],
  "successMetrics": [
    "Metric 1: [Description]",
    "Metric 2: [Description]"
  ]
}

**Focus on:**
1. System categorization (RootFin, LMS, Billing, Website, Store Operations)
2. Priority assessment (High/Medium/Low with business context)
3. Department impact analysis (Operations, Finance, HR, Management, Marketing, Sales)
4. Technical assessment with company-specific tech stack
5. Business value and operational efficiency gains
6. Multi-store and multi-brand considerations
7. Team assignment based on issue type and required skills

**Data to analyze:**
${inputText}

**Requirements:**
1. EXCLUDE requests with Status = "Fixed" or "Fixed and live" - these are already completed
2. Find ALL remaining IT support requests with High Priority OR critical system issues
3. Apply priority-based analysis: Identify urgent requests affecting operations
4. List AT LEAST 3-5 active requests from data above

For each request: Request ID, Department, Priority Level, System Affected, Issue Type, Business Impact, Status

SYSTEM ISSUES:
- RootFin issues → Finance operations affected
- LMS issues → Training and compliance affected  
- Website issues → Brand presence and SEO affected
- Billing issues → Store operations affected
- General IT → Infrastructure and security affected

TEAM ASSIGNMENT RULES:
- **UI/UX Issues** (frontend design, user interface problems) → Assign to **UI/UX Designer**
- **Development Issues** (backend, database, API problems) → Assign to **MERN Developer**
- **Testing Issues** (bug reports, quality assurance, system validation) → Assign to **Software Tester**
- **Marketing Issues** (SEO, website performance, digital marketing) → Assign to **Marketing Analyst**
- **Project Management** (coordination, technical decisions, complex issues) → Assign to **Team Lead**
- **Cross-functional Issues** (multiple systems affected) → Assign to **Team Lead** for coordination

**TEAM LEADER PERSPECTIVE (50+ years experience):**
- Focus on business impact and ROI
- Prioritize based on revenue generation and operational efficiency
- Consider technical debt and long-term scalability
- Plan for realistic delivery timelines
- Account for testing, deployment, and rollback strategies

**SPRINT PLANNING APPROACH:**
- Day 1-2: High priority items and critical fixes
- Day 3-4: Medium priority features and improvements
- Day 5: Testing, deployment, and documentation

JSON only:
{
  "sprintOverview": {
    "sprintDuration": "1 Week Sprint",
    "totalActiveRequests": "[number]",
    "teamCapacity": "5 members",
    "sprintGoal": "Complete high-priority IT requests"
  },
  "sprintBacklog": [
    {
      "requestId": "[timestamp]",
      "requester": "[Name] - [Department]",
      "priority": "HIGH",
      "system": "[System]",
      "issue": "[Description]",
      "estimatedEffort": "[X hours]",
      "assignedTo": "[Team Member]",
      "sprintDay": "Day 1",
      "businessImpact": "[Impact description]"
    }
  ],
  "sprintPlanning": {
    "day1": ["High priority task 1", "Critical fix 1"],
    "day2": ["High priority task 2", "Medium priority task 1"],
    "day3": ["Medium priority task 2", "Feature development"],
    "day4": ["Low priority tasks", "Code review"],
    "day5": ["Testing", "Deployment", "Sprint review"]
  },
  "teamAssignment": ["Team Lead: Sprint coordination", "MERN Developer: Backend tasks", "UI/UX Designer: Frontend tasks"],
  "riskAssessment": ["Risk: Technical complexity - Mitigation: Pair programming", "Risk: Timeline pressure - Mitigation: Scope adjustment"],
  "successMetrics": ["All high priority requests completed", "Zero critical bugs in production"]
}`;

  try {
    // Try primary model first, fallback to alternative if needed
    const models = ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'];
    const selectedModel = models[retryCount] || models[0];
    
    console.log(`📨 Sending analyzeTextWithAI() request to OpenRouter using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: selectedModel,
      messages: [
        { role: "system", content: "You are an IT support analyst for Rootments Enterprises LLP who must analyze ALL IT support requests in the data, not just one. Always provide comprehensive multi-request analysis with company system integration." },
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



