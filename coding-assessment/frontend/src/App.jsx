import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import CodingAssessment from "./pages/CodingAssessment.jsx";
import Results from "./pages/Results.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/assessment/:assessmentId" element={<CodingAssessment />} />
      <Route path="/results/:assessmentId" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
