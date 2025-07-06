import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Spinner, Card } from 'react-bootstrap';

const AnalysisDetailPage = () => {
  const { topic } = useParams();
  const location = useLocation();
  const rawText = location.state?.rawText || '';
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/multi-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actions: [decodeURIComponent(topic)], rawText })
        });

        const data = await res.json();
        setResult(data.response || "No analysis available.");
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        setResult("Error fetching analysis.");
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [topic, rawText]);

  return (
    <Container className="my-5">
      <h3>🔍 Deep Dive on: {decodeURIComponent(topic)}</h3>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Card className="mt-3">
          <Card.Body>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{result}</pre>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AnalysisDetailPage;
