
import React, { useState } from 'react';
import './FeedBackAnalysis.css';

const FeedBackAnalysis = () => {
  const [file, setFile] = useState(null);
  const [googleLink, setGoogleLink] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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

        res = await fetch(`https://chatgpt-1-ovts.onrender.com/api/${isCSV ? 'analyze-csv' : 'analyze-pdf'}`, {
          method: "POST",
          body: formData,
        });
      } else if (googleLink.trim()) {
        res = await fetch("https://chatgpt-1-ovts.onrender.com/api/analyze-sheet", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: googleLink })
        });
      } else if (paragraph.trim()) {
        res = await fetch("https://chatgpt-1-ovts.onrender.com/api/analyze-text", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paragraph })
        });
      } else {
        alert("Please provide a file, Google Sheet link, or paragraph.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("❌ Error analyzing:", err);
      setResult({ error: "Something went wrong during analysis." });
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
      </form>

      {result && (
        <div className="chat-response">
          <h4>🧠 AI Result:</h4>
          {result.error ? (
            <p className="error-text">{result.error}</p>
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

