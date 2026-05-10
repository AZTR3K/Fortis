import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./components/layout/Shell";
import Dashboard from "./pages/Dashboard";
import AthleteProfile from "./pages/AthleteProfile";
import Predict from "./pages/Predict";

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/athlete/:id" element={<AthleteProfile />} />
          <Route path="/athlete/:id/predict" element={<Predict />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
