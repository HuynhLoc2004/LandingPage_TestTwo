import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import NotificationBar from "./components/NotificationBar";
import LoadingOverlay from "./components/LoadingOverlay"; // Import LoadingOverlay
import api from "./api/axios"; // Import the configured axios instance

const OrderDashboard = lazy(() =>
  import("./OrderDashboard/OrderDashboard"),
);

function AppContent() {
  const [notification, setNotification] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem("accessToken"));
  const [isLoading, setIsLoading] = React.useState(false); // Add loading state
  const navigate = useNavigate();

  const showNotification = (message, type, duration) => {
    setNotification({ message, type, duration });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    showNotification("Login successful!", "success");
  };

  const handleLogout = async () => {
    setIsLoading(true); // Set loading to true
    try {
      await api.post("/users/logout", {});
      showNotification("Logout successful!", "info");
    } catch (error) {
      console.error("Logout failed:", error);
      showNotification("Logout failed!", "error");
    } finally {
      localStorage.removeItem("accessToken");
      setIsLoggedIn(false);
      setIsLoading(false); // Set loading to false
      navigate("/"); // Redirect to home page after logout
    }
  };

  return (
    <>
      <NotificationBar
        message={notification?.message}
        type={notification?.type}
        duration={notification?.duration}
      />
      <LoadingOverlay isLoading={isLoading} /> {/* Add LoadingOverlay */}
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
                setIsLoading={setIsLoading} // Pass setIsLoading to LandingPage
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
