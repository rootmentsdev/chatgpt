import React, { useState } from 'react';
import {
  Container, Form, Button, Spinner, Card, ListGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const FeedBackInputPage = () => {
  const [paragraph, setParagraph] = useState('');
  const [googleLink, setGoogleLink] = useState('');
  const [file, setFile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      let res, data;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch(`http://localhost:5000/api/extract-tags-csv`, {
          method: 'POST',
          body: formData
        });

      } else if (googleLink.trim()) {
        res = await fetch(`http://localhost:5000/api/extract-tags-sheet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: googleLink })
        });

      } else if (paragraph.trim()) {
        res = await fetch(`http://localhost:5000/api/extract-suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paragraph })
        });
      } else {
        alert("Please provide a file, paragraph, or Google Sheet link.");
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error("Invalid response: " + text);
      }

      data = await res.json();
      setSuggestions(data?.suggestions || []);
      setRawText(data?.rawText || paragraph);

    } catch (err) {
      console.error("❌ Analyze Error:", err);
      alert("Failed to analyze feedback. Check console.");
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

      <Button onClick={handleAnalyze} disabled={loading} className="w-100">
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
                  onClick={() => navigate(`/details/${encodeURIComponent(topic)}`, {
                    state: { rawText }
                  })}
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
