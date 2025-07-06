



// import React, { useState } from 'react';
// import {
//   Container, Form, Button, Row, Col, Spinner, Alert, Card, ListGroup
// } from 'react-bootstrap';

// const FeedBackAnalysis = () => {
//   const [file, setFile] = useState(null);
//   const [googleLink, setGoogleLink] = useState('');
//   const [paragraph, setParagraph] = useState('');
//   const [model, setModel] = useState('mistralai/mistral-7b-instruct');
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [tokenUsage, setTokenUsage] = useState(null);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setResult(null);
//     setTokenUsage(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setResult(null);
//     setTokenUsage(null);

//     try {
//       let res;
//       let apiEndpoint = '';
//       let bodyData = null;
//       let headers = { 'Content-Type': 'application/json' };

//       if (file) {
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("model", model);
//         apiEndpoint = file.name.endsWith(".csv") ? "analyze-csv" : "analyze-pdf";
//         res = await fetch(`http://localhost:5000/api/${apiEndpoint}`, {
//           method: "POST",
//           body: formData,
//         });
//       } else if (googleLink.trim()) {
//         apiEndpoint = "analyze-sheet";
//         bodyData = JSON.stringify({ sheetUrl: googleLink, model });
//         res = await fetch(`http://localhost:5000/api/${apiEndpoint}`, {
//           method: "POST",
//           headers,
//           body: bodyData
//         });
//       } else if (paragraph.trim()) {
//         apiEndpoint = "analyze-text";
//         bodyData = JSON.stringify({ text: paragraph, model });
//         res = await fetch(`http://localhost:5000/api/${apiEndpoint}`, {
//           method: "POST",
//           headers,
//           body: bodyData
//         });
//       } else {
//         alert("Please provide a file, Google Sheet link, or paragraph.");
//         setLoading(false);
//         return;
//       }

//       const data = await res.json();
//       setResult(data);
//       setTokenUsage(data.tokenUsage || null);
//     } catch (err) {
//       console.error("❌ Error analyzing:", err);
//       setResult({ error: "Something went wrong during analysis." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container className="my-5">
//       <h2 className="text-center mb-4">📊ROOT GPT</h2>

//       <Form onSubmit={handleSubmit}>
//         <Row className="mb-3">
//           <Col md={6}>
//             <Form.Group>
//               <Form.Label>Select AI Model</Form.Label>
//               <Form.Select value={model} onChange={(e) => setModel(e.target.value)}>
//                 <option value="mistralai/mistral-7b-instruct">Mistral 7B (Free)</option>
//                 <option value="openrouter/cinematika-7b">Cinematika 7B (Free)</option>
//                 <option value="gryphe/mythomist-7b">MythoMist 7B (Free)</option>
//                 <option value="openchat/openchat-7b">OpenChat 7B (Free)</option>
//               </Form.Select>
//             </Form.Group>
//           </Col>
//           <Col md={6}>
//             <Form.Group>
//               <Form.Label>Upload PDF or CSV</Form.Label>
//               <Form.Control type="file" accept=".pdf,.csv" onChange={handleFileChange} />
//             </Form.Group>
//           </Col>
//         </Row>

//         <Form.Group className="mb-3">
//           <Form.Label>Or Google Sheet Link</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Paste public Google Sheet link..."
//             value={googleLink}
//             onChange={(e) => setGoogleLink(e.target.value)}
//           />
//         </Form.Group>

//         <Form.Group className="mb-3">
//           <Form.Label>Or Paste Paragraph</Form.Label>
//           <Form.Control
//             as="textarea"
//             rows={4}
//             placeholder="Paste customer feedback here..."
//             value={paragraph}
//             onChange={(e) => setParagraph(e.target.value)}
//           />
//         </Form.Group>

//         <Button type="submit" variant="primary" disabled={loading} className="w-25">
//           {loading ? <Spinner animation="border" size="sm" /> : "Submit for Analysis"}
//         </Button>
//       </Form>

//       {result && (
//         <Card className="mt-4 shadow">
//           <Card.Body>
//             <Card.Title>🧠 AI Result</Card.Title>

//             {result.error ? (
//               <Alert variant="danger">{result.error}</Alert>
//             ) : (
//               <>
//                 <p><strong>🔴 Issues:</strong> {result.mainIssues?.join(", ") || "None"}</p>
//                 <p><strong>⚠️ Root Causes:</strong> {result.rootCauses?.join(", ") || "None"}</p>
//                 <p><strong>✅ Action Plan:</strong></p>
//                 <ListGroup variant="flush">
//                   {result.actionPlan?.length ? result.actionPlan.map((step, index) => (
//                     <ListGroup.Item key={index}>{step}</ListGroup.Item>
//                   )) : <ListGroup.Item>No suggestions available</ListGroup.Item>}
//                 </ListGroup>
//               </>
//             )}

//             {tokenUsage && (
//               <div className="mt-4">
//                 <h6>📊 Token Usage:</h6>
//                 <ul className="mb-0">
//                   <li>📝 Input Tokens: {tokenUsage.prompt}</li>
//                   <li>💬 Output Tokens: {tokenUsage.completion}</li>
//                   <li>🔢 Total Tokens: {tokenUsage.total}</li>
//                 </ul>
//               </div>
//             )}
//           </Card.Body>
//         </Card>
//       )}
//     </Container>
//   );
// };

// export default FeedBackAnalysis;


// import React, { useState } from 'react';
// import {
//   Container, Form, Button, Row, Col, Spinner, Card, ListGroup
// } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';

// const FeedBackInputPage = () => {
//   const [paragraph, setParagraph] = useState('');
//   const [suggestions, setSuggestions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleAnalyze = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch('http://localhost:5000/api/extract-suggestions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text: paragraph })
//       });

//       const data = await res.json();
//       setSuggestions(data.suggestions || []);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to analyze suggestions.");
//     }
//     setLoading(false);
//   };

//   return (
//     <Container className="my-5">
//       <h3 className="text-center mb-4">📥 Paste Feedback to Get Insights</h3>
//       <Form.Group className="mb-3">
//         <Form.Control
//           as="textarea"
//           placeholder="Paste paragraph or feedback..."
//           rows={5}
//           value={paragraph}
//           onChange={(e) => setParagraph(e.target.value)}
//         />
//       </Form.Group>
//       <Button onClick={handleAnalyze} disabled={loading}>
//         {loading ? <Spinner animation="border" size="sm" /> : 'Analyze Feedback'}
//       </Button>

//       {suggestions.length > 0 && (
//         <Card className="mt-4 shadow">
//           <Card.Body>
//             <h5>🧠 AI Can Help With:</h5>
//             <ListGroup>
//               {suggestions.map((topic, index) => (
//                 <ListGroup.Item
//                   key={index}
//                   action
//                   onClick={() => navigate(`/details/${encodeURIComponent(topic)}`)}
//                 >
//                   {topic}
//                 </ListGroup.Item>
//               ))}
//             </ListGroup>
//           </Card.Body>
//         </Card>
//       )}
//     </Container>
//   );
// };

// export default FeedBackInputPage;



import React, { useState } from 'react';
import {
  Container, Form, Button, Row, Col, Spinner, Card, ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const FeedBackInputPage = () => {
  const [paragraph, setParagraph] = useState('');
  const [googleLink, setGoogleLink] = useState('');
  const [file, setFile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      let res;

      // 📎 File Upload
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const apiEndpoint = file.name.endsWith(".csv") ? "analyze-csv" : "analyze-pdf";
        res = await fetch(`http://localhost:5000/api/${apiEndpoint}`, {
          method: "POST",
          body: formData
        });

      // 🔗 Google Sheet Link
      } else if (googleLink.trim()) {
        res = await fetch('http://localhost:5000/api/analyze-sheet', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl: googleLink })
        });

      // 📝 Paragraph
      } else if (paragraph.trim()) {
        res = await fetch('http://localhost:5000/api/extract-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paragraph })
        });

      } else {
        alert("Please provide feedback using a file, paragraph or Google Sheet link.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else if (data?.mainIssues) {
        setSuggestions(data.mainIssues); // fallback if no suggestions key
      } else {
        setSuggestions([]);
        alert("No suggestions found in the feedback.");
      }

    } catch (err) {
      console.error(err);
      alert("Failed to analyze suggestions.");
    }

    setLoading(false);
  };

  return (
    <Container className="my-5">
      <h3 className="text-center mb-4">📥 Analyze Feedback for Suggestions</h3>

      <Form.Group className="mb-3">
        <Form.Label>Paste Paragraph</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          placeholder="Type or paste customer feedback..."
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Or Upload CSV or PDF</Form.Label>
        <Form.Control
          type="file"
          accept=".csv,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Or Paste Public Google Sheet Link</Form.Label>
        <Form.Control
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={googleLink}
          onChange={(e) => setGoogleLink(e.target.value)}
        />
      </Form.Group>

      <Button onClick={handleAnalyze} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : 'Analyze Feedback'}
      </Button>

      {suggestions.length > 0 && (
        <Card className="mt-4 shadow">
          <Card.Body>
            <h5>🧠 AI Can Help With:</h5>
            <ListGroup>
              {suggestions.map((topic, index) => (
                <ListGroup.Item
                  key={index}
                  action
                  onClick={() => navigate(`/details/${encodeURIComponent(topic)}`)}
                >
                  {topic}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FeedBackInputPage;
