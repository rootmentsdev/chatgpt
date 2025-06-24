// import React, { useState } from 'react';

// const FeedBackAnalysis = () => {
//   const [file, setFile] = useState(null);
//   const [googleLink, setGoogleLink] = useState('');
//   const [paragraph, setParagraph] = useState('');
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setResult(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setResult(null);

//     try {
//       let res;

//       if (file) {
//         const formData = new FormData();
//         formData.append("file", file);
//         const isCSV = file.name.endsWith(".csv");

//         res = await fetch(`http://localhost:5000/api/${isCSV ? 'analyze-csv' : 'analyze-pdf'}`, {
//           method: "POST",
//           body: formData,
//         });
//       } else if (googleLink.trim()) {
//         res = await fetch("http://localhost:5000/api/analyze-sheet", {
//           method: "POST",
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ sheetUrl: googleLink })
//         });
//       } else if (paragraph.trim()) {
//         res = await fetch("http://localhost:5000/api/analyze-text", {
//           method: "POST",
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ text: paragraph })
//         });
//       } else {
//         alert("Please provide a file, Google Sheet link, or paragraph.");
//         setLoading(false);
//         return;
//       }

//       const data = await res.json();
//       setResult(data);
//     } catch (err) {
//       console.error("❌ Error analyzing:", err);
//       setResult({ error: "Something went wrong during analysis." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
//       <h2>📊 Store Feedback Analyzer</h2>
//       <form onSubmit={handleSubmit}>
//         <label>Upload PDF or CSV:</label>
//         <input type="file" accept=".pdf,.csv" onChange={handleFileChange} />
//         <br /><br />

//         <label>Or Google Sheet Link:</label>
//         <input
//           type="text"
//           placeholder="Paste public Google Sheet link..."
//           value={googleLink}
//           onChange={(e) => setGoogleLink(e.target.value)}
//           style={{ width: '100%', padding: '0.5rem' }}
//         />
//         <br /><br />

//         <label>Or Paste Paragraph:</label>
//         <textarea
//           placeholder="Type or paste customer feedback here..."
//           value={paragraph}
//           onChange={(e) => setParagraph(e.target.value)}
//           rows={5}
//           style={{ width: '100%', padding: '0.5rem' }}
//         />
//         <br /><br />

//         <button type="submit" disabled={loading}>
//           {loading ? "Analyzing..." : "Submit for Analysis"}
//         </button>
//       </form>

//       {result && (
//         <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "1rem", borderRadius: "6px" }}>
//           <h4>🧠 AI Result:</h4>
//           {result.error ? (
//             <p style={{ color: "red" }}>{result.error}</p>
//           ) : (
//             <>
//               <p><strong>🔴 Issues:</strong> {result.mainIssues?.join(", ") || "None"}</p>
//               <p><strong>⚠️ Root Causes:</strong> {result.rootCauses?.join(", ") || "None"}</p>
//               <p><strong>✅ Action Plan:</strong></p>
//               <ul>
//                 {result.actionPlan?.length ? result.actionPlan.map((step, index) => (
//                   <li key={index}>{step}</li>
//                 )) : <li>No suggestions available</li>}
//               </ul>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FeedBackAnalysis;

import React, { useState } from 'react';
import { Button, Container, Form, Card } from 'react-bootstrap';
import botImage from '../assets/ai-chat.png'; // Make sure to replace with your correct path

const FeedBackAnalysis = () => {
  const [file, setFile] = useState(null);
  const [combinedInput, setCombinedInput] = useState('');
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

        res = await fetch(`http://localhost:5000/api/${isCSV ? 'analyze-csv' : 'analyze-pdf'}`, {
          method: "POST",
          body: formData,
        });
      } else if (combinedInput.includes('docs.google.com')) {
        res = await fetch("http://localhost:5000/api/analyze-sheet", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: combinedInput.trim() })
        });
      } else if (combinedInput.trim()) {
        res = await fetch("http://localhost:5000/api/analyze-text", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: combinedInput.trim() })
        });
      } else {
        alert("Please upload a file or enter some text/link.");
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #000000, #1c1c1c)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Container style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div className="mx-auto mb-4 px-3 py-1 rounded-pill text-dark fw-bold"
          style={{ backgroundColor: '#bfff00', width: 'fit-content' }}>
          Chatie
        </div>

        {/* Bot Image */}
      <div className="text-center">
  <img 
    src={botImage} 
    alt="AI Bot" 
    style={{ width: '400px', marginBottom: '20px' }} 
  />
  <h2 className="mb-4">How may I help you today!</h2>
</div>


        <Form onSubmit={handleSubmit}>
          {/* Combined Input + File Upload Bar */}
          <Form.Group className="mb-3">
            <div
              className="d-flex align-items-center"
              style={{
                backgroundColor: 'white',
                borderRadius: '30px',
                padding: '6px 15px',
                border: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Ask a question..."
                value={combinedInput}
                onChange={(e) => setCombinedInput(e.target.value)}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  fontSize: '16px',
                  height: '40px',
                  flex: 1,
                  backgroundColor: 'transparent',
                }}
              />

              <label htmlFor="fileUpload" style={{ cursor: 'pointer', marginLeft: '10px' }} title="Upload PDF/CSV">
                ➕
              </label>
              <input
                type="file"
                id="fileUpload"
                accept=".pdf,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {file && <small className="text-muted mt-1 d-block">{file.name}</small>}
          </Form.Group>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="light"
            className="w-100 rounded-pill"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Chatie'}
          </Button>
        </Form>

        {/* AI Result Display */}
        {result && (
          <Card className="mt-4 bg-dark text-white border-0 shadow">
            <Card.Body>
              <h5>🧠 AI Result</h5>
              {result.error ? (
                <p className="text-danger">{result.error}</p>
              ) : (
                <>
                  <p><strong>🔴 Issues:</strong> {result.mainIssues?.join(", ") || "None"}</p>
                  <p><strong>⚠️ Root Causes:</strong> {result.rootCauses?.join(", ") || "None"}</p>
                  <p><strong>✅ Action Plan:</strong></p>
                  <ul>
                    {result.actionPlan?.length
                      ? result.actionPlan.map((step, i) => <li key={i}>{step}</li>)
                      : <li>No suggestions available</li>}
                  </ul>
                </>
              )}
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default FeedBackAnalysis;
