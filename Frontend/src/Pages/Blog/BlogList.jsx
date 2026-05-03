import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../Footer/Footer";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

if (!document.querySelector("#bet-bloglist-kf")) {
  const s = document.createElement("style"); s.id = "bet-bloglist-kf";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
    @keyframes blFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blSpin   { to{transform:rotate(360deg)} }
    .bl-card:hover { transform:translateY(-6px)!important; box-shadow:0 24px 48px rgba(0,0,0,.14)!important; }
    .bl-card:hover .bl-card-img { transform:scale(1.06)!important; }
    .bl-card:hover .bl-read-more { color:#dc2626!important; letter-spacing:.05em!important; }
    .bl-cat-btn:hover { background:#1e3a8a!important; color:#fff!important; }
    @media(max-width:768px){ .bl-grid{ grid-template-columns:1fr!important; } }
    @media(max-width:480px){ .bl-hero-title{ font-size:1.8rem!important; } }
  `;
  document.head.appendChild(s);
}

const CAT_COLORS = {
  "Actualités":     { bg:"#f0fdf4", text:"#16a34a" },
  "Événements":     { bg:"#eff6ff", text:"#1e3a8a" },
  "Cours":          { bg:"#fef3c7", text:"#d97706" },
  "Certifications": { bg:"#eff6ff", text:"#1e3a8a" },
  "Conseils":       { bg:"#fef2f2", text:"#dc2626" },
  "Entreprise":     { bg:"#f3e8ff", text:"#7c3aed" },
  "Annonces":       { bg:"#e0f2fe", text:"#0891b2" },
};
const getCat = (cat) => CAT_COLORS[cat] || { bg:"#f1f5f9", text:"#475569" };

const BlogList = () => {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [activeCat, setActiveCat] = useState("Tous");

  useEffect(() => {
    fetch(`${API_BASE}/api/blog`)
      .then(r => r.ok ? r.json() : { articles: [] })
      .then(({ articles }) => setPosts(
        (articles || []).map(a => ({
          id:       a.id,
          title:    a.titre,
          excerpt:  a.extrait,
          category: a.categorie,
          image:    a.image_url || "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80",
          date:     a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "",
          readTime: a.read_time,
          author:   a.auteur,
        }))
      ))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Tous", ...new Set(posts.map(p => p.category))];

  const filtered = posts.filter(p => {
    const matchCat   = activeCat === "Tous" || p.category === activeCat;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt||"").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const F = "'Montserrat','Segoe UI',sans-serif";

  return (
    <div style={{ fontFamily:F, minHeight:"100vh", background:"#f8fafc" }}>

      {/* ── HERO ── */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", padding:"80px 24px 60px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(220,38,38,.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:200, height:200, borderRadius:"50%", background:"rgba(8,145,178,.08)", pointerEvents:"none" }} />
        <span style={{ display:"inline-block", background:"rgba(220,38,38,.15)", color:"#fca5a5", border:"1px solid rgba(220,38,38,.3)", borderRadius:999, padding:"5px 18px", fontSize:".72rem", fontWeight:800, letterSpacing:".08em", marginBottom:16 }}>
          📰 ACTUALITÉS &amp; RESSOURCES
        </span>
        <h1 className="bl-hero-title" style={{ fontFamily:F, fontSize:"2.6rem", fontWeight:800, color:"#fff", margin:"0 0 16px", lineHeight:1.2 }}>
          News &amp; Événements <span style={{ color:"#f97316", fontStyle:"italic" }}>BET</span>
        </h1>
        <p style={{ color:"rgba(255,255,255,.7)", fontSize:"1rem", maxWidth:500, margin:"0 auto 32px", lineHeight:1.7 }}>
          Conseils pratiques, actualités certifications et ressources pour progresser en anglais.
        </p>

        {/* Barre de recherche */}
        <div style={{ maxWidth:420, margin:"0 auto", position:"relative" }}>
          <input
            type="text"
            placeholder="Rechercher un article…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"13px 20px 13px 46px", borderRadius:999, border:"none", fontSize:".95rem", fontFamily:F, boxSizing:"border-box", outline:"none", background:"rgba(255,255,255,.95)", color:"#0f172a" }}
          />
          <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:"1.1rem", opacity:.5 }}>🔍</span>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"48px 24px" }}>

        {/* Filtres catégories */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:36 }}>
          {categories.map(cat => {
            const isActive = activeCat === cat;
            return (
              <button key={cat} className="bl-cat-btn" onClick={() => setActiveCat(cat)} style={{
                padding:"7px 16px", borderRadius:999, border:"1px solid", fontSize:".82rem", fontWeight:700, cursor:"pointer", transition:"all .2s",
                background: isActive ? "#1e3a8a" : "#fff",
                color:      isActive ? "#fff"    : "#475569",
                borderColor:isActive ? "#1e3a8a" : "#e2e8f0",
              }}>
                {cat}
                {cat !== "Tous" && <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:9, fontSize:10, background:isActive?"rgba(255,255,255,.2)":"#f1f5f9", color:isActive?"#fff":"#64748b" }}>
                  {posts.filter(p => p.category === cat).length}
                </span>}
              </button>
            );
          })}
        </div>

        {/* Résultats */}
        {loading ? (
          <div style={{ textAlign:"center", padding:80 }}>
            <div style={{ width:40, height:40, border:"4px solid #e2e8f0", borderTopColor:"#dc2626", borderRadius:"50%", animation:"blSpin .8s linear infinite", margin:"0 auto 16px" }} />
            <p style={{ color:"#94a3b8" }}>Chargement des articles…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:80 }}>
            <div style={{ fontSize:"3rem", marginBottom:16 }}>📭</div>
            <h3 style={{ color:"#0f172a", margin:"0 0 8px" }}>Aucun article trouvé</h3>
            <p style={{ color:"#64748b" }}>Essayez une autre recherche ou catégorie.</p>
            <button onClick={() => { setSearch(""); setActiveCat("Tous"); }} style={{ marginTop:16, padding:"9px 20px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, cursor:"pointer", fontWeight:700, fontSize:".85rem" }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize:".82rem", color:"#94a3b8", marginBottom:24 }}>
              {filtered.length} article{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}
            </p>
            <div className="bl-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:28 }}>
              {filtered.map((post, idx) => {
                const c = getCat(post.category);
                return (
                  <Link key={post.id} to={`/blog/${post.id}`} className="bl-card" style={{
                    display:"flex", flexDirection:"column", textDecoration:"none",
                    background:"#fff", borderRadius:20, overflow:"hidden",
                    border:"1.5px solid #e2e8f0", transition:"transform .3s ease, box-shadow .3s ease",
                    animation:`blFadeUp .5s ease ${idx * 80}ms both`,
                  }}>
                    {/* Image */}
                    <div style={{ position:"relative", height:210, overflow:"hidden" }}>
                      <img className="bl-card-img" src={post.image} alt={post.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s ease" }} />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 50%,rgba(15,23,42,.3))" }} />
                      <div style={{ position:"absolute", top:13, left:13, ...c, borderRadius:999, padding:"3px 11px", fontSize:".65rem", fontWeight:800, letterSpacing:".05em" }}>
                        {post.category}
                      </div>
                    </div>
                    {/* Body */}
                    <div style={{ padding:"20px 22px 24px", flex:1, display:"flex", flexDirection:"column" }}>
                      <div style={{ fontSize:".72rem", color:"#94a3b8", fontWeight:600, marginBottom:8 }}>
                        📅 {post.date} {post.readTime && `· ⏱ ${post.readTime}`}
                      </div>
                      <h3 style={{ fontFamily:F, fontSize:"1.1rem", fontWeight:700, color:"#0f172a", margin:"0 0 10px", lineHeight:1.3, flex:0 }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{ fontSize:".84rem", color:"#64748b", lineHeight:1.65, margin:"0 0 18px", flex:1 }}>
                          {post.excerpt.slice(0,120)}{post.excerpt.length>120?"…":""}
                        </p>
                      )}
                      <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:".75rem", color:"#94a3b8" }}>✍️ {post.author}</span>
                        <span className="bl-read-more" style={{ fontSize:".78rem", fontWeight:800, color:"#1e3a8a", transition:"all .2s", letterSpacing:".01em" }}>
                          Lire l'article →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BlogList;
