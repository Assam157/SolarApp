import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SunTimelapsePlayer from './components/SunDispTimer';

import './components/SunTimelapsePlayer.css'
 

function App() {
  return (
    <Router>
      <Routes>
        {/* Home / Landing Page */}
        <Route path="/" element={<SunTimelapsePlayer />} />

        {/* Main Route */}
        <Route path="/main" element={<SunTimelapsePlayer />} />
      </Routes>
    </Router>
  );
}

export default App;

