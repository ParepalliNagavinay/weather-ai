import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Travel from "./pages/Travel";
import Photography from "./pages/Photography";
import FeatureInsight from "./pages/FeatureInsight";
import Favorites from "./pages/Favorites";
import WeatherComparison from "./pages/WeatherComparison";
import SavedComparisons from "./pages/SavedComparisons";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth key="login" type="login" />} />
        <Route path="/signup" element={<Auth key="signup" type="signup" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/comparison" element={<WeatherComparison />} />
        <Route path="/saved-comparisons" element={<SavedComparisons />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/insight" element={<FeatureInsight />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
