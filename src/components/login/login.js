import React from "react";
import "./loginWithGoogle.css";
import { getAuth, signInWithPopup } from "firebase/auth";
import { provider } from "../../utils/firebase";
const LoginWithGoogle = () => {
  const onLogin = () => {
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then(() => {
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <div className="login-container">
      <h2 className="login-title">Login with Google</h2>
      <button onClick={onLogin}  className="google-login-btn">
        <i className="fab fa-google google-icon"></i>
        Continue with Google
      </button>
    </div>
  );
};

export default LoginWithGoogle;
