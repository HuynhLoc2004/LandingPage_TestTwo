import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import NotificationBar from "./components/NotificationBar";
import LoadingOverlay from "./components/LoadingOverlay";
import api from "./api/axios";

const OrderDashboard = lazy(() => import("./OrderDashboard/OrderDashboard"));

function AppContent() {
    const [notification, setNotification] = React.useState(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem("accessToken"));
    const [isLoading, setIsLoading] = React.useState(false);
    const [favorites, setFavorites] = React.useState([]);
    const navigate = useNavigate();
    const refreshTokenTimeoutRef = React.useRef(null);

    const showNotification = (message, type, duration = 5000) => {
        setNotification({ message, type, duration });
    };

    const fetchFavorites = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const response = await api.get("/favorites");
            setFavorites(response.data || []);
        } catch (error) {
            console.error("Failed to fetch favorites:", error);
            // Don't show a notification for this, as it might be noisy
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const setupRefreshTokenTimer = useCallback(() => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length !== 3) {
                console.error("Invalid access token format:", accessToken);
                handleLogout();
                return;
            }
            try {
                const decodedToken = JSON.parse(atob(tokenParts[1]));
                const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();
                const timeUntilExpiration = expirationTime - currentTime;

                // Refresh token 1 minute before it expires
                const refreshThreshold = 60 * 1000; 

                if (timeUntilExpiration > refreshThreshold) {
                    refreshTokenTimeoutRef.current = setTimeout(async () => {
                        try {
                            const response = await api.post("/auth/refresh-token", {}, { withCredentials: true });
                            localStorage.setItem("accessToken", response.data.accessToken);
                            setupRefreshTokenTimer(); // Reset timer with new token
                        } catch (error) {
                            console.error("Failed to refresh token:", error);
                            // If refresh fails, force logout
                            handleLogout();
                        }
                    }, timeUntilExpiration - refreshThreshold);
                } else if (timeUntilExpiration > 0) {
                    // If expiration is soon but still valid, refresh immediately
                    refreshTokenTimeoutRef.current = setTimeout(async () => {
                        try {
                            const response = await api.post("/auth/refresh-token", {}, { withCredentials: true });
                            localStorage.setItem("accessToken", response.data.accessToken);
                            setupRefreshTokenTimer(); // Reset timer with new token
                        } catch (error) {
                            console.error("Failed to refresh token:", error);
                            handleLogout();
                        }
                    }, 1000); // Give it a second before trying to refresh
                } else {
                    // Token already expired, force logout
                    handleLogout();
                }
            } catch (error) {
                console.error("Error decoding access token:", error);
                handleLogout();
            }
        }
    }, []);

    useEffect(() => {
        setupRefreshTokenTimer();
        return () => {
            if (refreshTokenTimeoutRef.current) {
                clearTimeout(refreshTokenTimeoutRef.current);
            }
        };
    }, [setupRefreshTokenTimer]);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        showNotification("Login successful!", "success");
        fetchFavorites();
        setupRefreshTokenTimer(); // Start refresh timer on successful login
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await api.post("/auth/logout");
            showNotification("Logout successful!", "info");
        } catch (error) {
            console.error("Logout failed:", error);
            showNotification("Logout failed!", "error");
        } finally {
            localStorage.removeItem("accessToken");
            setIsLoggedIn(false);
            setFavorites([]);
            setIsLoading(false);
            if (refreshTokenTimeoutRef.current) {
                clearTimeout(refreshTokenTimeoutRef.current);
            }
            navigate("/");
        }
    };

    return (
        <>
            <NotificationBar
                message={notification?.message}
                type={notification?.type}
                duration={notification?.duration}
                onDone={() => setNotification(null)}
            />
            <LoadingOverlay isLoading={isLoading} />
            <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <LandingPage
                                showNotification={showNotification}
                                isLoggedIn={isLoggedIn}
                                onLoginSuccess={handleLoginSuccess}
                                onLogout={handleLogout}
                                setIsLoading={setIsLoading}
                                favorites={favorites}
                                setFavorites={setFavorites}
                                fetchFavorites={fetchFavorites}
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
