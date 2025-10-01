
import React, { useState } from 'react';
import './FeedBackAnalysis.css';

const FeedBackAnalysis = () => {
  const [file, setFile] = useState(null);
  const [googleLink, setGoogleLink] = useState('');
  const [paragraph, setParagraph] = useState('');
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

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const isCSV = file.name.endsWith(".csv");

        res = await fetch(`http://localhost:5000/api/${isCSV ? 'analyze-csv' : 'analyze-pdf'}`, {
          method: "POST",
          body: formData,
        });
      } else if (googleLink.trim()) {
        res = await fetch("http://localhost:5000/api/analyze-sheet", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: googleLink })
        });
      } else if (paragraph.trim()) {
        res = await fetch("http://localhost:5000/api/analyze-text", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paragraph })
        });
      } else {
        alert("Please provide a DSR file, Google Sheet link, or paste DSR data.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log("📊 Analysis result:", data);
      setResult(data);
    } catch (err) {
      console.error("❌ Error analyzing:", err);
      setResult({ 
        error: err.message || "Something went wrong during DSR analysis. Please check your data and try again.",
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
        <h1>Comprehensive DSR Performance Analyzer</h1>
        <p>Identifies underperforming stores with priority-based action plans (HIGH/MEDIUM/LOW urgency)</p>
        <button
          onClick={async () => {
            try {
              const res = await fetch("http://localhost:5000/api/test-key");
              const data = await res.json();
              if (data.success) {
                alert(`✅ API Connection Working!\nResponse: ${data.response}`);
              } else {
                alert(`❌ API Error: ${data.error}`);
              }
            } catch (err) {
              alert(`❌ Connection Failed: ${err.message}`);
            }
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '10px'
          }}
        >
          🧪 Test API Connection
        </button>
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <label>Upload DSR Report (PDF/CSV):</label>
          <input type="file" accept=".pdf,.csv" onChange={handleFileChange} />
        </div>

        <div className="input-group">
          <label>Or Google Sheet DSR Link:</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Paste public Google Sheet DSR link..."
              value={googleLink}
              onChange={(e) => setGoogleLink(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
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
              style={{
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Test
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>Or Paste DSR Data:</label>
          <textarea
            placeholder="Copy and paste your DSR data here (store names, sales figures, L2L percentages, walk-ins, conversions, loss of sales, etc.)..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            rows={5}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Analyzing Performance..." : "Generate Comprehensive Analysis"}
        </button>
        
        {loading && (
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            Analyzing L2L performance, conversion rates, walk-ins vs bills trends, classifying priority levels (HIGH/MEDIUM/LOW urgency)...
          </p>
        )}
      </form>

      {result && (
        <div className="chat-response">
          <h4>📊 Comprehensive DSR Performance Report:</h4>
          {result.error ? (
            <div>
              <p className="error-text">{result.error}</p>
              {result.canRetry && retryCount < 3 && (
                <button 
                  onClick={() => {
                    setResult(null);
                    handleSubmit({ preventDefault: () => {} });
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Retry Analysis
                </button>
              )}
              {retryCount >= 3 && (
                <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>
                  Multiple attempts failed. Please check your input or try again later.
                </p>
              )}
            </div>
          ) : (
            <>
              <p><strong>🚨 Underperforming Stores Analysis:</strong></p>
              <ul>
                {result.mainIssues?.length ? result.mainIssues.map((issue, index) => (
                  <li key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#d32f2f' }}>{issue}</li>
                )) : <li>No underperforming stores detected</li>}
              </ul>
              
              <p><strong>🔍 Walk-ins vs Bills vs Quantity Trend Analysis:</strong></p>
              <ul>
                {result.rootCauses?.length ? result.rootCauses.map((cause, index) => (
                  <li key={index} style={{ marginBottom: '8px', fontSize: '14px' }}>{cause}</li>
                )) : <li>Analysis in progress</li>}
              </ul>
              
              <p><strong>⚡ Priority Action Plan (HIGH/MEDIUM/LOW Urgency):</strong></p>
              <ul>
                {result.actionPlan?.length ? result.actionPlan.map((step, index) => {
                  const isHigh = step.includes('HIGH:');
                  const isMedium = step.includes('MEDIUM:');
                  const isLow = step.includes('LOW:');
                  let color = '#2e7d32'; // default green
                  if (isHigh) color = '#d32f2f'; // red for high
                  else if (isMedium) color = '#f57c00'; // orange for medium
                  else if (isLow) color = '#1976d2'; // blue for low
                  
                  return (
                    <li key={index} style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: color }}>
                      {step}
                    </li>
                  );
                }) : <li>No specific actions available</li>}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedBackAnalysis;

