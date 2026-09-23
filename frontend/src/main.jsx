import "./Club.css";
import ProtectedRoute from "./ProtectedRoute.jsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/admin/Admin.jsx";
import Usuario from "./pages/usuario/Usuario.jsx";
import Jefe from "./pages/Jefe.jsx";
import Contador from "./pages/Contador.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute rol="admin"><Admin /></ProtectedRoute>} />
        <Route path="/usuario" element={<ProtectedRoute rol="usuario"><Usuario /></ProtectedRoute>} />
        <Route path="/jefe" element={<ProtectedRoute rol="jefe"><Jefe /></ProtectedRoute>} />
        <Route path="/contador" element={<ProtectedRoute rol="contador"><Contador /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);