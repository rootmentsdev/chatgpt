import { useState } from 'react';
import { Button, Container, Form, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import botImage from '../assets/ai-chat.png'; // Replace with your image path

const Chat = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      alert("Please enter a question");
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('https://chatgpt-1-ovts.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.reply || "❌ No reply received.");
    } catch (err) {
      setResponse('Error: ' + err.message);
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
      <Container>
        <div className="text-center">

          {/* AI Label */}
          <div
            className="mx-auto mb-3 px-3 py-1 rounded-pill"
            style={{ backgroundColor: '#bfff00', color: '#000', fontWeight: 'bold', width: 'fit-content' }}
          >
            Thinkie
          </div>

          {/* Bot Image */}
          <div className="mb-3">
            <img
              src={botImage}
              alt="AI Bot"
              className="img-fluid"
              style={{ maxWidth: '400px', width: '100%' }}
            />
          </div>

          {/* Heading */}
          <h2 className="mb-4">How may I help you today!</h2>

          {/* Chat Input Form */}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="chatInput">
              <Form.Control
                type="text"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ borderRadius: '30px', padding: '0.75rem', fontSize: '1rem' }}
              />
            </Form.Group>

            <Row className="mt-3">
              <Col xs={12} md={6} className="mb-2 mb-md-0">
                <Button
                  type="submit"
                  variant="light"
                  className="w-100 rounded-pill"
                  disabled={loading}
                >
                  {loading ? 'Waiting...' : 'Thinkie'}
                </Button>
              </Col>
              <Col xs={12} md={6}>
                <Link to="/chat">
                  <Button
                    variant="success"
                    className="w-100 rounded-pill"
                    style={{ backgroundColor: '#bfff00', color: '#000', fontWeight: 'bold' }}
                  >
                    Chatie
                  </Button>
                </Link>
              </Col>
            </Row>
          </Form>

          {/* Response Box */}
          {response && (
            <Card className="mt-4 mx-auto" style={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
              <Card.Body>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Segoe UI", Roboto, "Courier New", monospace',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '10px',
                  overflowX: 'auto'
                }}>
                  {response}
                </pre>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Chat;
