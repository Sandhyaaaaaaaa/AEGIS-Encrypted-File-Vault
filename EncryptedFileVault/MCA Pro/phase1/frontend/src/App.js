import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import MyFiles from "./pages/MyFiles";
import About from "./pages/About";
import Contact from "./pages/contactus";
import Feedback from "./pages/Feedback";
import ForgotPassword from "./pages/ForgotPassword";
import MFASetup from "./pages/MFASetup"; // ✅ NEW
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import SharedFiles from "./pages/SharedFiles";
import AIAdvisor from "./pages/AIAdvisor";
import AIAgent from "./components/AIAgent";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mfa-setup" element={<MFASetup />} /> {/* ✅ NEW */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/myfiles" element={<MyFiles />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shared" element={<SharedFiles />} />
        <Route path="/ai-advisor" element={<AIAdvisor />} />
      </Routes>
      <AIAgent />
    </Router>
  );
};

export default App;