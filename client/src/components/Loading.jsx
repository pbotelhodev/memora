import React from "react";
import "../styles/Loading.css";

const Loading = ({ message = "Processando..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default Loading;
