import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FlowChat from './FlowChat';
import InvitationAccept from './components/InvitationAccept';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FlowChat />} />
        <Route path="/flowchat" element={<FlowChat />} />
        <Route 
          path="/accept-invitation/:invitationId" 
          element={<InvitationAccept />} 
        />
      </Routes>
    </Router>
  );
}

export default App; 