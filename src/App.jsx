import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Travel from "./pages/Travel";
import Photography from "./pages/Photography";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth key="login" type="login" />} />
        <Route path="/signup" element={<Auth key="signup" type="signup" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/photography" element={<Photography />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
