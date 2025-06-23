// src/pages/Chat.jsx
import { useState } from 'react';

const Chat = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input || input.trim() === "") {
      alert("Please enter a question");
      return;
    }

    console.log("✍️ User input:", input);

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      console.log("🧠 Response from backend:", data);
      setResponse(data.reply || "❌ No reply received.");
    } catch (err) {
      console.error("⚠️ Fetch error:", err.message);
      setResponse('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ask DeepSeek AI</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          style={{ width: '70%', padding: '0.5rem' }}
        />
        <button type="submit" style={{ marginLeft: '1rem' }} disabled={loading}>
          {loading ? "Waiting..." : "Send"}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem' }}>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default Chat;
