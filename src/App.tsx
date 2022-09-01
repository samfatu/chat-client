import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from "./pages/Chat";
import Home from "./pages/Home";

function App() {

  return (
    <div className="App">
      <Router>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
