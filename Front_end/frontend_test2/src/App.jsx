import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";

const OrderDashboard = lazy(() =>
  import("./OrderDashboard/OrderDashboard"),
);

function App() {
  return (
    <Router>
      <Suspense
        fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<OrderDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
