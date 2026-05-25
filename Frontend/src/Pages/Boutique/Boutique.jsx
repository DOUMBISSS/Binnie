import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../config/supabase";
import Footer from "../Footer/Footer";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
const BET_COLOR = "#0891b2";

const CATEGORIES = ["Tout","Vêtements","Accessoires","Fournitures","Livres","Goodies","Autre"];

const IcoCart   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IcoClose  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoMinus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoCheck  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoUser   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function Boutique() {
  const [produits,     setProduits]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [categorie,    setCategorie]    = useState("Tout");
  const [cart,         setCart]         = useState([]);
  const [cartOpen,     setCartOpen]     = useState(false);
  const [detail,       setDetail]       = useState(null);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form,         setForm]         = useState({ nom:"", email:"", telephone:"", notes:"" });
  const [sending,      setSending]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [formErr,      setFormErr]      = useState("");
  const [supaUser,     setSupaUser]     = useState(null);

  /* ── Auth : récupération session + pré-remplissage ── */
  const prefillFromUser = useCallback((u) => {
    if (!u) return;
    const meta = u.user_metadata || {};
    const nom = (meta.prenom && meta.nom)
      ? `${meta.prenom} ${meta.nom}`
      : meta.full_name || meta.name || "";
    setForm(prev => ({
      ...prev,
      nom:       prev.nom       || nom,
      email:     prev.email     || u.email || "",
      telephone: prev.telephone || meta.telephone || "",
    }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setSupaUser(session.user); prefillFromUser(session.user); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user || null;
      setSupaUser(u);
      if (u) prefillFromUser(u);
    });
    return () => subscription.unsubscribe();
  }, [prefillFromUser]);

  /* ── Produits ── */
  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/boutique/produits/actifs`);
      if (!res.ok) throw new Error();
      setProduits(await res.json());
    } catch { setProduits([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProduits(); }, [fetchProduits]);

  const filtered = produits.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.nom?.toLowerCase().includes(q)
      || p.description?.toLowerCase().includes(q)
      || p.categorie?.toLowerCase().includes(q);
    const matchCat = categorie === "Tout" || p.categorie === categorie;
    return matchSearch && matchCat;
  });

  /* ── Panier ── */
  const addToCart = (p, qty = 1) => {
    setCart(c => {
      const existing = c.find(x => x.id === p.id);
      if (existing) return c.map(x => x.id === p.id ? { ...x, qty: Math.min(x.qty + qty, p.stock || 99) } : x);
      return [...c, { ...p, qty }];
    });
    setCartOpen(true);
  };
  const removeFromCart = (id) => setCart(c => c.filter(x => x.id !== id));
  const updateQty = (id, delta) =>
    setCart(c => c.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  const cartTotal = cart.reduce((s, x) => s + x.prix * x.qty, 0);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);

  /* ── Commande ── */
  const openCheckout = () => {
    // Re-pré-remplissage au moment d'ouvrir si connecté
    if (supaUser) prefillFromUser(supaUser);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.nom.trim()) return setFormErr("Veuillez renseigner votre nom.");
    if (!form.telephone.trim()) return setFormErr("Veuillez renseigner votre téléphone.");
    setSending(true);
    try {
      const items = cart.map(x => ({ produit_id: x.id, nom: x.nom, quantite: x.qty, prix_unitaire: x.prix }));
      const res = await fetch(`${API_BASE}/api/boutique/commandes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_nom:       form.nom,
          client_email:     form.email,
          client_telephone: form.telephone,
          notes:            form.notes,
          items,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      setSuccess(true);
      setCart([]);
    } catch (err) { setFormErr(err.message); }
    finally { setSending(false); }
  };

  const openDetail = (p) => { setDetail(p); setImgIdx(0); };

  const F = "'Montserrat','Segoe UI',sans-serif";

  /* ── initiales utilisateur connecté ── */
  const userInitials = (() => {
    if (!supaUser) return null;
    const meta = supaUser.user_metadata || {};
    const name = (meta.prenom && meta.nom) ? `${meta.prenom} ${meta.nom}` : meta.full_name || supaUser.email || "";
    return name.split(" ").map(n => n[0] || "").join("").toUpperCase().slice(0, 2) || "?";
  })();

  return (
    <>
      <Helmet>
        <title>Boutique BET — Articles & Goodies</title>
        <meta name="description" content="Découvrez les articles officiels de BET Academy : vêtements, accessoires, livres et goodies." />
      </Helmet>

      <div style={{ fontFamily: F, minHeight:"100vh", background:"#f8fafc", display:"flex", flexDirection:"column" }}>

        {/* ── Hero ── */}
        <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#0891b2 100%)", padding:"56px 24px 48px", textAlign:"center" }}>
          <div style={{ fontSize:42, marginBottom:12 }}>🛍️</div>
          <h1 style={{ margin:0, fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:"#fff", letterSpacing:"-.02em" }}>
            Boutique BET
          </h1>
          <p style={{ margin:"12px 0 0", fontSize:"1rem", color:"rgba(255,255,255,.75)", maxWidth:480, marginInline:"auto" }}>
            Vêtements, accessoires, fournitures et goodies officiels de BET Academy
          </p>
        </div>

        {/* ── Contenu principal ── */}
        <div style={{ flex:1, maxWidth:1200, margin:"0 auto", width:"100%", padding:"32px 20px" }}>

          {/* ── Filtres ── */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:28, alignItems:"center" }}>
            <div style={{ position:"relative", flex:"1 1 260px" }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" }}>
                <IcoSearch />
              </span>
              <input
                placeholder="Rechercher un article…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px 10px 38px", border:"1.5px solid #e5e7eb", borderRadius:10, fontSize:14, background:"#fff", outline:"none" }}
              />
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategorie(c)} style={{
                  padding:"8px 14px", borderRadius:20, border:"1.5px solid", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s",
                  background:  categorie === c ? BET_COLOR : "#fff",
                  color:       categorie === c ? "#fff"    : "#374151",
                  borderColor: categorie === c ? BET_COLOR : "#e5e7eb",
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* ── Grille produits ── */}
          {loading ? (
            <div style={{ textAlign:"center", padding:80, color:"#9ca3af" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
              <p>Chargement des articles…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:80, color:"#9ca3af" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
              <p style={{ fontWeight:600 }}>Aucun article trouvé</p>
              <p style={{ fontSize:13 }}>Essayez d'autres filtres ou revenez bientôt !</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:20 }}>
              {filtered.map(p => {
                const inCart    = cart.find(x => x.id === p.id);
                const enRupture = (p.stock !== undefined && p.stock !== null) && p.stock <= 0;
                return (
                  <div key={p.id}
                    style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:"1.5px solid #f1f5f9", transition:"transform .2s,box-shadow .2s", cursor:"pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)"; }}
                    onClick={() => openDetail(p)}>

                    {/* Image */}
                    <div style={{ height:200, background:"#f1f5f9", position:"relative", overflow:"hidden" }}>
                      {(p.image_url || (p.images && p.images[0])) ? (
                        <img src={p.image_url || p.images[0]} alt={p.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                          onError={e => { e.currentTarget.style.display="none"; }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, color:"#cbd5e1" }}>🛍️</div>
                      )}
                      {p.categorie && (
                        <span style={{ position:"absolute", top:10, left:10, background:"rgba(15,23,42,.7)", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, backdropFilter:"blur(4px)" }}>
                          {p.categorie}
                        </span>
                      )}
                      {enRupture && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"#fff", fontWeight:800, fontSize:14, background:"#dc2626", padding:"6px 14px", borderRadius:20 }}>Rupture de stock</span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.nom}</div>
                      {p.description && (
                        <div style={{ fontSize:12, color:"#6b7280", marginBottom:10, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                          {p.description}
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                        <div style={{ fontWeight:900, fontSize:16, color:BET_COLOR }}>{Number(p.prix).toLocaleString("fr-FR")} FCFA</div>
                        {p.stock != null && p.stock > 0 && p.stock <= 10 && (
                          <span style={{ fontSize:10, color:"#d97706", fontWeight:700 }}>Plus que {p.stock}</span>
                        )}
                      </div>
                      <button
                        disabled={enRupture}
                        onClick={ev => { ev.stopPropagation(); addToCart(p); }}
                        style={{ marginTop:12, width:"100%", padding:"9px 0", background: enRupture ? "#e5e7eb" : BET_COLOR, color: enRupture ? "#9ca3af" : "#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor: enRupture ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"background .15s" }}>
                        {inCart ? "✅ Dans le panier" : <><IcoCart /> Ajouter au panier</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Footer />
      </div>

      {/* ── Bouton panier flottant ── */}
      {cartCount > 0 && (
        <button onClick={() => setCartOpen(true)} style={{ position:"fixed", bottom:28, right:28, zIndex:9000, background:BET_COLOR, color:"#fff", border:"none", borderRadius:"50%", width:60, height:60, cursor:"pointer", boxShadow:"0 4px 20px rgba(8,145,178,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
          <IcoCart />
          <span style={{ position:"absolute", top:-4, right:-4, background:"#dc2626", color:"#fff", borderRadius:"50%", width:20, height:20, fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>
        </button>
      )}

      {/* ── Modal détail produit ── */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)", zIndex:9100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, maxWidth:660, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,.2)" }}>
            <div style={{ position:"relative", height:280, background:"#f1f5f9", overflow:"hidden", borderRadius:"20px 20px 0 0" }}>
              {(detail.images?.length > 0 ? detail.images : [detail.image_url]).filter(Boolean).length > 0 ? (
                <img
                  src={(detail.images?.length > 0 ? detail.images : [detail.image_url]).filter(Boolean)[imgIdx] || ""}
                  alt={detail.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:64, color:"#cbd5e1" }}>🛍️</div>
              )}
              {detail.images?.length > 1 && (
                <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:6 }}>
                  {detail.images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} style={{ width:i===imgIdx?24:8, height:8, borderRadius:4, border:"none", cursor:"pointer", background: i===imgIdx?"#fff":"rgba(255,255,255,.5)", transition:"all .2s", padding:0 }} />
                  ))}
                </div>
              )}
              <button onClick={() => setDetail(null)} style={{ position:"absolute", top:12, right:12, background:"rgba(255,255,255,.9)", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoClose />
              </button>
            </div>
            <div style={{ padding:"24px 28px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:"1.3rem", fontWeight:900, color:"#0f172a" }}>{detail.nom}</h2>
                  {detail.categorie && <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>{detail.categorie}</span>}
                </div>
                <div style={{ fontWeight:900, fontSize:"1.4rem", color:BET_COLOR, whiteSpace:"nowrap" }}>
                  {Number(detail.prix).toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              {detail.description && (
                <p style={{ fontSize:14, color:"#475569", lineHeight:1.7, margin:"0 0 20px" }}>{detail.description}</p>
              )}
              {detail.stock != null && (
                <div style={{ fontSize:12, color: detail.stock > 10 ? "#16a34a" : detail.stock > 0 ? "#d97706" : "#dc2626", fontWeight:700, marginBottom:16 }}>
                  {detail.stock > 10 ? "✅ En stock" : detail.stock > 0 ? `⚠️ Plus que ${detail.stock} en stock` : "❌ Rupture de stock"}
                </div>
              )}
              <button
                disabled={detail.stock <= 0}
                onClick={() => { addToCart(detail); setDetail(null); }}
                style={{ width:"100%", padding:"13px 0", background: detail.stock <= 0 ? "#e5e7eb" : BET_COLOR, color: detail.stock <= 0 ? "#9ca3af" : "#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor: detail.stock <= 0 ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {detail.stock <= 0 ? "Rupture de stock" : <><IcoCart /> Ajouter au panier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tiroir panier ── */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", zIndex:9200, backdropFilter:"blur(2px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"absolute", right:0, top:0, bottom:0, width:"min(420px,100vw)", background:"#fff", boxShadow:"-8px 0 40px rgba(0,0,0,.15)", display:"flex", flexDirection:"column" }}>
            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontWeight:800, fontSize:17, color:"#0f172a" }}>
                🛒 Mon panier{" "}
                <span style={{ fontWeight:400, fontSize:13, color:"#9ca3af" }}>
                  ({cartCount} article{cartCount > 1 ? "s" : ""})
                </span>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoClose />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🛒</div>
                  <p>Votre panier est vide</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 0", borderBottom:"1px solid #f8fafc" }}>
                  <div style={{ width:60, height:60, borderRadius:10, background:"#f1f5f9", overflow:"hidden", flexShrink:0 }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#cbd5e1" }}>🛍️</div>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.nom}</div>
                    <div style={{ fontWeight:800, color:BET_COLOR, fontSize:13 }}>{Number(item.prix).toLocaleString("fr-FR")} FCFA</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoMinus /></button>
                    <span style={{ fontWeight:700, fontSize:13, minWidth:18, textAlign:"center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoPlus /></button>
                    <button onClick={() => removeFromCart(item.id)} style={{ marginLeft:4, width:26, height:26, borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoClose /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer panier */}
            {cart.length > 0 && (
              <div style={{ padding:"16px 24px", borderTop:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                  <span style={{ fontWeight:700, color:"#374151" }}>Total</span>
                  <span style={{ fontWeight:900, fontSize:18, color:BET_COLOR }}>{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <button onClick={openCheckout} style={{ width:"100%", padding:14, background:BET_COLOR, color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer" }}>
                  Commander →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal commande ── */}
      {checkoutOpen && (
        <div onClick={() => { if (!success) setCheckoutOpen(false); }} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)", zIndex:9300, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, maxWidth:480, width:"100%", boxShadow:"0 25px 60px rgba(0,0,0,.2)", overflow:"hidden" }}>

            {/* Header */}
            <div style={{ background:"linear-gradient(135deg,#0f172a,#0891b2)", padding:"24px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:"#fff" }}>📋 Votre commande</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.7)", marginTop:2 }}>
                  {cartCount} article{cartCount > 1 ? "s" : ""} · {cartTotal.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              {!success && (
                <button onClick={() => setCheckoutOpen(false)} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <IcoClose />
                </button>
              )}
            </div>

            <div style={{ padding:"24px 28px", maxHeight:"70vh", overflowY:"auto" }}>
              {success ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ width:64, height:64, background:"#dcfce7", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#16a34a" }}>
                    <IcoCheck />
                  </div>
                  <h3 style={{ margin:"0 0 8px", fontWeight:900, color:"#0f172a" }}>Commande envoyée !</h3>
                  <p style={{ color:"#475569", fontSize:14, lineHeight:1.6, margin:"0 0 20px" }}>
                    Merci ! Notre équipe va traiter votre commande et vous contacter pour finaliser la livraison.
                  </p>
                  <button
                    onClick={() => { setCheckoutOpen(false); setSuccess(false); }}
                    style={{ padding:"11px 28px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" }}>
                    Continuer mes achats
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOrder}>
                  {/* Badge utilisateur connecté */}
                  {supaUser && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:18 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"#0891b2", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, flexShrink:0 }}>
                        {userInitials}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#166534" }}>
                          <IcoUser /> Connecté — formulaire pré-rempli
                        </div>
                        <div style={{ fontSize:11, color:"#4b7a59" }}>{supaUser.email}</div>
                      </div>
                    </div>
                  )}

                  {/* Récap articles */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:"12px 16px", marginBottom:20 }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#374151", padding:"4px 0" }}>
                        <span>{item.nom} × {item.qty}</span>
                        <span style={{ fontWeight:700 }}>{(item.prix * item.qty).toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, marginTop:8, borderTop:"1px solid #e5e7eb", fontWeight:900, fontSize:14 }}>
                      <span>Total</span>
                      <span style={{ color:BET_COLOR }}>{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>

                  {/* Champs */}
                  {[
                    { key:"nom",       label:"Nom complet *",  type:"text",  placeholder:"Jean Koua" },
                    { key:"telephone", label:"Téléphone *",    type:"tel",   placeholder:"+225 07 00 00 00 00" },
                    { key:"email",     label:"Email",          type:"email", placeholder:"jean@email.com" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:14 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                        style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:14, outline:"none", background: supaUser && form[f.key] ? "#f8fafc" : "#fff" }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>
                      Notes / Instructions de livraison
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Adresse, quartier, instructions…"
                      value={form.notes}
                      onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
                      style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:14, resize:"vertical", outline:"none" }}
                    />
                  </div>

                  {formErr && (
                    <div style={{ color:"#dc2626", fontSize:13, marginBottom:12, fontWeight:600 }}>⚠️ {formErr}</div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    style={{ width:"100%", padding:14, background: sending ? "#9ca3af" : BET_COLOR, color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor: sending ? "not-allowed" : "pointer" }}>
                    {sending ? "Envoi en cours…" : "✅ Confirmer la commande"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
