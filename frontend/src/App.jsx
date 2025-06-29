import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Chat from './pages/Chat';
import FeedBackAnalysis from './pages/FeedBackAnalysis';


function App() {
  return (
    <Router>
      <Routes>
      
        <Route path="/chat" element={<Chat />} />
        <Route path="/" element={<FeedBackAnalysis />} />
   
      </Routes>
    </Router>
  );
}

export default App;


