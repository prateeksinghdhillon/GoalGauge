import React, { createContext, useCallback, useEffect, useState } from "react";
import LoaderComponent from "../../components/loader/loader";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    localStorage.removeItem("fullname");
    localStorage.removeItem("email");
    signOut(auth);
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        login({
          fullname: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          uid:firebaseUser.uid
        });
      } else {
        logout();
      }
      setLoading(false); // Loading complete after auth state and session check
    });

    return () => unsubscribe();
  }, [logout]);

  const login = (userData) => {
    // Save user details to localStorage
    localStorage.setItem("fullname", userData.fullname ?? "");
    localStorage.setItem("email", userData.email ?? "");
    setIsLoggedIn(true);
    setUser(userData);
  };

  if (loading) return <LoaderComponent />; // Optional loading indicator

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
