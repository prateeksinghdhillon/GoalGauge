import React from "react";
import "./loader.css"; // Ensure CSS is valid and doesn't have issues.

const LoaderComponent = () => {
  return (
    <div className="loader-overlay">
      <div className="loader"></div>
    </div>
  );
};

export default LoaderComponent;
