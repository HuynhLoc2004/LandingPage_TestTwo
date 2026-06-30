import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import NotificationBar from "./components/NotificationBar";
import api from "./api/axios"; // Import the configured axios instance

const OrderDashboard = lazy(() =>
  import("./OrderDashboard/OrderDashboard"),
);

function AppContent() {
  const [notification, setNotification] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem("accessToken"));
  const navigate = useNavigate();

  const showNotification = (message, type, duration) => {
    setNotification({ message, type, duration });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    showNotification("Login successful!", "success");
  };

  const handleLogout = async () => {
    try {
      await api.post("/users/logout", {});
      localStorage.removeItem("accessToken");
      setIsLoggedIn(false);
      showNotification("Logout successful!", "info");
      navigate("/"); // Redirect to home page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      showNotification("Logout failed!", "error");
    }
  };

  return (
    <>
      <NotificationBar
        message={notification?.message}
        type={notification?.type}
        duration={notification?.duration}
      />
      <Suspense
        fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}
      >
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                showNotification={showNotification}
                isLoggedIn={isLoggedIn}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            }
          />
          <Route path="/dashboard" element={<OrderDashboard />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
