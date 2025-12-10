import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Lock, Mail, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import "../styles/PainelAdmin.css";
import logoMemora from "../assets/logo-memora.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Verifica sessão ao carregar a página
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await validarAdmin(session.user.id);
    }
  };

  const validarAdmin = async (userId) => {
    try {
      // Tenta buscar o usuário na tabela admins
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro SQL:", error.message);
        throw new Error("Erro de conexão ao verificar admin.");
      }

      if (!data) {
        console.warn("Usuário existe no Auth, mas não na tabela Admins.");
        throw new Error("Este usuário não tem permissão de administrador.");
      }

      // SUCESSO!
      console.log("Admin logado:", data.nome);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Falha na validação:", err);
      await supabase.auth.signOut(); // Desloga se não for admin
      setErrorMsg(err.message);
      setLoading(false); // Para o loading
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Login no Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error("Email ou senha incorretos.");

      // 2. Se logou, verifica a tabela admins
      if (data.user) {
        await validarAdmin(data.user.id);
      }
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-bg"></div>

      <div className="login-card fade-in">
        <div className="login-header">
          <img src={logoMemora} alt="Smarttex Admin" className="admin-logo" />
          <h2>Painel Administrativo</h2>
          <p>Acesso restrito à equipe Smarttex</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group-admin">
            <div className="icon-box">
              <Mail size={20} />
            </div>
            <input
              type="email"
              placeholder="Email Corporativo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-admin">
            <div className="icon-box">
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="Senha de Acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className="error-banner">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button type="submit" className="btn-admin-login" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" /> Verificando...
              </>
            ) : (
              <>
                <ShieldCheck size={20} /> Acessar Painel
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Sistema monitorado. Seu IP foi registrado.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
