import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Card } from 'react-bootstrap';

const AnalysisDetailPage = () => {
  const { topic } = useParams();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/deep-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        });
        const data = await res.json();
        setResult(data.response || "No analysis available.");
      } catch (err) {
        setResult("Error fetching analysis.");
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [topic]);

  return (
    <Container className="my-5">
      <h3>🔍 Deep Dive on: {decodeURIComponent(topic)}</h3>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Card className="mt-3">
          <Card.Body>{result}</Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AnalysisDetailPage;
