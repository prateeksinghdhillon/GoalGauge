import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "../utils/context/AuthContext";
import LoginWithGoogle from "../components/login/login";
import Navbar from "../components/navbar/navbar";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProgressPage from "../pages/Progress/ProgressPage";
import "./home.css";

const Home = () => {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <>
      {!isLoggedIn ? (
        <div
          style={{
            backgroundColor: "#000",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoginWithGoogle />
        </div>
      ) : (
        <Router>
          <div
            style={{
              backgroundColor: "#121212",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Navbar user={user} onLogout={logout} />

            <div className="content-container">
              <Routes>
                <Route path="/" element={<Dashboard userId={user.uid} />} />
                <Route
                  path="/progress"
                  element={<ProgressPage userId={user.uid} />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      )}
    </>
  );
};

export default Home;
