import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { certificationsData } from "../../../data/certificationsData";
import Footer from "../../Footer/Footer";
import { insertDemandeDevis, insertInscriptionAdulte } from "../../../services/formsService";

if (!document.querySelector("#certd-fonts")) {
  const l=document.createElement("link");l.id="certd-fonts";l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#certd-kf")) {
  const s=document.createElement("style");s.id="certd-kf";
  s.textContent=`@keyframes certFU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes certFI{from{opacity:0}to{opacity:1}}@keyframes certSI{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}.cert-acc{animation:certFU .25s ease}.cert-row:hover{background:#f8f9fa!important}`;
  document.head.appendChild(s);
}

const MOCK={toeic:{
  name:"TOEIC",fullName:"Test of English for International Communication",
  heroImage:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80",
  tagline:"La certification anglais n°1 en entreprise — reconnue par 14 000 employeurs",
  level:"B1 → C1",duration:"6 semaines",price:"390 000 FCFA",oldPrice:"500 000 FCFA",discount:"22%",
  rating:4.9,ratingCount:1248,students:5200,
  description:"Le TOEIC est la référence mondiale pour évaluer vos compétences en anglais professionnel. Un score TOEIC reconnu ouvre les portes des entreprises internationales.",
  whatYouLearn:["Maîtriser le Listening (200 points)","Stratégies Reading avancées","Vocabulaire professionnel ciblé","15 tests blancs corrigés","Techniques anti-stress d'examen","Score garanti 700+"],
  examStructure:[
    {section:"Listening",duration:"45 min",questions:"100 questions",desc:"Photographies, questions/réponses, courtes conversations, discours"},
    {section:"Reading",duration:"75 min",questions:"100 questions",desc:"Phrases incomplètes, textes à compléter, lecture de passages"},
  ],
  preparationProgram:{weeks:6,hoursPerWeek:8,sessions:48,details:"6 semaines intensives. 2 sessions de 4h par semaine. Accès illimité aux ressources + 15 tests blancs + coaching individuel."},
  benefits:["Reconnu par 14 000 entreprises dans le monde","Améliore votre CV immédiatement","Exigé pour de nombreux postes internationaux","Valable 2 ans — renouvelable","Score précis de 10 à 990"],
  includes:[{icon:"🎥",label:"48 sessions de cours"},{icon:"📝",label:"15 tests blancs complets"},{icon:"📄",label:"Guide de stratégies PDF"},{icon:"📱",label:"Application mobile d'entraînement"},{icon:"∞",label:"Accès illimité à vie"},{icon:"🏆",label:"Certificat BET + TOEIC officiel"},{icon:"👤",label:"Coach personnel dédié"}],
  whyChoose:"BET est centre officiel ETS pour le TOEIC en Côte d'Ivoire. Nos apprenants obtiennent en moyenne 780 points dès leur premier passage. Taux de réussite au score cible : 96%.",
  testimonials:[
    {av:"👩🏾‍💼",name:"Awa Koné",role:"Responsable RH, NSIA Assurances",score:"TOEIC 880",rating:5,text:"J'ai obtenu 880 au TOEIC grâce à BET. Les tests blancs et le coaching individuel font vraiment la différence."},
    {av:"👨🏿‍💻",name:"Kouamé Brou",role:"Ingénieur, Orange CI",score:"TOEIC 790",rating:5,text:"Formation très bien structurée. En 6 semaines j'ai progressé de 200 points par rapport à mon score initial."},
  ],
  faq:[
    {q:"Quelle est la durée de validité du TOEIC ?",a:"Le TOEIC est valable 2 ans à partir de la date de l'examen. Il est recommandé de le renouveler pour maintenir sa valeur sur le marché du travail."},
    {q:"Quel score pour être compétitif ?",a:"Un score de 785+ est considéré professionnel. Pour les postes de management international, 900+ est recommandé. Notre formation cible le score adapté à votre objectif."},
    {q:"L'examen se passe-t-il chez BET ?",a:"Oui, BET est centre officiel ETS. L'examen a lieu dans nos locaux dans des conditions officielles. Vous recevez votre certificat ETS officiel."},
  ],
}};

const Stars=({r=5,size=13})=><span style={{display:"inline-flex",gap:1}}>{Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:size,color:i<Math.floor(r)?"#f59e0b":"#d1d5db"}}>★</span>)}</span>;

const FAQItem=({item})=>{
  const[open,setOpen]=useState(false);
  return(
    <div style={{border:`1.5px solid ${open?"#dc2626":"#e2e8f0"}`,borderRadius:10,overflow:"hidden",transition:"border-color .2s"}}>
      <button style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"none",border:"none",fontFamily:FF,fontSize:".92rem",fontWeight:600,color:"#0f172a",cursor:"pointer",textAlign:"left",gap:12}} onClick={()=>setOpen(p=>!p)}>
        <span>{item.q}</span><span style={{fontSize:"1.3rem",color:"#dc2626",transition:"transform .2s",display:"inline-block",transform:open?"rotate(45deg)":"rotate(0)"}}>+</span>
      </button>
      {open&&<p className="cert-acc" style={{padding:"0 18px 14px",fontSize:".9rem",color:"#475569",lineHeight:1.7,margin:0}}>{item.a}</p>}
    </div>
  );
};

const CertificationDetail=()=>{
  const{certId}=useParams(); const navigate=useNavigate();
  const rawCert=certificationsData?.[certId?.toLowerCase()];
  const cert=rawCert?{...MOCK[certId?.toLowerCase()]||MOCK.toeic,...rawCert}:(MOCK[certId?.toLowerCase()]||MOCK.toeic);
  const[activeTab,setActiveTab]=useState("apercu");
  const[stickyBar,setStickyBar]=useState(false);
  const[modalOpen,setModalOpen]=useState(false);
  const[payMethod,setPayMethod]=useState("mobile");
  const[mobileOp,setMobileOp]=useState(null);
  const[success,setSuccess]=useState(false);
  const[hov,setHov]=useState(null);
  const[devisOpen,setDevisOpen]=useState(false);
  const[devisSuccess,setDevisSuccess]=useState(false);
  const[devisForm,setDevisForm]=useState({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});
  const[inscForm,setInscForm]=useState({nom:"",email:"",tel:"",mobileNum:""});
  const[inscErreur,setInscErreur]=useState("");
  const[inscLoading,setInscLoading]=useState(false);
  const heroRef=useRef(null);

  useEffect(()=>{const h=()=>setStickyBar(window.scrollY>(heroRef.current?.offsetHeight||400)-80);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  // Injection des styles responsives une seule fois
  useEffect(() => {
    if (!document.querySelector("#certd-responsive")) {
      const style = document.createElement("style");
      style.id = "certd-responsive";
      style.textContent = `
        .cert-detail-root {
          max-width: 100%;
          overflow-x: hidden;
        }
        /* Layout responsive */
        @media (max-width: 900px) {
          .cert-detail-layout {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .cert-detail-sidebar {
            position: relative !important;
            top: 0 !important;
            width: 100% !important;
          }
          .cert-detail-side-card {
            margin-bottom: 20px;
          }
        }
        /* Grilles responsives */
        @media (max-width: 768px) {
          .cert-detail-what-grid,
          .cert-detail-includes-grid {
            grid-template-columns: 1fr !important;
          }
          .cert-detail-exam-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .cert-detail-program-stats {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .cert-detail-weeks-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .cert-detail-score-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .cert-detail-hero-inner {
            padding: 0 16px !important;
          }
          .cert-detail-hero-title {
            font-size: 1.8rem !important;
          }
          .cert-detail-tabs-inner {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }
          .cert-detail-tab-btn {
            padding: 10px 14px !important;
            font-size: 0.8rem !important;
          }
          .cert-detail-side-card {
            margin: 0 0 20px;
          }
        }
        @media (max-width: 640px) {
          .cert-detail-score-grid {
            grid-template-columns: 1fr !important;
          }
          .cert-detail-program-stats {
            grid-template-columns: 1fr !important;
          }
          .cert-detail-hero-title {
            font-size: 1.5rem !important;
          }
          .cert-detail-hero-pills {
            gap: 6px !important;
          }
          .cert-detail-side-card .price-row {
            flex-wrap: wrap;
            justify-content: center;
          }
          .cert-detail-pay-modal {
            width: 95% !important;
            padding: 20px !important;
          }
          .cert-detail-modal-btns {
            flex-direction: column;
          }
        }
        /* Correction chevauchement timer */
        .cert-detail-side-card .timer-badge {
          word-break: break-word;
          white-space: normal;
          line-height: 1.4;
        }
        .cert-detail-side-card {
          overflow-wrap: break-word;
        }
        /* Amélioration des boutons sur mobile */
        @media (max-width: 480px) {
          .cert-detail-btn-enroll,
          .cert-detail-btn-quote {
            width: calc(100% - 24px) !important;
            margin-left: 12px !important;
            margin-right: 12px !important;
            font-size: 0.85rem !important;
          }
          .cert-detail-share-buttons {
            flex-direction: column;
            gap: 8px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if(!cert)return<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><h2 style={{fontFamily:FD}}>Certification non trouvée</h2><button onClick={()=>navigate("/")} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:999,padding:"10px 24px",fontFamily:FF,fontWeight:700,cursor:"pointer"}}>← Retour à l'accueil</button></div>;

  const TABS=[{id:"apercu",label:"Aperçu"},{id:"examen",label:"Structure de l'examen"},{id:"programme",label:"Programme de préparation"},{id:"avis",label:`Avis (${cert.testimonials?.length||0})`},{id:"faq",label:"FAQ"}];
  const handlePay=async()=>{
    if(!inscForm.nom||!inscForm.email||!inscForm.tel)return alert("Veuillez remplir votre nom, email et téléphone.");
    setInscLoading(true);setInscErreur("");
    try{
      await insertInscriptionAdulte({
        nom_complet:inscForm.nom,
        email:inscForm.email,
        telephone:inscForm.tel,
        offre_titre:`${cert.name} — ${cert.fullName}`,
        mode_paiement:payMethod==="mobile"?`Mobile Money ${mobileOp||""} — ${inscForm.mobileNum}`:"Carte bancaire",
        statut:"en_attente",
      });
      setSuccess(true);
      setTimeout(()=>{setSuccess(false);setModalOpen(false);setInscForm({nom:"",email:"",tel:"",mobileNum:""});},3000);
    }catch(e){
      setInscErreur("Une erreur est survenue. Veuillez réessayer.");
    }finally{
      setInscLoading(false);
    }
  };
  const handleDevis=async()=>{
    try{
      await insertDemandeDevis({nom:devisForm.nom,email:devisForm.email,tel:devisForm.tel,entreprise:devisForm.entreprise||null,participants:devisForm.participants,message:devisForm.message||null,source:"certification",source_nom:`${cert.name} — ${cert.fullName}`});
      setDevisSuccess(true);
      setTimeout(()=>{setDevisSuccess(false);setDevisOpen(false);setDevisForm({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});},3000);
    }catch(err){console.error("Erreur devis:",err);}
  };

  return(
    <div className="cert-detail-root" style={S.page}>
      {/* HERO */}
      <div ref={heroRef} style={{...S.hero,backgroundImage:`linear-gradient(135deg,rgba(10,20,50,.88) 0%,rgba(30,58,138,.7) 100%), url(${cert.heroImage})`,backgroundSize:"cover",backgroundPosition:"center"}}>
        <div className="cert-detail-hero-inner" style={S.heroInner}>
          <div style={S.breadcrumb}><span style={S.bLink} onClick={()=>navigate("/")}>Accueil</span><span style={S.bSep}>/</span><span style={S.bLink} onClick={()=>navigate(-1)}>Certifications</span><span style={S.bSep}>/</span><span style={{color:"#e2e8f0"}}>{cert.name}</span></div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <span style={S.tagBlue}>🏆 CERTIFICATION OFFICIELLE</span>
            <span style={S.tagGold}>📊 {cert.level}</span>
          </div>
          <h1 className="cert-detail-hero-title" style={S.heroTitle}>{cert.name}</h1>
          <p style={{color:"rgba(255,255,255,.6)",fontSize:".9rem",margin:"0 0 10px",fontStyle:"italic"}}>{cert.fullName}</p>
          <p style={{color:"rgba(255,255,255,.85)",fontSize:"1.05rem",margin:"0 0 18px",lineHeight:1.6,maxWidth:600}}>{cert.tagline}</p>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
            <span style={{color:"#f59e0b",fontWeight:800,fontSize:".95rem"}}>{cert.rating}</span>
            <Stars r={cert.rating}/>
            <span style={{color:"#93c5fd",fontSize:".82rem",textDecoration:"underline"}}>({cert.ratingCount?.toLocaleString()} avis)</span>
            <span style={{color:"rgba(255,255,255,.3)"}}>•</span>
            <span style={{color:"rgba(255,255,255,.8)",fontSize:".86rem"}}>👥 {cert.students?.toLocaleString()} certifiés via BET</span>
          </div>
          <div className="cert-detail-hero-pills" style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {[`⏱ ${cert.duration}`,"🌐 Français",`📋 ${cert.preparationProgram?.sessions} sessions`,"✅ Centre officiel ETS agréé"].map((t,i)=><span key={i} style={S.heroPill}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="cert-detail-tabs-bar" style={{...S.tabsBar,...(stickyBar?S.tabsSticky:{})}}>
        <div className="cert-detail-tabs-inner" style={S.tabsInner}>{TABS.map(t=><button key={t.id} className="cert-detail-tab-btn" style={{...S.tabBtn,...(activeTab===t.id?S.tabActive:{})}} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}</div>
      </div>

      <div className="cert-detail-layout" style={S.layout}>
        <div className="cert-detail-content-col" style={S.contentCol}>

          {activeTab==="apercu"&&(
            <div style={{animation:"certFU .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce que vous apprendrez</h2>
                <div className="cert-detail-what-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
                  {cert.whatYouLearn?.map((item,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{color:"#1e3a8a",fontWeight:800,marginTop:1,flexShrink:0}}>✓</span><span style={{fontSize:".88rem",color:"#334155",lineHeight:1.5}}>{item}</span></div>)}
                </div>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>À propos de la certification</h2>
                <p style={S.descP}>{cert.description}</p>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Pourquoi passer le {cert.name} ?</h2>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {cert.benefits?.map((b,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,fontSize:".92rem",color:"#334155"}}><div style={S.advDot}>✓</div><span>{b}</span></div>)}
                </div>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce que comprend la préparation</h2>
                <div className="cert-detail-includes-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {cert.includes?.map((inc,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:"1.1rem",width:24,textAlign:"center",flexShrink:0}}>{inc.icon}</span><span style={{fontSize:".88rem",color:"#475569"}}>{inc.label}</span></div>)}
                </div>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Pourquoi choisir BET ?</h2>
                <div style={{background:"linear-gradient(135deg,#eff6ff,#fef2f2)",border:"1px solid #bfdbfe",borderRadius:14,padding:"20px 22px"}}><p style={{...S.descP,margin:0}}>{cert.whyChoose}</p></div>
              </section>
            </div>
          )}

          {activeTab==="examen"&&(
            <div style={{animation:"certFU .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Structure officielle de l'examen {cert.name}</h2>
                <p style={{fontSize:".86rem",color:"#64748b",margin:"-12px 0 20px"}}>Format ETS officiel — valable internationalement</p>
                <div className="cert-detail-exam-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:32}}>
                  {cert.examStructure?.map((item,i)=>(
                    <div key={i} style={{...S.examCard,...(hov===i?{borderColor:"#1e3a8a",boxShadow:"0 8px 24px rgba(30,58,138,.12)",transform:"translateY(-3px)"}:{})}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                        <span style={{fontFamily:FD,fontSize:"2rem",color:"#e2e8f0",lineHeight:1}}>0{i+1}</span>
                        <h3 style={{fontFamily:FD,fontSize:"1.2rem",margin:0,fontWeight:400,color:"#0f172a"}}>{item.section}</h3>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        <span style={S.examPill}>⏱ {item.duration}</span>
                        {item.questions&&<span style={S.examPill}>📋 {item.questions}</span>}
                      </div>
                      {item.desc&&<p style={{fontSize:".86rem",color:"#64748b",margin:"10px 0 0",lineHeight:1.6}}>{item.desc}</p>}
                    </div>
                  ))}
                </div>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:14,padding:"22px"}}>
                  <h3 style={{fontFamily:FD,fontSize:"1.2rem",margin:"0 0 20px",fontWeight:400}}>Échelle de scores et niveaux CECRL</h3>
                  <div className="cert-detail-score-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                    {[{range:"10–250",level:"A1-A2",label:"Débutant",color:"#94a3b8",bg:"#f8fafc"},{range:"255–400",level:"B1",label:"Intermédiaire",color:"#1e3a8a",bg:"#eff6ff"},{range:"405–600",level:"B2",label:"Avancé",color:"#059669",bg:"#f0fdf4"},{range:"605–780",level:"C1",label:"Professionnel",color:"#d97706",bg:"#fffbeb"},{range:"785–990",level:"C2",label:"Expert",color:"#dc2626",bg:"#fef2f2"}].map((sc,i)=>(
                      <div key={i} style={{borderRadius:10,padding:"12px 10px",border:`1.5px solid ${sc.color}44`,background:sc.bg,textAlign:"center"}}>
                        <div style={{fontSize:".72rem",fontWeight:800,color:sc.color,letterSpacing:".05em",marginBottom:4}}>{sc.level}</div>
                        <div style={{fontFamily:FD,fontSize:"1.2rem",color:"#0f172a",marginBottom:2}}>{sc.range}</div>
                        <div style={{fontSize:".72rem",color:"#64748b"}}>{sc.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab==="programme"&&(
            <div style={{animation:"certFU .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Notre programme de préparation</h2>
                {cert.preparationProgram&&(
                  <>
                    <div className="cert-detail-program-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
                      {[{num:cert.preparationProgram.weeks,label:"Semaines"},{num:cert.preparationProgram.hoursPerWeek,label:"Heures/sem"},{num:cert.preparationProgram.sessions,label:"Sessions"},{num:"96%",label:"Réussite"}].map((st,i)=>(
                        <div key={i} style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)",borderRadius:12,padding:"20px 14px",textAlign:"center"}}>
                          <div style={{fontFamily:FD,fontSize:"2rem",color:"#fff",marginBottom:4}}>{st.num}</div>
                          <div style={{fontSize:".72rem",color:"rgba(255,255,255,.6)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>{st.label}</div>
                        </div>
                      ))}
                    </div>
                    <p style={S.descP}>{cert.preparationProgram.details}</p>
                  </>
                )}
                <h3 style={{fontFamily:FD,fontSize:"1.15rem",margin:"28px 0 16px",fontWeight:400}}>Déroulé de la formation</h3>
                <div className="cert-detail-weeks-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
                  {[{week:"S1–S2",title:"Diagnostic & Fondamentaux",items:["Test de niveau initial","Vocabulaire professionnel essentiel","Phonétique et compréhension orale","Grammaire ciblée TOEIC"]},{week:"S3–S4",title:"Entraînement intensif",items:["100 exercices Listening/jour","Techniques de lecture rapide","Pièges grammaticaux du TOEIC","2 tests blancs corrigés"]},{week:"S5–S6",title:"Mise en conditions",items:["3 tests blancs complets","Stratégies de gestion du temps","Simulation conditions officielles","Révisions personnalisées"]}].map((w,i)=>(
                    <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"18px 16px"}}>
                      <div style={{display:"inline-block",background:"#dc2626",color:"#fff",borderRadius:999,padding:"3px 12px",fontSize:".72rem",fontWeight:800,marginBottom:10}}>{w.week}</div>
                      <h4 style={{fontFamily:FD,fontSize:"1.05rem",margin:"0 0 12px",fontWeight:400,color:"#0f172a"}}>{w.title}</h4>
                      <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:7}}>
                        {w.items.map((it,j)=><li key={j} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:".84rem",color:"#475569"}}><span style={{color:"#1e3a8a",fontWeight:800,marginTop:1}}>›</span>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab==="avis"&&(
            <div style={{animation:"certFU .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce que disent nos certifiés</h2>
                <div style={{display:"flex",gap:32,alignItems:"center",background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:24,marginBottom:24,flexWrap:"wrap"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90}}>
                    <div style={{fontFamily:FD,fontSize:"3rem",color:"#0f172a",lineHeight:1}}>{cert.rating}</div>
                    <Stars r={cert.rating} size={20}/><div style={{fontSize:".76rem",color:"#64748b",fontWeight:600,marginTop:4}}>Note globale</div>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    {[{s:5,p:91},{s:4,p:7},{s:3,p:1},{s:2,p:1},{s:1,p:0}].map((r,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flex:1,height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}><div style={{width:`${r.p}%`,height:"100%",background:"#f59e0b",borderRadius:4}}/></div>
                        <Stars r={r.s} size={11}/><span style={{fontSize:".76rem",color:"#64748b",width:30,textAlign:"right"}}>{r.p}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {cert.testimonials?.map((t,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#0f172a,#1e3a8a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>{t.av}</div>
                        <div><div style={{fontWeight:800,fontSize:".9rem"}}>{t.name}</div><div style={{fontSize:".76rem",color:"#64748b"}}>{t.role}</div></div>
                        <div style={{marginLeft:"auto",background:"#fef2f2",color:"#dc2626",borderRadius:999,padding:"3px 12px",fontSize:".74rem",fontWeight:800,whiteSpace:"nowrap"}}>{t.score}</div>
                      </div>
                      <Stars r={t.rating} size={13}/>
                      <p style={{fontSize:".9rem",color:"#475569",lineHeight:1.65,marginTop:10,fontStyle:"italic"}}>"{t.text}"</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab==="faq"&&(
            <div style={{animation:"certFU .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Questions fréquentes</h2>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>{cert.faq?.map((item,i)=><FAQItem key={i} item={item}/>)}</div>
              </section>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="cert-detail-sidebar" style={{...S.sidebar,top:stickyBar?80:20}}>
          <div className="cert-detail-side-card" style={S.sideCard}>
            <div className="timer-badge" style={{background:"#fef3c7",padding:"8px 14px",fontSize:".78rem",color:"#92400e",fontWeight:600,textAlign:"center",borderBottom:"1px solid #fde68a",wordBreak:"break-word"}}>⏱ Offre spéciale · Se termine dans <strong>23:14:05</strong></div>
            <div className="price-row" style={{padding:"16px 18px 10px",display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:FD,fontSize:"1.9rem",color:"#0f172a"}}>{cert.price}</span>
              {cert.oldPrice&&<span style={{fontSize:"1rem",color:"#94a3b8",textDecoration:"line-through"}}>{cert.oldPrice}</span>}
              {cert.discount&&<span style={{background:"#fef2f2",color:"#dc2626",borderRadius:999,padding:"2px 10px",fontSize:".76rem",fontWeight:800}}>-{cert.discount}</span>}
            </div>
            <button className="cert-detail-btn-enroll" style={S.btnEnroll} onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={e=>e.currentTarget.style.background="#dc2626"} onClick={()=>setModalOpen(true)}>S'inscrire à la préparation</button>
            <button className="cert-detail-btn-quote" style={S.btnDevis} onMouseEnter={e=>{e.currentTarget.style.background="#1e3a8a";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#1e3a8a";}} onClick={()=>setDevisOpen(true)}>🏢 Devis entreprise</button>
            <p style={{textAlign:"center",fontSize:".76rem",color:"#64748b",padding:"0 18px 14px",margin:0}}>✓ Garantie satisfait ou remboursé 30 jours</p>
            <div style={{padding:"14px 18px",borderTop:"1px solid #f1f5f9"}}>
              <p style={{fontWeight:700,fontSize:".82rem",color:"#0f172a",margin:"0 0 10px"}}>La préparation comprend :</p>
              {cert.includes?.map((inc,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span>{inc.icon}</span><span style={{fontSize:".82rem",color:"#475569"}}>{inc.label}</span></div>)}
            </div>
            <div className="cert-detail-share-buttons" style={{padding:"12px 18px",display:"flex",gap:8,borderTop:"1px solid #f1f5f9"}}>
              {["🔗 Partager","🎁 Offrir"].map((l,i)=><button key={i} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 4px",fontSize:".72rem",fontWeight:600,cursor:"pointer",color:"#475569"}}>{l}</button>)}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      {modalOpen&&(
        <div style={S.overlayBg} onClick={()=>setModalOpen(false)}>
          <div className="cert-detail-pay-modal" style={S.payModal} onClick={e=>e.stopPropagation()}>
            <button style={S.payClose} onClick={()=>setModalOpen(false)}>✕</button>
            {success?(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:16}}>🎉</div>
                <h3 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 8px"}}>Inscription confirmée !</h3>
                <p style={{color:"#64748b",fontSize:".9rem"}}>Votre coach vous contactera sous 24h. Bienvenue chez BET !</p>
              </div>
            ):<>
              <h2 style={S.payTitle}>Inscription à la préparation {cert.name}</h2>
              <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:12,flexWrap:"wrap"}}>
                <span style={{color:"#64748b",fontSize:".88rem"}}>Formation : <strong style={{color:"#0f172a"}}>{cert.name} — {cert.fullName}</strong></span>
                <span style={{fontFamily:FD,fontSize:"1.2rem",color:"#0f172a",flexShrink:0}}>{cert.price}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div><p style={S.payLabel}>Nom complet *</p><input style={S.payInput} value={inscForm.nom} onChange={e=>setInscForm(p=>({...p,nom:e.target.value}))} placeholder="Jean Kouamé"/></div>
                <div><p style={S.payLabel}>Email *</p><input style={S.payInput} type="email" value={inscForm.email} onChange={e=>setInscForm(p=>({...p,email:e.target.value}))} placeholder="jean@exemple.com"/></div>
              </div>
              <div style={{marginBottom:20}}><p style={S.payLabel}>Téléphone *</p><input style={S.payInput} type="tel" value={inscForm.tel} onChange={e=>setInscForm(p=>({...p,tel:e.target.value}))} placeholder="+225 07 00 00 00 00"/></div>
              <div className="cert-detail-modal-btns" style={{display:"flex",gap:10,marginBottom:20}}>
                <button style={{...S.payMethodBtn,...(payMethod==="mobile"?S.payMethodActive:{})}} onClick={()=>setPayMethod("mobile")}>📱 Mobile Money</button>
                <button style={{...S.payMethodBtn,...(payMethod==="card"?S.payMethodActive:{})}} onClick={()=>setPayMethod("card")}>💳 Carte bancaire</button>
              </div>
              {payMethod==="mobile"&&(
                <div style={{animation:"certFI .2s ease"}}>
                  <p style={S.payLabel}>Choisissez votre opérateur :</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                    {[{id:"orange",label:"Orange Money",color:"#ff7900"},{id:"mtn",label:"MTN MoMo",color:"#ffcc00"},{id:"wave",label:"Wave",color:"#1fb6ff"},{id:"moov",label:"Moov Money",color:"#00a86b"}].map(op=>(
                      <button key={op.id} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${mobileOp===op.id?op.color:"#e2e8f0"}`,background:mobileOp===op.id?op.color+"22":"#fff",fontSize:".8rem",fontWeight:mobileOp===op.id?800:600,cursor:"pointer",fontFamily:FF}} onClick={()=>setMobileOp(op.id)}>{op.label}</button>
                    ))}
                  </div>
                  {mobileOp&&<><p style={S.payLabel}>Numéro {mobileOp} :</p><input style={S.payInput} value={inscForm.mobileNum} onChange={e=>setInscForm(p=>({...p,mobileNum:e.target.value}))} placeholder="07 00 00 00 00" maxLength={10}/></>}
                </div>
              )}
              {payMethod==="card"&&(
                <div style={{animation:"certFI .2s ease"}}>
                  <p style={S.payLabel}>Titulaire</p><input style={S.payInput} placeholder="Jean Kouamé"/>
                  <p style={S.payLabel}>Numéro de carte</p><input style={S.payInput} placeholder="•••• •••• •••• ••••" maxLength={19}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><p style={S.payLabel}>Expiration</p><input style={S.payInput} placeholder="MM/AA" maxLength={5}/></div>
                    <div><p style={S.payLabel}>CVV</p><input style={S.payInput} placeholder="•••" type="password" maxLength={4}/></div>
                  </div>
                  <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"9px 12px",fontSize:".74rem",color:"#166534",fontWeight:600,marginBottom:14,textAlign:"center"}}>🔒 SSL 256-bit — Visa & Mastercard acceptés</div>
                </div>
              )}
              {inscErreur&&<p style={{color:"#dc2626",fontSize:".82rem",textAlign:"center",margin:"0 0 10px"}}>{inscErreur}</p>}
              <button style={{...S.payConfirmBtn,opacity:inscLoading?.7:1}} onClick={handlePay} disabled={inscLoading} onMouseEnter={e=>e.currentTarget.style.opacity=".9"} onMouseLeave={e=>e.currentTarget.style.opacity=inscLoading?"1":".9"}>{inscLoading?"Envoi en cours...":"Confirmer et payer "+cert.price}</button>
              <p style={{textAlign:"center",fontSize:".74rem",color:"#94a3b8",marginTop:10}}>✓ Remboursement 30 jours · ✓ Accès immédiat · ✓ Sans engagement</p>
            </>}
          </div>
        </div>
      )}
      {/* MODAL DEVIS */}
      {devisOpen&&(
        <div style={S.overlayBg} onClick={()=>setDevisOpen(false)}>
          <div style={{...S.payModal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <button style={S.payClose} onClick={()=>setDevisOpen(false)}>✕</button>
            {devisSuccess?(
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:16}}>📩</div>
                <h3 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 8px",fontFamily:FD}}>Demande envoyée !</h3>
                <p style={{color:"#64748b",fontSize:".9rem",lineHeight:1.6}}>Notre équipe commerciale vous contactera sous 24h avec un devis personnalisé.</p>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>📋</div>
                  <div>
                    <h2 style={{...S.payTitle,margin:0,fontSize:"1.2rem"}}>Demande de devis</h2>
                    <p style={{fontSize:".78rem",color:"#64748b",margin:0}}>Préparation {cert.name} — {cert.fullName}</p>
                  </div>
                </div>
                <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:".82rem",color:"#92400e",display:"flex",gap:9,alignItems:"flex-start"}}>
                  <span>🏢</span>
                  <div><strong>Réservé aux entreprises uniquement.</strong> Ce service est destiné aux structures souhaitant préparer leurs collaborateurs aux certifications TOEIC, TOEFL ou IELTS.</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <p style={S.payLabel}>Nom du contact *</p>
                    <input style={S.payInput} placeholder="Jean Kouamé" value={devisForm.nom} onChange={e=>setDevisForm(p=>({...p,nom:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={S.payLabel}>Email *</p>
                    <input style={S.payInput} placeholder="jean@entreprise.ci" type="email" value={devisForm.email} onChange={e=>setDevisForm(p=>({...p,email:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={S.payLabel}>Téléphone *</p>
                    <input style={S.payInput} placeholder="07 00 00 00 00" value={devisForm.tel} onChange={e=>setDevisForm(p=>({...p,tel:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={S.payLabel}>Entreprise / Organisation *</p>
                    <input style={S.payInput} placeholder="Nom de la structure" value={devisForm.entreprise} onChange={e=>setDevisForm(p=>({...p,entreprise:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={S.payLabel}>Nombre de participants</p>
                    <select style={S.payInput} value={devisForm.participants} onChange={e=>setDevisForm(p=>({...p,participants:e.target.value}))}>
                      {["1","2","3-5","6-10","11-20","20+"].map(v=><option key={v} value={v}>{v} participant{v==="1"?"":"s"}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:"span 2"}}>
                    <p style={S.payLabel}>Message / Besoins spécifiques</p>
                    <textarea style={{...S.payInput,height:80,resize:"vertical",paddingTop:10}} placeholder="Décrivez votre besoin, vos objectifs, ou posez vos questions..." value={devisForm.message} onChange={e=>setDevisForm(p=>({...p,message:e.target.value}))}/>
                  </div>
                </div>
                <button style={{...S.payConfirmBtn,background:"linear-gradient(135deg,#1e3a8a,#0891b2)"}} onClick={handleDevis} onMouseEnter={e=>e.currentTarget.style.opacity=".9"} onMouseLeave={e=>e.currentTarget.style.opacity="1"} disabled={!devisForm.nom||!devisForm.email||!devisForm.tel||!devisForm.entreprise}>
                  Envoyer ma demande de devis →
                </button>
                <p style={{textAlign:"center",fontSize:".74rem",color:"#94a3b8",marginTop:10}}>✓ Réponse sous 24h · ✓ Sans engagement · ✓ Devis gratuit</p>
              </>
            )}
          </div>
        </div>
      )}
      <Footer/>
    </div>
  );
};

const FF = "'Montserrat','Segoe UI',sans-serif";
const FD = "'Montserrat','Segoe UI',sans-serif";
const S={
  page:       {fontFamily:FF,color:"#0f172a",background:"#fff",minHeight:"100vh",overflowX:"hidden"},
  hero:       {padding:"52px 0 40px",position:"relative"},
  heroInner:  {maxWidth:1180,margin:"0 auto",padding:"0 24px"},
  breadcrumb: {display:"flex",alignItems:"center",gap:8,marginBottom:20,fontSize:".82rem",flexWrap:"wrap"},
  bLink:      {color:"#93c5fd",cursor:"pointer",textDecoration:"underline"},
  bSep:       {color:"rgba(255,255,255,.3)"},
  tagBlue:    {background:"rgba(30,58,138,.3)",border:"1px solid rgba(30,58,138,.6)",color:"#93c5fd",borderRadius:999,padding:"4px 14px",fontSize:".73rem",fontWeight:800,letterSpacing:".05em"},
  tagGold:    {background:"rgba(251,191,36,.2)",border:"1px solid rgba(251,191,36,.4)",color:"#fde68a",borderRadius:999,padding:"4px 14px",fontSize:".73rem",fontWeight:800},
  heroTitle:  {fontFamily:FD,fontSize:"clamp(2rem,5vw,3.5rem)",color:"#fff",margin:"0 0 6px",fontWeight:400,lineHeight:1.1},
  heroPill:   {background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"rgba(255,255,255,.8)",borderRadius:6,padding:"4px 12px",fontSize:".78rem",fontWeight:500},
  tabsBar:    {background:"#fff",borderBottom:"1px solid #e2e8f0",position:"relative",zIndex:50},
  tabsSticky: {position:"sticky",top:0,boxShadow:"0 2px 8px rgba(0,0,0,.06)"},
  tabsInner:  {maxWidth:1180,margin:"0 auto",padding:"0 24px",display:"flex",overflowX:"auto",gap:4},
  tabBtn:     {background:"none",border:"none",borderBottom:"3px solid transparent",padding:"14px 18px",fontSize:".88rem",fontWeight:600,color:"#64748b",cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",fontFamily:FF},
  tabActive:  {color:"#dc2626",borderBottomColor:"#dc2626"},
  layout:     {maxWidth:1180,margin:"0 auto",padding:"36px 24px",display:"grid",gridTemplateColumns:"1fr 320px",gap:40,alignItems:"start"},
  contentCol: {minWidth:0},
  section:    {marginBottom:40,paddingBottom:36,borderBottom:"1px solid #f1f5f9"},
  sH2:        {fontFamily:FD,fontSize:"1.4rem",fontWeight:400,margin:"0 0 20px",color:"#0f172a"},
  descP:      {fontSize:".95rem",color:"#475569",lineHeight:1.75,margin:"0 0 14px"},
  advDot:     {width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#dc2626,#1e3a8a)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",fontWeight:800,flexShrink:0},
  examCard:   {borderRadius:14,padding:"22px 20px",border:"1.5px solid #e2e8f0",background:"#fff",transition:"all .25s",cursor:"default"},
  examPill:   {background:"#eff6ff",color:"#1e3a8a",borderRadius:6,padding:"3px 10px",fontSize:".76rem",fontWeight:700},
  sidebar:    {position:"sticky",alignSelf:"start",transition:"top .3s"},
  sideCard:   {background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.08)"},
  btnEnroll:  {display:"block",width:"calc(100% - 36px)",margin:"0 18px 10px",padding:"13px",background:"#dc2626",color:"#fff",border:"none",borderRadius:999,fontFamily:FF,fontWeight:800,fontSize:".95rem",cursor:"pointer",transition:"background .2s"},
  btnDevis:   {display:"block",width:"calc(100% - 36px)",margin:"0 18px 8px",padding:"12px",background:"transparent",color:"#1e3a8a",border:"1.5px solid #1e3a8a",borderRadius:999,fontFamily:FF,fontWeight:700,fontSize:".88rem",cursor:"pointer",transition:"all .2s"},
  overlayBg:  {position:"fixed",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:16,animation:"certFI .2s ease"},
  payModal:   {background:"#fff",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"28px",position:"relative",animation:"certSI .25s ease",boxShadow:"0 30px 80px rgba(0,0,0,.22)"},
  payClose:   {position:"absolute",top:14,right:14,background:"#f1f5f9",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:".9rem",color:"#64748b"},
  payTitle:   {fontFamily:FD,fontSize:"1.35rem",margin:"0 0 16px",fontWeight:400},
  payLabel:   {fontSize:".8rem",fontWeight:700,color:"#0f172a",margin:"0 0 6px"},
  payMethodBtn:{flex:1,padding:"10px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",fontFamily:FF,fontWeight:700,fontSize:".86rem",cursor:"pointer",transition:"all .2s"},
  payMethodActive:{borderColor:"#dc2626",background:"#fef2f2",color:"#dc2626"},
  payInput:   {width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:".9rem",fontFamily:FF,outline:"none",marginBottom:14,boxSizing:"border-box"},
  payConfirmBtn:{width:"100%",padding:"13px",background:"linear-gradient(135deg,#dc2626,#1e3a8a)",color:"#fff",border:"none",borderRadius:999,fontFamily:FF,fontWeight:800,fontSize:"1rem",cursor:"pointer",transition:"opacity .2s"},
};

export default CertificationDetail;