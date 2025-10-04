
import React, { useState } from 'react';
import './FeedBackAnalysis.css';

const FeedBackAnalysis = () => {
  const [file, setFile] = useState(null);
  const [googleLink, setGoogleLink] = useState('https://docs.google.com/spreadsheets/d/1soJQ5sthae5LyYHlP0YdtGhpxLYnJMI-jU8W8Q21iIg/edit?gid=424789735#gid=424789735');
  const [paragraph, setParagraph] = useState('');
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res;
      let url = '';
      let requestBody = null;

      if (analysisPrompt.trim()) {
        // PRIORITY: If user has a prompt, always use custom-analyze endpoint
        url = "http://localhost:5000/api/custom-analyze";
        
        requestBody = { 
          prompt: analysisPrompt.trim(),
          googleSheetUrl: googleLink.trim() || null,
          timestamp: Date.now() // Add timestamp to ensure fresh responses
        };
        
        console.log(`📤 Sending custom prompt request to: ${url}`);
        console.log(`📝 User prompt:`, analysisPrompt.trim());
        console.log(`📊 Request body:`, requestBody);
        console.log(`✅ Using CUSTOM-ANALYZE endpoint - Pure frontend prompting!`);
        res = await fetch(url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const isCSV = file.name.endsWith(".csv");
        url = `http://localhost:5000/api/${isCSV ? 'analyze-csv' : 'analyze-pdf'}`;
        requestBody = formData;

        console.log(`📤 Sending file to: ${url}`);
        res = await fetch(url, {
          method: "POST",
          body: formData,
        });
      } else if (googleLink.trim()) {
        url = "http://localhost:5000/api/analyze-sheet";
        requestBody = { sheetUrl: googleLink };
        
        console.log(`📤 Sending sheet request to: ${url}`);
        res = await fetch(url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else if (paragraph.trim()) {
        url = "http://localhost:5000/api/analyze-text";
        requestBody = { text: paragraph };
        
        console.log(`📤 Sending text request to: ${url}`);
        res = await fetch(url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else {
        alert("Please provide an IT Support file, Google Sheet link, paste IT Support data, or enter an analysis prompt.");
        setLoading(false);
        return;
      }

      console.log(`📡 Response status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log("Could not parse error response as JSON:", parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log("📊 Analysis result:", data);
      setResult(data);
    } catch (err) {
      console.error("❌ Error analyzing:", err);
        
        // Check for specific error types
        let errorMessage = "Something went wrong during IT Support analysis.";
        
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "Network error: Unable to connect to server. Please check if your backend is running on http://localhost:5000";
        } else if (err.message.includes('listener indicated an asynchronous response')) {
          errorMessage = "Browser extension conflict detected. Please try disabling browser extensions or use incognito mode.";
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = "Connection failed. Please check your internet connection and ensure the backend server is running.";
        } else if (err.message.includes('CORS')) {
          errorMessage = "CORS error: Backend server may not be properly configured for cross-origin requests.";
        } else {
          errorMessage = err.message || errorMessage;
        }
        
      setResult({ 
          error: errorMessage,
        canRetry: true
      });
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-ui">
      <div className="chat-header">
        <h1>IT Support Request Analyzer</h1>
        <p>Analyzes IT support requests with priority-based action plans and company system integration (HIGH/MEDIUM/LOW urgency)</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
            className="test-api-btn"
          onClick={async () => {
            try {
                console.log("🧪 Testing API connection...");
                const res = await fetch("http://localhost:5000/api/test-key", {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  timeout: 10000 // 10 second timeout
                });
                
                if (!res.ok) {
                  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                
              const data = await res.json();
                console.log("📡 API test response:", data);
                
              if (data.success) {
                alert(`✅ API Connection Working!\nResponse: ${data.response}`);
              } else {
                alert(`❌ API Error: ${data.error}`);
              }
            } catch (err) {
                console.error("❌ API test failed:", err);
                let errorMessage = "Connection Failed";
                
                if (err.name === 'TypeError' && err.message.includes('fetch')) {
                  errorMessage = "Unable to connect to server. Please ensure your backend is running on http://localhost:5000";
                } else if (err.message.includes('listener indicated an asynchronous response')) {
                  errorMessage = "Browser extension conflict detected. Please try disabling browser extensions or use incognito mode.";
                } else {
                  errorMessage = err.message;
                }
                
                alert(`❌ ${errorMessage}`);
              }
            }}
        >
          🧪 Test API Connection
        </button>
          
          <button
            className="test-api-btn"
            onClick={() => {
              const troubleshooting = `
🔧 Troubleshooting Guide:

1. **Backend Server Check:**
   - Ensure backend is running: cd backend && npm start
   - Check console for "Server running on port 5000"

2. **Browser Extension Conflicts:**
   - Try incognito/private mode
   - Disable browser extensions temporarily
   - Common conflicting extensions: AdBlockers, VPN, Privacy tools

3. **Network Issues:**
   - Check if http://localhost:5000/api/test-key is accessible
   - Try different browser (Chrome, Firefox, Edge)
   - Check firewall/antivirus settings

4. **Alternative URLs:**
   - Try: http://127.0.0.1:5000
   - Or use production: https://chatgpt-1-ovts.onrender.com

5. **CORS Issues:**
   - Backend should allow localhost:5173
   - Check browser console for CORS errors

6. **Quick Fixes:**
   - Refresh the page (Ctrl+F5)
   - Clear browser cache
   - Restart backend server
              `;
              alert(troubleshooting);
            }}
          >
            🔧 Troubleshooting
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <label>Upload IT Support Report (PDF/CSV):</label>
          <input type="file" accept=".pdf,.csv" onChange={handleFileChange} />
        </div>

        <div className="input-group">
          <label>IT Support Google Sheet Link:</label>
          <div className="sheet-input-group">
            <input
              type="text"
              placeholder="Paste public Google Sheet IT Support link..."
              value={googleLink}
              onChange={(e) => setGoogleLink(e.target.value)}
            />
            <button
              type="button"
              className="test-sheet-btn"
              onClick={async () => {
                if (!googleLink.trim()) {
                  alert("Please enter a Google Sheet URL first");
                  return;
                }
                try {
                  const res = await fetch("http://localhost:5000/api/test-sheet", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sheetUrl: googleLink })
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert(`✅ Sheet is accessible!\nRows: ${data.rows}\nPreview:\n${data.preview}`);
                  } else {
                    alert(`❌ Error: ${data.error}`);
                  }
                } catch (err) {
                  alert(`❌ Connection failed: ${err.message}`);
                }
              }}
            >
              Test
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>Or Paste IT Support Data:</label>
          <textarea
            placeholder="Copy and paste your IT support request data here (timestamp, name, department, priority, issue description, business impact, etc.)..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            rows={5}
          />
        </div>

        <div className="input-group">
          <label>Your Prompt (ChatGPT Style):</label>
          <textarea
            placeholder="Enter your prompt here... 

Example prompts:
• 'Create a 1-week sprint plan for our IT team focusing on high-priority revenue-impacting issues'
• 'Analyze all pending RootFin issues and create a priority matrix with team assignments'
• 'Generate a risk assessment for current IT support backlog and suggest mitigation strategies'
• 'Create a detailed team assignment plan for this week's tasks with effort estimation'
• 'Analyze LMS issues and provide improvement recommendations for our 20 stores'
• 'Generate a comprehensive status report for all active IT support requests'
• 'Give me a simple list of all pending requests'
• 'Create a table with priority levels and team assignments'
• 'Focus only on RootFin issues and provide technical solutions'

The system will automatically fetch your Google Sheet data and analyze it based on this prompt."
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            rows={6}
          />
        </div>

        <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '6px', border: '1px solid #28a745' }}>
          <strong>📝 Current Prompt Preview:</strong>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#155724' }}>
            {analysisPrompt.trim() || 'No prompt entered yet...'}
          </div>
          {analysisPrompt.trim() && (
            <div style={{ marginTop: '8px', padding: '5px', background: '#d4edda', borderRadius: '4px', fontSize: '11px', color: '#155724', fontWeight: 'bold' }}>
              ✅ Pure Frontend Prompting Mode - AI will respond exactly to your prompt!
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '10px', padding: '10px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
          <strong>🧪 Quick Test Prompts:</strong>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Create a simple list of all pending IT support requests")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Simple List
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Generate a detailed sprint plan with team assignments for next week")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Sprint Plan
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Analyze RootFin issues only and suggest improvements")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              RootFin Focus
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Create a priority matrix with HIGH/MEDIUM/LOW classifications")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Priority Matrix
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Give me a summary of all LMS issues")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              LMS Summary
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Create a table with all requests, their status, and assigned team member")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#20c997', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Status Table
            </button>
            <button 
              type="button"
              onClick={() => setAnalysisPrompt("Just give me a simple hello message to test if frontend prompting works")}
              style={{ padding: '4px 8px', fontSize: '11px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Test Frontend
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (analysisPrompt.trim() ? "Analyzing with Custom Prompt..." : "Analyzing IT Requests...") : "Generate IT Support Analysis"}
        </button>
          
          {result && (
            <button 
              type="button" 
              className="clear-btn" 
              onClick={() => {
                setResult(null);
                setRetryCount(0);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Clear Results
            </button>
          )}
        </div>
        
        {loading && (
          <p className="loading-text">
            🔍 {analysisPrompt.trim() ? 'Processing your prompt and analyzing data...' : 'Analyzing IT support requests, system categorization, priority assessment, and generating action plans (HIGH/MEDIUM/LOW urgency)...'}
          </p>
        )}
      </form>

      {result && (
        <div className="chat-response">
          <h4>📊 IT Support Request Analysis Report:</h4>
          {analysisPrompt.trim() && (
            <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
              <strong>🎯 Your Prompt Used:</strong>
              <div style={{ marginTop: '5px' }}>
                {analysisPrompt.trim()}
              </div>
              
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 'bold' }}>
                  🔍 Debug: Show Full Prompt Sent to AI
                </summary>
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {`Full Prompt Sent to AI:\n\n${analysisPrompt.trim()}`}
                </div>
              </details>
            </div>
          )}
          {result.error ? (
            <div>
              <p className="error-text">{result.error}</p>
              {result.canRetry && retryCount < 3 && (
                <button 
                  className="retry-btn"
                  onClick={() => {
                    setResult(null);
                    handleSubmit({ preventDefault: () => {} });
                  }}
                >
                  🔄 Retry Analysis
                </button>
              )}
              {retryCount >= 3 && (
                <p className="retry-message">
                  Multiple attempts failed. Please check your input or try again later.
                </p>
              )}
            </div>
          ) : (
            <>
              {result.sprintOverview && (
                <div className="response-section">
                  <p>📋 Sprint Overview:</p>
                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <p><strong>Sprint Duration:</strong> {result.sprintOverview.sprintDuration}</p>
                    <p><strong>Total Active Requests:</strong> {result.sprintOverview.totalActiveRequests}</p>
                    <p><strong>Team Capacity:</strong> {result.sprintOverview.teamCapacity}</p>
                    <p><strong>Sprint Goal:</strong> {result.sprintOverview.sprintGoal}</p>
                  </div>
                </div>
              )}

              {result.sprintBacklog && result.sprintBacklog.length > 0 && (
                <div className="response-section">
                  <p>📊 Sprint Backlog:</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#e9ecef' }}>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Request ID</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Requester</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Priority</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>System</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Issue</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Effort</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Assigned To</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Sprint Day</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.sprintBacklog.map((item, index) => (
                          <tr key={index} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.requestId}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.requester}</td>
                            <td style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6',
                              color: item.priority === 'HIGH' ? '#dc3545' : item.priority === 'MEDIUM' ? '#fd7e14' : '#198754',
                              fontWeight: 'bold'
                            }}>{item.priority}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.system}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.issue}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.estimatedEffort}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.assignedTo}</td>
                            <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.sprintDay}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.sprintPlanning && (
                <div className="response-section">
                  <p>🗓️ Sprint Planning (1 Week):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
                    {Object.entries(result.sprintPlanning).map(([day, tasks]) => (
                      <div key={day} style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>{day.toUpperCase()}</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {tasks.map((task, index) => (
                            <li key={index} style={{ fontSize: '13px', marginBottom: '5px' }}>{task}</li>
                          ))}
              </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.teamAssignment && result.teamAssignment.length > 0 && (
                <div className="response-section">
                  <p>👥 Team Assignment:</p>
                  <ul>
                    {result.teamAssignment.map((assignment, index) => {
                      const isTeamLead = assignment.includes('Team Lead');
                      const isMERN = assignment.includes('MERN Developer');
                      const isTester = assignment.includes('Software Tester');
                      const isUIUX = assignment.includes('UI/UX Designer');
                      const isMarketing = assignment.includes('Marketing Analyst');
                      
                      let borderColor = '#007bff'; // default blue
                      if (isTeamLead) borderColor = '#dc3545'; // red for team lead
                      else if (isMERN) borderColor = '#0d6efd'; // blue for MERN developer
                      else if (isTester) borderColor = '#fd7e14'; // orange for tester
                      else if (isUIUX) borderColor = '#6f42c1'; // purple for UI/UX
                      else if (isMarketing) borderColor = '#198754'; // green for marketing
                  
                  return (
                        <li key={index} style={{ borderLeftColor: borderColor, fontWeight: 'bold' }}>
                          {assignment}
                    </li>
                  );
                    })}
                  </ul>
                </div>
              )}

              {result.riskAssessment && result.riskAssessment.length > 0 && (
                <div className="response-section">
                  <p>⚠️ Risk Assessment:</p>
                  <ul>
                    {result.riskAssessment.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.successMetrics && result.successMetrics.length > 0 && (
                <div className="response-section">
                  <p>🎯 Success Metrics:</p>
                  <ul>
                    {result.successMetrics.map((metric, index) => (
                      <li key={index}>{metric}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Custom Analysis Results */}
              {result.analysis && (
                <div className="response-section">
                  <p>🤖 Custom Analysis Results:</p>
                  <div style={{ 
                    background: '#ffffff', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {result.analysis}
                  </div>
                  {result.prompt && (
                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
                      <strong>Your Prompt:</strong> {result.prompt}
                    </div>
                  )}
                  {result.hasSheetData && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#28a745' }}>
                      ✅ Analysis based on Google Sheet data
                    </div>
                  )}
                </div>
              )}

              {/* Fallback for old format */}
              {!result.sprintOverview && !result.analysis && result.mainIssues && (
                <div className="response-section">
                  <p>🚨 Critical IT Issues Analysis:</p>
                  <ul>
                    {result.mainIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
              </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedBackAnalysis;

