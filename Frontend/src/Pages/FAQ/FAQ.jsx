import React, { useState, useEffect } from "react";
import Footer from "../Footer/Footer";

if (!document.querySelector("#bet-faq-fonts")) {
  const l = document.createElement("link"); l.id = "bet-faq-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#bet-faq-kf")) {
  const s = document.createElement("style"); s.id = "bet-faq-kf";
  s.textContent = `
    @keyframes faqFU  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes faqSI  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    @keyframes faqSlide { from{opacity:0;max-height:0} to{opacity:1;max-height:800px} }
    .faq-item-open .faq-answer { animation: faqSlide .3s ease forwards; }
    .faq-card:hover { box-shadow:0 8px 32px rgba(30,58,138,.12)!important; transform:translateY(-2px)!important; }
    .faq-cat-btn:hover { background:#1e3a8a!important; color:#fff!important; }
    @media(max-width:768px){
      .faq-hero-title { font-size:1.8rem!important; }
      .faq-cats { flex-wrap:wrap!important; gap:8px!important; }
    }
    @media(max-width:480px){
      .faq-hero-title { font-size:1.4rem!important; }
      .faq-hero-sub   { font-size:.95rem!important; }
    }
  `;
  document.head.appendChild(s);
}

const FAQ_DATA = [
  {
    category: "Cours & formations",
    icon: "📚",
    color: "#eff6ff",
    accent: "#1e3a8a",
    items: [
      {
        q: "Quels types de cours proposez-vous ?",
        a: "Nous proposons des cours d'anglais en ligne, en cabinet et à domicile. Chaque format est adapté à votre rythme et à vos objectifs : TOEIC, TOEFL, IELTS, anglais des affaires, ou simplement améliorer votre niveau général.",
      },
      {
        q: "Comment se déroule un cours en ligne ?",
        a: "Nos cours en ligne se déroulent via une plateforme sécurisée avec un professeur qualifié en visioconférence. Vous recevez le lien de connexion 24h à l'avance. Les séances durent entre 1h et 1h30 selon votre programme.",
      },
      {
        q: "Puis-je changer de format de cours en cours de programme ?",
        a: "Oui, en fonction des disponibilités et de votre plan. Contactez votre conseiller pédagogique pour effectuer la modification. Un délai de 72h est requis.",
      },
      {
        q: "Quelle est la durée minimale d'un programme ?",
        a: "Nos programmes débutent à partir de 3 mois. Nous recommandons 6 mois pour des résultats significatifs et durables, notamment pour la préparation aux certifications.",
      },
    ],
  },
  {
    category: "Certifications",
    icon: "🏆",
    color: "#fef3c7",
    accent: "#d97706",
    items: [
      {
        q: "Quelles certifications préparez-vous ?",
        a: "Nous préparons aux certifications TOEIC, TOEFL iBT et IELTS. Nos formateurs sont spécialisés et connaissent les exigences précises de chaque examen.",
      },
      {
        q: "En combien de temps puis-je être prêt pour le TOEIC ?",
        a: "Cela dépend de votre niveau de départ. En moyenne, nos apprenants atteignent leur score cible en 3 à 6 mois avec 2 à 3 cours par semaine. Vos résultats dépendent également de votre pratique personnelle.",
      },
      {
        q: "Quel score TOEIC puis-je espérer après la formation ?",
        a: "Nos apprenants obtiennent en moyenne 750+ au TOEIC dès le 1er passage. Certains atteignent 900+. Nous adaptons la préparation à votre score cible.",
      },
      {
        q: "Organisez-vous les examens directement ?",
        a: "Nous ne sommes pas un centre d'examen officiel, mais nous vous accompagnons dans l'inscription auprès des centres agréés et nous préparons intensivement à passer l'examen dans les meilleures conditions.",
      },
    ],
  },
  {
    category: "Tarifs & paiement",
    icon: "💳",
    color: "#f0fdf4",
    accent: "#16a34a",
    items: [
      {
        q: "Quels sont vos modes de paiement ?",
        a: "Nous acceptons les paiements par Mobile Money (Orange Money, MTN, Moov), carte bancaire et virement. Le paiement en plusieurs tranches est disponible sur certains programmes.",
      },
      {
        q: "Y a-t-il des frais d'inscription ?",
        a: "Des frais d'inscription uniques sont appliqués à l'entrée dans un programme. Ils couvrent le matériel pédagogique initial et l'évaluation de niveau. Consultez nos offres pour le montant exact.",
      },
      {
        q: "Proposez-vous des réductions ?",
        a: "Oui ! Nous offrons des réductions pour les inscriptions anticipées, les groupes de 2 ou plus, et pour les entreprises à partir de 5 employés. Des promotions ponctuelles sont régulièrement annoncées sur notre site.",
      },
      {
        q: "Puis-je obtenir un remboursement si je me désiste ?",
        a: "Les remboursements sont possibles sous conditions dans les 7 jours suivant l'inscription, avant le début du programme. Au-delà, des frais de résiliation s'appliquent. Consultez nos conditions générales pour plus de détails.",
      },
    ],
  },
  {
    category: "Nos centres",
    icon: "📍",
    color: "#fef2f2",
    accent: "#dc2626",
    items: [
      {
        q: "Dans quelles villes sont situés vos centres ?",
        a: "Nous disposons de centres à Abidjan (Angré, Abatta, Yopougon, Koumassi, 2 Plateaux) et à Bouaké. Vous pouvez trouver le centre le plus proche de chez vous via la carte sur notre site.",
      },
      {
        q: "Quels sont vos horaires d'ouverture ?",
        a: "Nos centres sont ouverts du lundi au samedi de 8h à 19h. Des cours du soir et le samedi matin sont disponibles pour les professionnels.",
      },
      {
        q: "Puis-je visiter un centre avant de m'inscrire ?",
        a: "Bien sûr ! Vous êtes les bienvenus pour une visite découverte gratuite. Prenez rendez-vous en nous appelant ou en remplissant le formulaire de contact.",
      },
    ],
  },
  {
    category: "Entreprises",
    icon: "💼",
    color: "#f3e8ff",
    accent: "#7c3aed",
    items: [
      {
        q: "Proposez-vous des formations pour les entreprises ?",
        a: "Oui, nous avons une offre dédiée aux entreprises avec des programmes sur-mesure, des cours en intra-entreprise, et des rapports de suivi pour les RH. Des tarifs dégressifs sont disponibles à partir de 5 employés.",
      },
      {
        q: "Pouvez-vous former nos équipes directement dans nos locaux ?",
        a: "Absolument. Nos formateurs se déplacent dans vos locaux pour des sessions de groupe ou individuelles. Nous adaptons les horaires à vos contraintes opérationnelles.",
      },
      {
        q: "Fournissez-vous des attestations de formation ?",
        a: "Oui, chaque apprenant reçoit une attestation de formation à l'issue du programme. Pour les entreprises, nous fournissons également des rapports détaillés de progression utilisables pour les obligations de formation.",
      },
    ],
  },
  {
    category: "Compte & espace personnel",
    icon: "👤",
    color: "#e0f2fe",
    accent: "#0891b2",
    items: [
      {
        q: "Comment créer mon compte ?",
        a: "Cliquez sur « Connexion » en haut de la page puis sur « S'inscrire gratuitement ». Vous pouvez vous inscrire avec votre email ou directement avec Google.",
      },
      {
        q: "J'ai oublié mon mot de passe, que faire ?",
        a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Vous recevrez un email avec un lien sécurisé pour réinitialiser votre mot de passe.",
      },
      {
        q: "Mon espace personnel contient quoi ?",
        a: "Votre espace personnel vous donne accès à votre programme de cours, vos ressources pédagogiques, votre progression, vos factures et vos prochains rendez-vous avec votre formateur.",
      },
    ],
  },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState("");

  const categories = ["Tous", ...FAQ_DATA.map(c => c.category)];

  const filtered = FAQ_DATA
    .filter(c => activeCategory === "Tous" || c.category === activeCategory)
    .map(c => ({
      ...c,
      items: c.items.filter(
        item =>
          !search.trim() ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(c => c.items.length > 0);

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCount = FAQ_DATA.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)",
        padding: "80px 24px 64px",
        textAlign: "center",
        color: "#fff",
        animation: "faqFU .6s ease",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.15)", borderRadius: 100, padding: "6px 18px", fontSize: ".8rem", fontWeight: 600, letterSpacing: ".05em", marginBottom: 20 }}>
          ❓ FOIRE AUX QUESTIONS
        </div>
        <h1 className="faq-hero-title" style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.2 }}>
          Toutes vos questions, <br />
          <span style={{ color: "#fbbf24" }}>nos réponses claires</span>
        </h1>
        <p className="faq-hero-sub" style={{ fontSize: "1.05rem", opacity: .85, maxWidth: 560, margin: "0 auto 36px" }}>
          Retrouvez les réponses aux questions les plus fréquentes sur nos cours, certifications, tarifs et plus encore.
        </p>

        {/* Barre de recherche */}
        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <input
            type="text"
            placeholder="Rechercher une question…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 48px 14px 20px",
              borderRadius: 50,
              border: "none",
              fontSize: "1rem",
              outline: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,.15)",
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", opacity: .5 }}>🔍</span>
        </div>

        <p style={{ marginTop: 16, opacity: .65, fontSize: ".85rem" }}>{totalCount} questions &amp; réponses</p>
      </section>

      {/* ── Filtres catégories ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="faq-cats" style={{ display: "flex", gap: 4, overflowX: "auto", padding: "16px 0", scrollbarWidth: "none" }}>
            {categories.map(cat => (
              <button
                key={cat}
                className="faq-cat-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "8px 18px",
                  borderRadius: 50,
                  border: "1.5px solid",
                  borderColor: activeCategory === cat ? "#1e3a8a" : "#e2e8f0",
                  background: activeCategory === cat ? "#1e3a8a" : "#fff",
                  color: activeCategory === cat ? "#fff" : "#475569",
                  fontWeight: activeCategory === cat ? 700 : 500,
                  fontSize: ".85rem",
                  cursor: "pointer",
                  transition: "all .2s ease",
                  fontFamily: "inherit",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contenu FAQ ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#475569" }}>Aucune question trouvée</p>
            <p style={{ fontSize: ".9rem" }}>Essayez un autre mot-clé ou <a href="/contact" style={{ color: "#1e3a8a", fontWeight: 600 }}>contactez-nous</a>.</p>
          </div>
        ) : (
          filtered.map((cat, catIdx) => (
            <div key={cat.category} style={{ marginBottom: 48, animation: "faqFU .5s ease" }}>
              {/* En-tête catégorie */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: cat.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem", flexShrink: 0,
                }}>
                  {cat.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>
                  {cat.category}
                </h2>
                <span style={{ marginLeft: "auto", background: cat.color, color: cat.accent, borderRadius: 50, padding: "2px 12px", fontSize: ".78rem", fontWeight: 700 }}>
                  {cat.items.length} question{cat.items.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div
                      key={itemIdx}
                      className={`faq-card ${isOpen ? "faq-item-open" : ""}`}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: `1.5px solid ${isOpen ? cat.accent : "#e2e8f0"}`,
                        overflow: "hidden",
                        transition: "all .25s ease",
                        cursor: "pointer",
                      }}
                      onClick={() => toggle(catIdx, itemIdx)}
                    >
                      {/* Question */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 22px",
                        gap: 16,
                      }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: ".97rem", color: "#1e293b", lineHeight: 1.4 }}>
                          {item.q}
                        </p>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: isOpen ? cat.accent : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all .25s ease",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke={isOpen ? "#fff" : "#64748b"} strokeWidth="2.5"
                            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .25s ease" }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Réponse */}
                      {isOpen && (
                        <div className="faq-answer" style={{
                          padding: "0 22px 20px",
                          color: "#475569",
                          fontSize: ".93rem",
                          lineHeight: 1.7,
                          borderTop: `1px solid ${cat.color}`,
                          paddingTop: 16,
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* CTA Bas de page */}
        <div style={{
          marginTop: 40,
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          borderRadius: 20,
          padding: "40px 32px",
          textAlign: "center",
          color: "#fff",
          animation: "faqSI .5s ease",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>💬</div>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 800 }}>
            Vous n'avez pas trouvé votre réponse ?
          </h3>
          <p style={{ margin: "0 0 24px", opacity: .85, fontSize: ".95rem" }}>
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/contact"
              style={{
                background: "#fff",
                color: "#1e3a8a",
                padding: "12px 28px",
                borderRadius: 50,
                fontWeight: 700,
                textDecoration: "none",
                fontSize: ".9rem",
                transition: "opacity .2s",
              }}
            >
              Nous contacter
            </a>
            <a
              href="https://wa.me/2250000000000"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "rgba(255,255,255,.15)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 50,
                fontWeight: 700,
                textDecoration: "none",
                fontSize: ".9rem",
                border: "1.5px solid rgba(255,255,255,.3)",
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
