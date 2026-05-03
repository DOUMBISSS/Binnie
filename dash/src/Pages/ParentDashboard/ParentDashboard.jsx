// src/Pages/Dashboard/ParentDashboard.jsx
// Composant complet pour le suivi des enfants (particuliers : enfants et ados)
// Intégration : <Route path="/dashboard/parent" element={<ParentDashboard />} />

import React, { useState, useEffect } from "react";
import Footer from "../Footer";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ── Fonts & Keyframes (injection unique) ───────────────────────── */
if (!document.querySelector("#parent-fonts")) {
  const link = document.createElement("link");
  link.id = "parent-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(link);
}
if (!document.querySelector("#parent-kf")) {
  const style = document.createElement("style");
  style.id = "parent-kf";
  style.textContent = `
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
    @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes scaleIn { from { transform:scale(.96); opacity:0 } to { transform:scale(1); opacity:1 } }
    @keyframes slideBar { from { width:0 } to { width:var(--w) } }
  `;
  document.head.appendChild(style);
}

/* ── Composants utilitaires ─────────────────────────────────────── */
const ProgressBar = ({ value, max = 100, color = "#dc2626", height = 8 }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: color + "20", color }}>{icon}</div>
    <div>
      <div style={styles.statValue}>{value}{unit && <span style={{ fontSize: "0.9rem" }}>{unit}</span>}</div>
      <div style={styles.statLabel}>{title}</div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   DONNÉES MOCK (à remplacer par appel API)
════════════════════════════════════════════════════════════════ */
const MOCK_CHILDREN = [
  {
    id: 1,
    name: "Emma Kouamé",
    age: 12,
    level: "A2 → B1",
    program: "Juniors (7–12 ans)",
    avatar: "👧🏾",
    attendance: { rate: 92, total: 24, present: 22 },
    progress: {
      overall: 68,
      courses: [
        { name: "Grammaire", score: 75, max: 100 },
        { name: "Vocabulaire", score: 65, max: 100 },
        { name: "Expression orale", score: 70, max: 100 },
      ],
    },
    recentTests: [
      { date: "15/03/2025", title: "TOEFL Junior Mock", score: 82, max: 100 },
      { date: "01/03/2025", title: "Vocabulaire avancé", score: 68, max: 100 },
    ],
    upcomingClasses: [
      { date: "22/03/2025", time: "14h00", topic: "Speaking : Présentation personnelle", teacher: "Mr. John" },
      { date: "25/03/2025", time: "16h30", topic: "Grammaire : Past perfect", teacher: "Ms. Sarah" },
    ],
    activityLog: [
      { date: "20/03", action: "Cours suivi : Speaking", duration: "60 min" },
      { date: "18/03", action: "Quiz vocabulaire", result: "78%", status: "success" },
    ],
  },
  {
    id: 2,
    name: "Liam Kouamé",
    age: 16,
    level: "B1 → B2",
    program: "Ados (13–17 ans)",
    avatar: "👦🏿",
    attendance: { rate: 88, total: 20, present: 17 },
    progress: {
      overall: 74,
      courses: [
        { name: "Grammaire", score: 80, max: 100 },
        { name: "Vocabulaire", score: 70, max: 100 },
        { name: "Expression orale", score: 72, max: 100 },
      ],
    },
    recentTests: [
      { date: "10/03/2025", title: "IELTS Preparation", score: 6.5, max: 9, unit: "band" },
      { date: "28/02/2025", title: "Listening B1", score: 85, max: 100 },
    ],
    upcomingClasses: [
      { date: "23/03/2025", time: "10h00", topic: "IELTS Writing Task 2", teacher: "Mrs. Williams" },
      { date: "26/03/2025", time: "18h00", topic: "Discussion : Current affairs", teacher: "Mr. John" },
    ],
    activityLog: [
      { date: "21/03", action: "Cours en ligne : Writing", duration: "90 min" },
      { date: "19/03", action: "Devoir rendu : Essay", result: "14/20", status: "success" },
    ],
  },
];

// Contacts administration (identique à EspaceApprenant)
const CONTACTS_ADMIN = [
  { id:1, nom:"Assistante en ligne", role:"Assistance technique et pédagogique", tel:"+225 01 23 45 67", email:"assistante@bet-formation.com", disponible:"Lun-Ven 9h-18h" },
  { id:2, nom:"Service clientèle", role:"Facturation, administratif", tel:"+225 01 23 45 68", email:"client@bet-formation.com", disponible:"Lun-Ven 8h-19h" },
  { id:3, nom:"Superviseur pédagogique", role:"Suivi de la qualité", tel:"+225 01 23 45 69", email:"superviseur@bet-formation.com", disponible:"Sur rendez-vous" },
  { id:4, nom:"Manager", role:"Responsable de centre", tel:"+225 01 23 45 70", email:"manager@bet-formation.com", disponible:"Lun-Jeu 9h-17h" },
];

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════════ */
export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  // États pour le formulaire de requête
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDestinataire, setRequestDestinataire] = useState(CONTACTS_ADMIN[0].nom);
  const [requestObjet, setRequestObjet] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    // Simuler chargement API
    setTimeout(() => {
      setChildren(MOCK_CHILDREN);
      if (MOCK_CHILDREN.length) setActiveChildId(MOCK_CHILDREN[0].id);
      setLoading(false);
    }, 600);
  }, []);

  const activeChild = children.find(c => c.id === activeChildId);

  const handleSubmitRequest = () => {
    if (!requestObjet.trim() || !requestMessage.trim()) {
      toast.error("Veuillez remplir l'objet et le message.");
      return;
    }
    toast.success(`Votre requête à ${requestDestinataire} a été envoyée. Nous vous répondrons dans les 48h.`);
    setShowRequestModal(false);
    setRequestObjet("");
    setRequestMessage("");
    setRequestDestinataire(CONTACTS_ADMIN[0].nom);
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.page}>
        <Toaster position="top-right" />

        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <div>
              <h1 style={styles.title}>👨‍👩‍👧 Tableau de bord Parent</h1>
              <p style={styles.subtitle}>Suivez la progression, l’assiduité et les résultats de vos enfants</p>
            </div>
            <div style={styles.headerRight}>
              <button style={styles.notifBtn}>🔔</button>
              <button style={styles.profileBtn}>👤 Parent</button>
            </div>
          </div>
        </div>

        <div style={styles.container}>
          {/* Sélecteur d'enfant */}
          {children.length > 1 && (
            <div style={styles.childTabs}>
              {children.map(child => (
                <button
                  key={child.id}
                  style={{ ...styles.childTab, ...(activeChildId === child.id ? styles.childTabActive : {}) }}
                  onClick={() => setActiveChildId(child.id)}
                >
                  <span style={{ fontSize: "1.2rem", marginRight: 8 }}>{child.avatar}</span>
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {activeChild && (
            <div style={styles.dashboardContent}>
              {/* Cartes récapitulatives */}
              <div style={styles.statsGrid}>
                <StatCard title="Taux d'assiduité" value={activeChild.attendance.rate} unit="%" icon="📅" color="#3b82f6" />
                <StatCard title="Progression globale" value={activeChild.progress.overall} unit="%" icon="📈" color="#10b981" />
                <StatCard title="Cours suivis" value={activeChild.attendance.present} unit={`/${activeChild.attendance.total}`} icon="🎯" color="#f59e0b" />
                <StatCard title="Tests récents" value={activeChild.recentTests.length} icon="📝" color="#8b5cf6" />
              </div>

              {/* Progression par matière */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📊 Progression par compétence</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {activeChild.progress.courses.map(course => (
                    <div key={course.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={styles.courseName}>{course.name}</span>
                        <span style={styles.courseScore}>{course.score} / {course.max}</span>
                      </div>
                      <ProgressBar value={course.score} max={course.max} color="#1e3a8a" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Assiduité & Activité récente */}
              <div style={styles.twoColumns}>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>📋 Assiduité (30 derniers jours)</h3>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#dc2626" }}>
                      {activeChild.attendance.rate}%
                    </div>
                    <div style={{ fontSize: ".8rem", color: "#64748b" }}>Taux de présence</div>
                  </div>
                  <ProgressBar value={activeChild.attendance.rate} color="#dc2626" height={12} />
                  <div style={{ marginTop: 16, fontSize: ".85rem", color: "#475569" }}>
                    {activeChild.attendance.present} cours suivis sur {activeChild.attendance.total}
                  </div>
                </div>

                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🕒 Activité récente</h3>
                  <ul style={styles.activityList}>
                    {activeChild.activityLog.map((log, idx) => (
                      <li key={idx} style={styles.activityItem}>
                        <span style={styles.activityDate}>{log.date}</span>
                        <span style={styles.activityAction}>{log.action}</span>
                        {log.result && <span style={{ ...styles.activityResult, color: "#10b981" }}>{log.result}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Résultats des tests */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🎯 Derniers résultats de tests</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.testTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeChild.recentTests.map((test, idx) => (
                        <tr key={idx}>
                          <td>{test.date}</td>
                          <td>{test.title}</td>
                          <td style={{ fontWeight: 700 }}>
                            {test.score}{test.unit ? ` ${test.unit}` : ""} / {test.max}{test.unit ? ` ${test.unit}` : ""}
                          </td>
                          <td>
                            <ProgressBar value={test.score} max={test.max} color="#10b981" height={6} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cours à venir */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📅 Cours à venir</h3>
                {activeChild.upcomingClasses.length ? (
                  <div style={styles.classList}>
                    {activeChild.upcomingClasses.map((cls, idx) => (
                      <div key={idx} style={styles.classItem}>
                        <div style={styles.classDate}>
                          <div style={{ fontWeight: 800 }}>{cls.date}</div>
                          <div style={{ fontSize: ".8rem", color: "#64748b" }}>{cls.time}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{cls.topic}</div>
                          <div style={{ fontSize: ".8rem", color: "#475569" }}>Avec {cls.teacher}</div>
                        </div>
                        <button style={styles.joinBtn}>Rejoindre →</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8" }}>Aucun cours programmé cette semaine.</p>
                )}
              </div>

              {/* SECTION CONTACTEZ BET (nouveau) */}
              <div style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={styles.cardTitle}>📞 Contactez BET</h3>
                  <button onClick={() => setShowRequestModal(true)} style={styles.requestBtn}>
                    📝 Formulaire de requête
                  </button>
                </div>
                <div style={styles.contactGrid}>
                  {CONTACTS_ADMIN.map(contact => (
                    <div key={contact.id} style={styles.contactCard}>
                      <div style={styles.contactHeader}>
                        <div style={styles.contactAvatar}>👤</div>
                        <div>
                          <div style={styles.contactName}>{contact.nom}</div>
                          <div style={styles.contactRole}>{contact.role}</div>
                        </div>
                      </div>
                      <div style={styles.contactDetails}>
                        <div>📞 {contact.tel}</div>
                        <div>✉️ {contact.email}</div>
                        <div>📅 {contact.disponible}</div>
                      </div>
                      <div style={styles.contactActions}>
                        <a href={`tel:${contact.tel}`} style={styles.contactLink}>📞 Appeler</a>
                        <a href={`mailto:${contact.email}`} style={styles.contactLink}>✉️ Email</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message personnalisé */}
              <div style={styles.messageCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "2rem" }}>💬</span>
                  <div>
                    <h4 style={{ margin: 0 }}>Besoin d'un bilan personnalisé ?</h4>
                    <p style={{ margin: "4px 0 0", fontSize: ".85rem", color: "#64748b" }}>
                      Nos conseillers pédagogiques sont à votre écoute pour faire le point sur la progression de votre enfant.
                    </p>
                  </div>
                  <button style={styles.contactBtn} onClick={() => window.location.href = "/contact"}>
                    Prendre rendez-vous →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORMULAIRE DE REQUETE (identique à EspaceApprenant) */}
      {showRequestModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Formulaire de requête</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Destinataire</label>
              <select value={requestDestinataire} onChange={(e) => setRequestDestinataire(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}>
                {CONTACTS_ADMIN.map(c => <option key={c.id} value={c.nom}>{c.nom} ({c.role})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Objet</label>
              <input type="text" value={requestObjet} onChange={(e) => setRequestObjet(e.target.value)} placeholder="Ex: Problème d'accès à une ressource" style={{ width: "100%", padding: 9, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Message</label>
              <textarea rows={5} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Décrivez votre demande ou signalement..." style={{ width: "100%", padding: 9, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowRequestModal(false)} style={{ padding: "9px 16px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Annuler</button>
              <button onClick={handleSubmitRequest} style={{ padding: "9px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Envoyer la requête</button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES (inspirés du design existant + ajouts pour contacts)
════════════════════════════════════════════════════════════════ */
const styles = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
    color: "#0f172a",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "24px 0",
    boxShadow: "0 1px 6px rgba(0,0,0,.05)",
  },
  headerInner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.8rem",
    margin: 0,
    fontWeight: 400,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: ".9rem",
    color: "#64748b",
    margin: "4px 0 0",
  },
  headerRight: {
    display: "flex",
    gap: 12,
  },
  notifBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  profileBtn: {
    background: "linear-gradient(135deg,#dc2626,#1e3a8a)",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 20px",
    fontWeight: 600,
    cursor: "pointer",
  },
  container: {
    maxWidth: 1280,
    margin: "40px auto",
    padding: "0 24px",
  },
  childTabs: {
    display: "flex",
    gap: 12,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  childTab: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 999,
    padding: "10px 24px",
    fontSize: ".95rem",
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    transition: "all .2s",
    display: "flex",
    alignItems: "center",
  },
  childTabActive: {
    background: "#fef2f2",
    borderColor: "#dc2626",
    color: "#dc2626",
    boxShadow: "0 2px 8px rgba(220,38,38,.1)",
  },
  dashboardContent: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 20px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 2px 10px rgba(0,0,0,.05)",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
  },
  statValue: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: ".78rem",
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: ".03em",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(0,0,0,.05)",
  },
  cardTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.3rem",
    fontWeight: 400,
    margin: "0 0 20px",
    color: "#0f172a",
  },
  courseName: {
    fontSize: ".9rem",
    fontWeight: 600,
    color: "#334155",
  },
  courseScore: {
    fontSize: ".85rem",
    fontWeight: 700,
    color: "#1e3a8a",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  activityList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  activityDate: {
    fontSize: ".75rem",
    color: "#94a3b8",
    fontWeight: 600,
    width: 50,
  },
  activityAction: {
    flex: 1,
    fontSize: ".85rem",
    color: "#334155",
  },
  activityResult: {
    fontSize: ".8rem",
    fontWeight: 700,
  },
  testTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  testTableTh: {
    textAlign: "left",
    padding: "12px 8px",
    fontSize: ".75rem",
    fontWeight: 800,
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  classList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  classItem: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    flexWrap: "wrap",
  },
  classDate: {
    minWidth: 100,
  },
  joinBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: ".8rem",
    fontWeight: 600,
    color: "#1e3a8a",
    cursor: "pointer",
  },
  // Styles pour la section contacts
  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  contactCard: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #e2e8f0",
    transition: "all .2s",
  },
  contactHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#fef2f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#dc2626",
  },
  contactName: {
    fontWeight: 700,
    fontSize: 14,
    color: "#0f172a",
  },
  contactRole: {
    fontSize: 11,
    color: "#64748b",
  },
  contactDetails: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 1.6,
  },
  contactActions: {
    display: "flex",
    gap: 8,
  },
  contactLink: {
    flex: 1,
    textAlign: "center",
    padding: "6px",
    background: "#fff",
    color: "#1e3a8a",
    textDecoration: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #e2e8f0",
  },
  requestBtn: {
    padding: "8px 16px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  messageCard: {
    background: "linear-gradient(135deg,#eff6ff 0%,#fef2f2 100%)",
    borderRadius: 20,
    padding: "24px",
    border: "1px solid #e2e8f0",
  },
  contactBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "10px 22px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background .2s",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTopColor: "#dc2626",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 14,
  maxWidth: "92vw",
  width: 520,
};

// Ajout de l'animation spin manquante
if (!document.querySelector("#spin-keyframe")) {
  const spinStyle = document.createElement("style");
  spinStyle.id = "spin-keyframe";
  spinStyle.textContent = "@keyframes spin { to { transform: rotate(360deg) } }";
  document.head.appendChild(spinStyle);
}