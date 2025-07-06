import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Chat from './pages/Chat';
import FeedBackAnalysis from './pages/FeedBackAnalysis';
import DetailAnalysis from './pages/DetailAnalysis';


function App() {
  return (
    <Router>
      <Routes>
      
        <Route path="/chat" element={<Chat />} />
        <Route path="/" element={<FeedBackAnalysis />} />
         <Route path="/details/:topic" element={<DetailAnalysis />} />
   
      </Routes>
    </Router>
  );
}

export default App;


