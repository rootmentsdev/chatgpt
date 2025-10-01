
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
        alert("Please provide a file, Google Sheet link, or paragraph.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("📊 Analysis result:", data);
      setResult(data);
    } catch (err) {
      console.error("❌ Error analyzing:", err);
      setResult({ 
        error: err.message || "Something went wrong during analysis. Please check your input and try again.",
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
        <h1>Talk Feedback to Me</h1>
        <p>Choose one option to start analyzing customer feedback</p>
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <label>Upload PDF or CSV:</label>
          <input type="file" accept=".pdf,.csv" onChange={handleFileChange} />
        </div>

        <div className="input-group">
          <label>Or Google Sheet Link:</label>
          <input
            type="text"
            placeholder="Paste public Google Sheet link..."
            value={googleLink}
            onChange={(e) => setGoogleLink(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Or Paste Paragraph:</label>
          <textarea
            placeholder="Type or paste customer feedback here..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            rows={5}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Analyzing..." : "Submit for Analysis"}
        </button>
        
        {loading && (
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            This may take a few moments. Please wait...
          </p>
        )}
      </form>

      {result && (
        <div className="chat-response">
          <h4>🧠 AI Result:</h4>
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
              <p><strong>🔴 Issues:</strong> {result.mainIssues?.join(", ") || "None"}</p>
              <p><strong>⚠️ Root Causes:</strong> {result.rootCauses?.join(", ") || "None"}</p>
              <p><strong>✅ Action Plan:</strong></p>
              <ul>
                {result.actionPlan?.length ? result.actionPlan.map((step, index) => (
                  <li key={index}>{step}</li>
                )) : <li>No suggestions available</li>}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedBackAnalysis;

