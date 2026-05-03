// src/Pages/Auth/LoginProfesseur.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function LoginProfesseur() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Email ou mot de passe incorrect."); return; }

      const role = data.profil?.role;
      if (role !== "coach") {
        setError("Accès refusé — ce compte n'est pas un compte coach BET.");
        return;
      }

      localStorage.setItem("coach_token",  data.session.access_token);
      localStorage.setItem("coach_refresh", data.session.refresh_token);
      localStorage.setItem("coach_profil",  JSON.stringify(data.profil));
      navigate("/espace-professeur");
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="adm-root">
        <div className="adm-left">
          <div className="adm-left-bg" />
          <div className="adm-blob1" />
          <div className="adm-blob2" />
          <div className="adm-blob3" />
          <div className="adm-left-content">
            <div className="adm-logo-area">
              <img src="/assets/BIINIES-ENGLISH-LOGO.png" alt="Binnie's English Training" className="adm-logo-img" />
              <div className="adm-logo-text">
                <div className="adm-logo-name"><span>Binnie's</span> English Training</div>
                <div className="adm-logo-sub">Centre de formation certifié</div>
              </div>
            </div>
            <h1 className="adm-headline">Enseignez,<br />accompagnez,<br /><span>transmettez.</span></h1>
            <p className="adm-sub">Gérez vos classes, suivez vos étudiants et diffusez vos ressources pédagogiques.</p>
            <div className="adm-pills">
              {["Gestion de classe","Suivi pédagogique","Ressources","Examens"].map(m=>(
                <span key={m} className="adm-pill">{m}</span>
              ))}
            </div>
            <div className="adm-stats">
              <div className="adm-stat"><div className="adm-stat-n">18</div><div className="adm-stat-l">Classes actives</div></div>
              <div className="adm-stat"><div className="adm-stat-n">245</div><div className="adm-stat-l">Étudiants suivis</div></div>
              <div className="adm-stat"><div className="adm-stat-n">128</div><div className="adm-stat-l">Ressources partagées</div></div>
            </div>
          </div>
        </div>

        <div className="adm-right">
          <div className="adm-profile-switch">
            <button className="adm-switch-btn" onClick={()=>navigate("/login-apprenant")}>Apprenant</button>
            <button className="adm-switch-btn active">Coach</button>
            <button className="adm-switch-btn" onClick={()=>navigate("/login-admin")}>Admin</button>
          </div>

          <div className="adm-form-wrap">
            <div className="adm-header">
              <img src="/assets/BIINIES-ENGLISH-LOGO.png" alt="Binnie's English Training" className="adm-logo-img" />
              <div className="adm-header-sep" />
              <div className="adm-header-role">Espace Coach</div>
            </div>

            <div className="adm-welcome">Bonjour 🎓</div>
            <h2 className="adm-title">Accédez à<br />votre espace</h2>
            <p className="adm-desc">Gérez vos cours, vos étudiants et vos évaluations.</p>

            {error && <div className="adm-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="adm-field">
                <label className="adm-label">Email professionnel</label>
                <div className="adm-input-wrap">
                  <span className="adm-input-icon">✉️</span>
                  <input className="adm-input" type="email" placeholder="prenom.nom@bet.ci"
                    value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" autoFocus />
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Mot de passe</label>
                <div className="adm-input-wrap">
                  <span className="adm-input-icon">🔒</span>
                  <input className="adm-input" type={showPwd?"text":"password"} placeholder="••••••••"
                    value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" className="adm-eye" onClick={()=>setShowPwd(v=>!v)}>
                    {showPwd?"🙈":"👁️"}
                  </button>
                </div>
              </div>
              <button className="adm-btn" type="submit" disabled={loading}>
                {loading ? <><div className="adm-spinner"/>Connexion…</> : <>Accéder à mon espace →</>}
              </button>
              <div className="adm-footer">Besoin d'aide ? <a href="#">Contacter le support</a></div>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        .adm-root { display: flex; height: 100vh; width: 100vw; font-family: 'Montserrat','Segoe UI',sans-serif; }
        .adm-left { width: 52%; position: relative; overflow: hidden; background: #0f172a; }
        .adm-left-bg { position: absolute; inset: 0; background: linear-gradient(160deg, #0f172a 0%, #0891b2 60%, #0e7490 100%); }
        .adm-blob1 { position: absolute; width: 420px; height: 420px; border-radius: 50%; background: rgba(8,145,178,0.15); top: -80px; left: -100px; animation: admFloat 8s ease-in-out infinite; }
        .adm-blob2 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: rgba(14,116,144,0.2); bottom: -60px; right: -60px; animation: admFloat 11s ease-in-out infinite reverse; }
        .adm-blob3 { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: rgba(220,38,38,0.1); top: 40%; left: 55%; animation: admFloat 7s ease-in-out infinite 2s; }
        @keyframes admFloat { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-20px) scale(1.04)} }
        .adm-left-content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 60px 56px; }
        .adm-logo-area { display: flex; align-items: center; gap: 14px; margin-bottom: 44px; }
        .adm-logo-img { height: 60px; width: 60px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)); }
        .adm-logo-text { display: flex; flex-direction: column; gap: 1px; }
        .adm-logo-name { font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 0.02em; line-height: 1.1; }
        .adm-logo-name span { color: #f87171; }
        .adm-logo-sub { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.5); letter-spacing: 0.18em; text-transform: uppercase; }
        .adm-headline { font-size: 46px; font-weight: 900; line-height: 1.08; color: #fff; margin-bottom: 20px; }
        .adm-headline span { color: #22d3ee; }
        .adm-sub { font-size: 15px; font-weight: 300; color: rgba(255,255,255,0.65); line-height: 1.7; margin-bottom: 40px; max-width: 380px; }
        .adm-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 36px; }
        .adm-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15); }
        .adm-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .adm-stat { padding: 15px 18px; border-radius: 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); }
        .adm-stat-n { font-size: 24px; font-weight: 700; color: #22d3ee; }
        .adm-stat-l { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 3px; font-weight: 300; }
        .adm-right { flex: 1; background: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 48px 52px; position: relative; overflow: hidden; }
        .adm-form-wrap { width: 100%; max-width: 380px; position: relative; z-index: 1; }
        .adm-header { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }
        .adm-header-sep { width: 1px; height: 32px; background: #e2e8f0; }
        .adm-header-role { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.12em; text-transform: uppercase; }
        .adm-welcome { font-size: 13px; font-weight: 600; color: #0891b2; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
        .adm-title { font-size: 34px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.15; }
        .adm-desc { font-size: 14px; color: #64748b; font-weight: 300; margin-bottom: 24px; }
        .adm-field { margin-bottom: 18px; }
        .adm-label { display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 7px; }
        .adm-input-wrap { position: relative; }
        .adm-input { width: 100%; padding: 13px 16px 13px 44px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; background: #fff; color: #0f172a; outline: none; transition: border-color .25s, box-shadow .25s; }
        .adm-input:focus { border-color: #0891b2; box-shadow: 0 0 0 4px rgba(8,145,178,0.1); }
        .adm-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
        .adm-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; cursor: pointer; color: #94a3b8; background: none; border: none; padding: 0; }
        .adm-error { padding: 10px 14px; border-radius: 10px; background: #fff1f2; border: 1px solid #fecdd3; font-size: 13px; color: #be123c; margin-bottom: 16px; }
        .adm-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: transform .15s, box-shadow .15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .adm-btn:hover { box-shadow: 0 8px 24px rgba(8,145,178,0.35); transform: translateY(-1px); }
        .adm-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .adm-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: admspin .7s linear infinite; }
        @keyframes admspin { to { transform: rotate(360deg); } }
        .adm-footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px; }
        .adm-footer a { color: #0891b2; text-decoration: none; font-weight: 500; }
        .adm-profile-switch { position: absolute; top: 22px; right: 22px; display: flex; gap: 5px; z-index: 10; }
        .adm-switch-btn { padding: 7px 14px; border-radius: 20px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 500; cursor: pointer; background: #fff; color: #64748b; transition: all .2s; }
        .adm-switch-btn:hover { border-color: #0891b2; color: #0891b2; }
        .adm-switch-btn.active { background: #0891b2; color: #fff; border-color: #0891b2; }
      `}</style>
    </>
  );
}
