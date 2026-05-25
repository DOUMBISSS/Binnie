import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { certificationsData } from "../../../data/certificationsData";
import Footer from "../../Footer/Footer";
import { insertDemandeDevis, insertInscriptionAdulte } from "../../../services/formsService";
import { supabase } from "../../../config/supabase";
import PromosBanner from "../PromosBanner/PromosBanner";

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

function lireCertifLS(id) {
  try {
    const s = localStorage.getItem("bet_certifications_config");
    if (s) { const cfg = JSON.parse(s); if (cfg[id?.toLowerCase()]) return cfg[id.toLowerCase()]; }
  } catch {}
  return null;
}

const CertificationDetail=()=>{
  const{certId}=useParams(); const navigate=useNavigate();
  const[searchParams,setSearchParams]=useSearchParams();
  const rawCert=certificationsData?.[certId?.toLowerCase()];
  const baseKey=certId?.toLowerCase();

  const buildCert=(lsData)=>{
    const mock=MOCK[baseKey]||MOCK.toeic;
    if(lsData) return {...mock,...(rawCert||{}),...lsData};
    if(rawCert) return {...mock,...rawCert};
    return mock;
  };

  const[cert,setCert]=useState(()=>buildCert(lireCertifLS(certId)));

  useEffect(()=>{
    // Sync depuis Supabase au montage (le dashboard admin est sur un port différent — localStorage non partagé)
    supabase.from("plateforme_config").select("valeur").eq("key","certifications_config").maybeSingle()
      .then(({data,error})=>{
        if(!error && data?.valeur && typeof data.valeur==="object"){
          localStorage.setItem("bet_certifications_config",JSON.stringify(data.valeur));
          setCert(buildCert(lireCertifLS(certId)));
        }
      });
    const onStorage=(e)=>{ if(e.key==="bet_certifications_config") setCert(buildCert(lireCertifLS(certId))); };
    window.addEventListener("storage",onStorage);
    return()=>window.removeEventListener("storage",onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[certId]);

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
  const[codePromo,setCodePromo]=useState("");
  const[codePromoApplied,setCodePromoApplied]=useState(null);
  const[codePromoLoading,setCodePromoLoading]=useState(false);
  const[codePromoError,setCodePromoError]=useState("");
  const[sbUser,setSbUser]=useState(null);
  const[devisAuthGate,setDevisAuthGate]=useState(false);
  const[devisAuthTab,setDevisAuthTab]=useState("login");
  const[devisAuthForm,setDevisAuthForm]=useState({email:"",password:"",prenom:"",nom:"",telephone:""});
  const[devisAuthLoad,setDevisAuthLoad]=useState(false);
  const[devisAuthErr,setDevisAuthErr]=useState("");
  // ── Avis certifications ──
  const[avisLive,setAvisLive]=useState([]);
  const[avisLoading,setAvisLoading]=useState(false);
  const[avisModalOpen,setAvisModalOpen]=useState(false);
  const[avisForm,setAvisForm]=useState({note:5,texte:""});
  const[avisSubmitting,setAvisSubmitting]=useState(false);
  const[avisMsg,setAvisMsg]=useState(null);
  const[isApprenantBET,setIsApprenantBET]=useState(false);
  const[avisDejaPoste,setAvisDejaPoste]=useState(false);
  const heroRef=useRef(null);
  const iframeRef=useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // ── Média hero configurable ─────────────────────────────────────────────
  const [heroMedia, setHeroMedia] = useState(null);
  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
    fetch(`${API}/api/offre-media/${certId?.toLowerCase()}/publiques`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.media?.length) setHeroMedia(d.media[0]); })
      .catch(() => {});
  }, [certId]);

  function buildHeroEmbedUrl(url) {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?controls=1`;
    return url;
  }

  const prefillForm=(u)=>{
    const m=u?.user_metadata||{};
    setInscForm(p=>({
      ...p,
      nom: m.full_name||m.nom||m.prenom||(m.first_name&&m.last_name?`${m.first_name} ${m.last_name}`:`${m.first_name||""} ${m.last_name||""}`.trim())||p.nom||"",
      email: u.email||m.email||p.email||"",
      tel: m.telephone||m.phone||m.tel||p.tel||"",
    }));
  };

  const prefillDevisForm=(u)=>{
    if(!u) return;
    const m=u?.user_metadata||{};
    setDevisForm(p=>({
      ...p,
      nom: m.full_name||(m.prenom&&m.nom?`${m.prenom} ${m.nom}`:"")||p.nom||"",
      email: u.email||p.email||"",
      tel: m.telephone||m.phone||m.tel||p.tel||"",
    }));
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setSbUser(session?.user||null);
      if(session?.user){ prefillForm(session.user); prefillDevisForm(session.user); }
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      setSbUser(session?.user||null);
      if(session?.user){ prefillForm(session.user); prefillDevisForm(session.user); setDevisAuthGate(false); setDevisAuthErr(""); }
    });
    return()=>subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── Avis : chargement live ────────────────────────────────────────────────
  useEffect(()=>{
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    setAvisLoading(true);
    fetch(`${API}/api/avis/publics?offre_type=certification`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.avis) setAvisLive(d.avis); })
      .catch(()=>{})
      .finally(()=>setAvisLoading(false));
  },[]);

  useEffect(()=>{
    if(!sbUser?.email) return;
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    fetch(`${API}/api/auth/prospect-info?email=${encodeURIComponent(sbUser.email)}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.is_apprenant) setIsApprenantBET(true); })
      .catch(()=>{});
  },[sbUser]);

  useEffect(()=>{
    if(!sbUser?.email||!isApprenantBET) return;
    fetch(`${process.env.REACT_APP_API_URL||"http://localhost:5001"}/api/avis/publics?offre_type=certification&limit=200`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ setAvisDejaPoste(!!(d?.avis?.some(a=>a.apprenant_email===sbUser.email))); })
      .catch(()=>{});
  },[sbUser,isApprenantBET]);

  const submitAvis=async()=>{
    if(avisForm.texte.trim().length<20) return;
    setAvisSubmitting(true); setAvisMsg(null);
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      const{data:{session}}=await supabase.auth.getSession();
      const r=await fetch(`${API}/api/avis`,{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
        body:JSON.stringify({offre_type:"certification",offre_id:certId,note:avisForm.note,texte:avisForm.texte.trim()}),
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error);
      setAvisMsg({type:"ok",text:d.message});
      setAvisDejaPoste(true);
      fetch(`${API}/api/avis/publics?offre_type=certification`)
        .then(res=>res.ok?res.json():null).then(d=>{ if(d?.avis) setAvisLive(d.avis); });
      setTimeout(()=>setAvisModalOpen(false),2000);
    }catch(err){ setAvisMsg({type:"err",text:err.message}); }
    finally{ setAvisSubmitting(false); }
  };

  // Détecte le retour après login (Google OAuth) et rouvre la modal paiement
  useEffect(()=>{
    if(searchParams.get("openPayment")!=="1") return;
    sessionStorage.removeItem("bet_return_context");
    setModalOpen(true);
    setSearchParams(p=>{p.delete("openPayment");return p;},{replace:true});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{const h=()=>setStickyBar(window.scrollY>(heroRef.current?.offsetHeight||400)-80);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  const sendYTCmd=(func,args=[])=>{
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args}),"*");
  };
  const handleMute=()=>{ sendYTCmd(isMuted?"unMute":"mute"); setIsMuted(m=>!m); };
  const handleReplay=()=>{ sendYTCmd("seekTo",[0,true]); sendYTCmd("playVideo"); };

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

  const TABS=[{id:"apercu",label:"Aperçu"},{id:"examen",label:"Structure de l'examen"},{id:"programme",label:"Programme de préparation"},{id:"avis",label:`Avis (${avisLive.length||cert.testimonials?.length||0})`},{id:"faq",label:"FAQ"}];
  const validerCodePromo=async()=>{
    const code=codePromo.trim().toUpperCase();
    if(!code)return;
    setCodePromoLoading(true);setCodePromoError("");setCodePromoApplied(null);
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      const token=localStorage.getItem("bet_token")||"";
      const r=await fetch(`${API}/api/codes-promo/valider`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({code,offre_type:"certifications"})});
      const d=await r.json();
      if(!r.ok){setCodePromoError(d.error||"Code invalide");return;}
      setCodePromoApplied(d);
    }catch{setCodePromoError("Impossible de vérifier le code");}
    finally{setCodePromoLoading(false);}
  };

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
        code_promo:codePromoApplied?.code||undefined,
      });
      setSuccess(true);
      setTimeout(()=>{setSuccess(false);setModalOpen(false);setInscForm({nom:"",email:"",tel:"",mobileNum:""});setCodePromo("");setCodePromoApplied(null);setCodePromoError("");},3000);
    }catch(e){
      setInscErreur("Une erreur est survenue. Veuillez réessayer.");
    }finally{
      setInscLoading(false);
    }
  };
  const handleDevisAuthLogin=async()=>{
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    if(!devisAuthForm.email||!devisAuthForm.password) return setDevisAuthErr("Email et mot de passe requis.");
    setDevisAuthLoad(true); setDevisAuthErr("");
    try{
      const res=await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:devisAuthForm.email,password:devisAuthForm.password})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Email ou mot de passe incorrect");
      await supabase.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
      // onAuthStateChange pré-remplira le formulaire automatiquement
    }catch(err){setDevisAuthErr(err.message);}
    finally{setDevisAuthLoad(false);}
  };

  const handleDevisAuthRegister=async()=>{
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    if(!devisAuthForm.prenom||!devisAuthForm.nom||!devisAuthForm.email||!devisAuthForm.password) return setDevisAuthErr("Tous les champs * sont requis.");
    setDevisAuthLoad(true); setDevisAuthErr("");
    try{
      const res=await fetch(`${API}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom:devisAuthForm.nom,prenom:devisAuthForm.prenom,email:devisAuthForm.email,telephone:devisAuthForm.telephone,password:devisAuthForm.password})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Erreur lors de l'inscription");
      const{error}=await supabase.auth.signInWithPassword({email:devisAuthForm.email,password:devisAuthForm.password});
      if(error) throw new Error(error.message);
    }catch(err){setDevisAuthErr(err.message);}
    finally{setDevisAuthLoad(false);}
  };

  const handleDevis=async()=>{
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      await insertDemandeDevis({nom:devisForm.nom,email:devisForm.email,tel:devisForm.tel,entreprise:devisForm.entreprise||null,participants:devisForm.participants,message:devisForm.message||null,source:"certification",source_nom:`${cert.name} — ${cert.fullName}`});
      // Auto-assignation à l'assistante corporate dédiée (B2B)
      try{
        const ar=await fetch(`${API}/api/parcours/assistantes-ligne?profil=b2b`);
        const ad=await ar.json();
        const ca=(ad.assistantes||[])[0]||null;
        if(ca){
          await fetch(`${API}/api/parcours/assignation`,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({assistante_id:ca.id,prospect_nom:devisForm.nom,prospect_email:devisForm.email||undefined,prospect_telephone:devisForm.tel||undefined,type_cours:"en_ligne",source:"devis_certification"}),
          });
        }
      }catch{/* silent */}
      setDevisSuccess(true);
      setTimeout(()=>{setDevisSuccess(false);setDevisOpen(false);setDevisForm({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});},3000);
    }catch(err){console.error("Erreur devis:",err);}
  };

  return(
    <div className="cert-detail-root" style={S.page}>
      {/* HERO */}
      <div ref={heroRef} style={heroMedia ? {
          ...S.hero,
          backgroundImage: heroMedia.type==="image" ? undefined : `linear-gradient(135deg,rgba(10,20,50,.88) 0%,rgba(30,58,138,.7) 100%), url(${cert.heroImage})`,
          backgroundSize:"cover", backgroundPosition:"center",
          minHeight: heroMedia.type==="video" ? 500 : 420,
        } : {
          ...S.hero,
          backgroundImage:`linear-gradient(135deg,rgba(10,20,50,.88) 0%,rgba(30,58,138,.7) 100%), url(${cert.heroImage})`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}>
        {/* ── Fond media plein hero ── */}
        {heroMedia && heroMedia.type==="video" && (
          <iframe
            ref={iframeRef}
            src={buildHeroEmbedUrl(heroMedia.url)}
            title={heroMedia.titre||"Présentation"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position:"absolute", top:"50%", left:"50%",
              width:"100%", height:"56.25vw",
              minWidth:"177.78vh", minHeight:"100%",
              transform:"translate(-50%,-50%)",
              zIndex:1,
            }}
          />
        )}
        {heroMedia && heroMedia.type==="image" && (
          <div style={{
            position:"absolute", inset:0, zIndex:1,
            backgroundImage:`url(${heroMedia.url})`,
            backgroundSize:"cover", backgroundPosition:"center",
          }}/>
        )}
        {heroMedia && (
          <div style={{
            position:"absolute", inset:0, zIndex:2, pointerEvents:"none",
            background: heroMedia.type==="video"
              ? "linear-gradient(to bottom, rgba(0,0,0,.08) 0%, rgba(8,16,40,.75) 100%)"
              : "linear-gradient(135deg, rgba(10,20,50,.75) 0%, rgba(30,58,138,.55) 100%)",
          }}/>
        )}

        {heroMedia&&heroMedia.type==="video"&&(
          <div style={{position:"absolute",bottom:18,right:20,display:"flex",gap:8,zIndex:4}}>
            <button onClick={handleReplay} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",border:"1.5px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:100,padding:"6px 14px",fontSize:".8rem",fontWeight:600,cursor:"pointer"}}>
              ↺ Rejouer
            </button>
            <button onClick={handleMute} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",border:"1.5px solid rgba(255,255,255,.3)",color:"#fff",borderRadius:100,padding:"6px 14px",fontSize:".8rem",fontWeight:600,cursor:"pointer"}}>
              {isMuted?"🔊 Son":"🔇 Muet"}
            </button>
          </div>
        )}

        <div className="cert-detail-hero-inner" style={{ ...S.heroInner, position:"relative", zIndex:3 }}>
          <div style={S.breadcrumb}><span style={S.bLink} onClick={()=>navigate("/")}>Accueil</span><span style={S.bSep}>/</span><span style={S.bLink} onClick={()=>navigate(-1)}>Certifications</span><span style={S.bSep}>/</span><span style={{color:"#e2e8f0"}}>{cert.name}</span></div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <span style={S.tagBlue}>🏆 CERTIFICATION OFFICIELLE</span>
            <span style={S.tagGold}>📊 {cert.level}</span>
          </div>
          <h1 className="cert-detail-hero-title" style={S.heroTitle}>{heroMedia?.titre||cert.name}</h1>
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
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24}}>
                  <h2 style={{...S.sH2,margin:0}}>Avis des certifiés BET</h2>
                  {isApprenantBET && !avisDejaPoste && (
                    <button onClick={()=>{setAvisForm({note:5,texte:""});setAvisMsg(null);setAvisModalOpen(true);}}
                      style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:999,padding:"10px 22px",fontWeight:800,fontSize:".85rem",cursor:"pointer",boxShadow:"0 4px 14px rgba(30,58,138,.25)"}}>
                      ✍️ Laisser mon avis
                    </button>
                  )}
                  {isApprenantBET && avisDejaPoste && (
                    <span style={{background:"#d1fae5",color:"#065f46",borderRadius:999,padding:"6px 16px",fontSize:".8rem",fontWeight:700}}>✅ Votre avis a été publié</span>
                  )}
                  {!sbUser && (
                    <span style={{fontSize:".8rem",color:"#64748b"}}>Connectez-vous pour laisser un avis (réservé aux apprenants BET)</span>
                  )}
                </div>

                {avisLive.length>0&&(()=>{
                  const avg=(avisLive.reduce((s,a)=>s+a.note,0)/avisLive.length).toFixed(1);
                  const dist=[5,4,3,2,1].map(n=>({n,count:avisLive.filter(a=>a.note===n).length}));
                  return(
                    <div style={{display:"flex",gap:32,alignItems:"center",background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:24,marginBottom:24,flexWrap:"wrap"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90}}>
                        <div style={{fontSize:"3rem",fontWeight:900,color:"#0f172a",lineHeight:1}}>{avg}</div>
                        <Stars r={Number(avg)} size={20}/>
                        <div style={{fontSize:".76rem",color:"#64748b",fontWeight:600,marginTop:4}}>{avisLive.length} avis</div>
                      </div>
                      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                        {dist.map(({n,count})=>{
                          const pct=Math.round((count/avisLive.length)*100);
                          return(
                            <div key={n} style={{display:"flex",alignItems:"center",gap:10}}>
                              <Stars r={n} size={11}/>
                              <div style={{flex:1,height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}>
                                <div style={{width:`${pct}%`,height:"100%",background:"#f59e0b",borderRadius:4}}/>
                              </div>
                              <span style={{fontSize:".76rem",color:"#64748b",width:30,textAlign:"right"}}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {avisLoading&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Chargement des avis…</div>}
                {!avisLoading&&avisLive.length===0&&(
                  <div style={{textAlign:"center",padding:"48px 24px",background:"#f8fafc",borderRadius:12,border:"1.5px dashed #e2e8f0"}}>
                    <div style={{fontSize:"2.5rem",marginBottom:12}}>💬</div>
                    <p style={{color:"#64748b",fontSize:".9rem",margin:0}}>Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {avisLive.map((a)=>(
                    <div key={a.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#0f172a,#1e3a8a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",fontWeight:800,color:"#fff",flexShrink:0}}>
                          {(a.apprenant_nom||"?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:800,fontSize:".88rem",color:"#0f172a"}}>{a.apprenant_nom||"Apprenant BET"}</div>
                          <div style={{fontSize:".73rem",color:"#64748b"}}>{new Date(a.created_at).toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"})}</div>
                        </div>
                        <div style={{marginLeft:"auto"}}><Stars r={a.note} size={14}/></div>
                      </div>
                      <p style={{fontSize:".9rem",color:"#475569",lineHeight:1.65,margin:0,fontStyle:"italic"}}>"{a.texte}"</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Modal avis certif */}
          {avisModalOpen&&(
            <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setAvisModalOpen(false)}>
              <div style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                  <h3 style={{margin:0,fontSize:"1.1rem",fontWeight:800,color:"#0f172a"}}>✍️ Mon avis sur cette certification</h3>
                  <button onClick={()=>setAvisModalOpen(false)} style={{background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:"#64748b",lineHeight:1}}>✕</button>
                </div>
                <label style={{fontSize:".83rem",fontWeight:700,color:"#334155",display:"block",marginBottom:8}}>Votre note *</label>
                <div style={{display:"flex",gap:6,marginBottom:20}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>setAvisForm(p=>({...p,note:n}))}
                      style={{fontSize:"1.8rem",background:"none",border:"none",cursor:"pointer",color:n<=avisForm.note?"#f59e0b":"#e2e8f0",transition:"color .12s,transform .1s",transform:n<=avisForm.note?"scale(1.12)":"scale(1)"}}>★</button>
                  ))}
                  <span style={{alignSelf:"center",fontSize:".82rem",color:"#94a3b8",marginLeft:4}}>{["","Mauvais","Passable","Bien","Très bien","Excellent"][avisForm.note]}</span>
                </div>
                <label style={{fontSize:".83rem",fontWeight:700,color:"#334155",display:"block",marginBottom:6}}>Votre avis * <span style={{fontWeight:400,color:"#94a3b8"}}>({avisForm.texte.length}/500, min. 20)</span></label>
                <textarea value={avisForm.texte} onChange={e=>setAvisForm(p=>({...p,texte:e.target.value.slice(0,500)}))}
                  rows={4} placeholder="Partagez votre retour sur la préparation, les résultats, le coaching…"
                  style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:".88rem",resize:"vertical",boxSizing:"border-box",outline:"none",fontFamily:"inherit",lineHeight:1.6}}
                  onFocus={e=>e.target.style.borderColor="#1e3a8a"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                {avisMsg&&(
                  <div style={{background:avisMsg.type==="ok"?"#d1fae5":"#fee2e2",color:avisMsg.type==="ok"?"#065f46":"#dc2626",borderRadius:8,padding:"10px 14px",fontSize:".82rem",marginTop:12}}>
                    {avisMsg.type==="ok"?"✅":"❌"} {avisMsg.text}
                  </div>
                )}
                <button onClick={submitAvis} disabled={avisSubmitting||avisForm.texte.trim().length<20}
                  style={{width:"100%",marginTop:18,padding:"13px",background:avisForm.texte.trim().length<20?"#e2e8f0":"#1e3a8a",color:avisForm.texte.trim().length<20?"#94a3b8":"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:".95rem",cursor:avisForm.texte.trim().length<20?"not-allowed":"pointer",transition:"background .2s"}}>
                  {avisSubmitting?"Envoi en cours…":"Publier mon avis →"}
                </button>
              </div>
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
            <div style={{padding:"0 12px 4px"}}>
              <PromosBanner
                offreType="certifications"
                accentColor="#1e3a8a"
                onApply={(code)=>{setCodePromo(code);setCodePromoApplied(null);setCodePromoError("");setModalOpen(true);}}
              />
            </div>
            <button className="cert-detail-btn-enroll" style={S.btnEnroll} onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={e=>e.currentTarget.style.background="#dc2626"} onClick={()=>setModalOpen(true)}>S'inscrire à la préparation</button>
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
        <div style={S.overlayBg} onClick={()=>{setModalOpen(false);setCodePromo("");setCodePromoApplied(null);setCodePromoError("");}}>
          <div className="cert-detail-pay-modal" style={S.payModal} onClick={e=>e.stopPropagation()}>
            <button style={S.payClose} onClick={()=>{setModalOpen(false);setCodePromo("");setCodePromoApplied(null);setCodePromoError("");}}>✕</button>
            {/* ── Auth gate ── */}
            {!sbUser?(
              <div style={{textAlign:"center",padding:"20px 0 10px"}}>
                <div style={{fontSize:"3rem",marginBottom:12}}>🔐</div>
                <h3 style={{fontSize:"1.2rem",fontWeight:800,margin:"0 0 8px",color:"#0f172a"}}>Connexion requise</h3>
                <p style={{color:"#64748b",fontSize:".9rem",margin:"0 0 6px"}}>Vous devez être connecté pour finaliser votre inscription.</p>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",margin:"14px 0",textAlign:"left"}}>
                  <div style={{fontSize:".78rem",color:"#64748b"}}>Préparation sélectionnée</div>
                  <div style={{fontWeight:700,fontSize:".95rem",color:"#0f172a"}}>{cert.name} — {cert.fullName}</div>
                  <div style={{fontFamily:FD,fontSize:"1.2rem",color:"#1e3a8a"}}>{cert.price}</div>
                </div>
                <button onClick={()=>window.dispatchEvent(new CustomEvent("bet:openLoginModal",{detail:{returnUrl:window.location.pathname+window.location.search,context:{type:"certification"}}}))}
                  style={{width:"100%",padding:"13px",background:"#1e3a8a",color:"#fff",border:"none",borderRadius:999,fontWeight:800,fontSize:".95rem",cursor:"pointer",margin:"4px 0 10px"}}>
                  🔑 Se connecter / S'inscrire
                </button>
                <p style={{fontSize:".74rem",color:"#94a3b8",margin:0}}>Votre sélection sera conservée à votre retour.</p>
              </div>
            ):success?(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:16}}>🎉</div>
                <h3 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 8px"}}>Inscription confirmée !</h3>
                <p style={{color:"#64748b",fontSize:".9rem"}}>Votre coach vous contactera sous 24h. Bienvenue chez BET !</p>
              </div>
            ):<>
              {/* Bandeau profil connecté */}
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:"1rem"}}>✅</span>
                <span style={{fontSize:".8rem",color:"#166534",fontWeight:600}}>Connecté en tant que <strong>{sbUser.user_metadata?.full_name||sbUser.email}</strong></span>
              </div>
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
              {/* Code promo */}
              <div style={{marginBottom:16}}>
                <p style={{fontSize:".78rem",fontWeight:700,color:"#374151",marginBottom:8}}>🏷️ Code promo <span style={{fontWeight:400,color:"#94a3b8"}}>(optionnel)</span></p>
                {codePromoApplied?(
                  <div style={{display:"flex",alignItems:"center",gap:10,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,padding:"10px 14px"}}>
                    <span>✅</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:".82rem",color:"#166534"}}>{codePromoApplied.code} appliqué !</div>
                      <div style={{fontSize:".72rem",color:"#166534"}}>Réduction : {codePromoApplied.type_reduction==="pourcentage"?`-${codePromoApplied.valeur}%`:`-${Number(codePromoApplied.valeur).toLocaleString("fr-FR")} FCFA`}{codePromoApplied.description&&` · ${codePromoApplied.description}`}</div>
                    </div>
                    <button onClick={()=>{setCodePromoApplied(null);setCodePromo("");setCodePromoError("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:16,padding:0}}>✕</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8}}>
                    <input value={codePromo} onChange={e=>{setCodePromo(e.target.value.toUpperCase());setCodePromoError("");}}
                      onKeyDown={e=>e.key==="Enter"&&validerCodePromo()}
                      placeholder="Ex : BET2025"
                      style={{flex:1,padding:"10px 13px",border:`1.5px solid ${codePromoError?"#dc2626":"#e2e8f0"}`,borderRadius:9,fontSize:".82rem",fontFamily:"monospace",letterSpacing:1,outline:"none"}} />
                    <button onClick={validerCodePromo} disabled={!codePromo.trim()||codePromoLoading}
                      style={{padding:"0 16px",background:"#1e3a8a",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:".78rem",opacity:(!codePromo.trim()||codePromoLoading)?.5:1,whiteSpace:"nowrap"}}>
                      {codePromoLoading?"⏳":"Appliquer"}
                    </button>
                  </div>
                )}
                {codePromoError&&<p style={{margin:"5px 0 0",fontSize:".72rem",color:"#dc2626"}}>{codePromoError}</p>}
              </div>

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
            ):devisAuthGate?(
              <div>
                <h2 style={{fontSize:"1.1rem",fontWeight:800,margin:"0 0 6px",fontFamily:FD}}>Connexion requise</h2>
                <p style={{color:"#64748b",fontSize:".82rem",marginBottom:14,lineHeight:1.6}}>Connectez-vous pour pré-remplir votre demande automatiquement. Votre sélection est conservée.</p>
                <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1.5px solid #e2e8f0",marginBottom:14}}>
                  {[["login","Se connecter"],["register","Créer un compte"]].map(([t,l])=>(
                    <button key={t} onClick={()=>setDevisAuthTab(t)} style={{flex:1,padding:"9px 0",border:"none",fontWeight:700,fontSize:".82rem",cursor:"pointer",background:devisAuthTab===t?"#1e3a8a":"#fff",color:devisAuthTab===t?"#fff":"#374151"}}>{l}</button>
                  ))}
                </div>
                {devisAuthTab==="login"?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <input type="email" placeholder="Email *" value={devisAuthForm.email} onChange={e=>setDevisAuthForm(p=>({...p,email:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                    <input type="password" placeholder="Mot de passe *" value={devisAuthForm.password} onChange={e=>setDevisAuthForm(p=>({...p,password:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <input placeholder="Prénom *" value={devisAuthForm.prenom} onChange={e=>setDevisAuthForm(p=>({...p,prenom:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                      <input placeholder="Nom *" value={devisAuthForm.nom} onChange={e=>setDevisAuthForm(p=>({...p,nom:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                    </div>
                    <input type="email" placeholder="Email *" value={devisAuthForm.email} onChange={e=>setDevisAuthForm(p=>({...p,email:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                    <input placeholder="Téléphone" value={devisAuthForm.telephone} onChange={e=>setDevisAuthForm(p=>({...p,telephone:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                    <input type="password" placeholder="Mot de passe *" value={devisAuthForm.password} onChange={e=>setDevisAuthForm(p=>({...p,password:e.target.value}))} style={{padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:".84rem",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  </div>
                )}
                {devisAuthErr&&<p style={{fontSize:".78rem",margin:"8px 0 0",color:"#dc2626",textAlign:"center"}}>{devisAuthErr}</p>}
                <button onClick={devisAuthTab==="login"?handleDevisAuthLogin:handleDevisAuthRegister} disabled={devisAuthLoad}
                  style={{width:"100%",marginTop:14,padding:"12px",background:"#1e3a8a",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",opacity:devisAuthLoad?.7:1,fontSize:".88rem"}}>
                  {devisAuthLoad?"Chargement…":devisAuthTab==="login"?"Se connecter →":"Créer mon compte →"}
                </button>
                <button onClick={()=>{setDevisOpen(false);setDevisAuthGate(false);}}
                  style={{width:"100%",marginTop:8,padding:"9px",background:"transparent",color:"#64748b",border:"1.5px solid #e2e8f0",borderRadius:8,fontWeight:600,fontSize:".8rem",cursor:"pointer"}}>
                  ← Annuler
                </button>
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