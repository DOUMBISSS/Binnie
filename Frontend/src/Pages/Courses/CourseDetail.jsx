import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { coursesData } from "../../data/coursesData";
import Footer from "../Footer/Footer";
import { insertDemandeDevis, insertInscriptionAdulte } from "../../services/formsService";
import { supabase } from "../../config/supabase";
import PromosBanner from "../Components/PromosBanner/PromosBanner";

const CENTRES_MASTER_KEY   = "bet_centres_master";
const OFFRES_EN_LIGNE_KEY  = "bet_offres_en_ligne";
const OFFRES_DOMICILE_KEY  = "bet_offres_domicile";
const COURSE_APERCU_KEY    = "bet_course_apercu_config";

function apercuFromLS(typeParam) {
  const lsType = typeParam === "en-ligne" ? "en_ligne" : typeParam === "domicile" ? "domicile" : null;
  if (!lsType) return null;
  try {
    const s = localStorage.getItem(COURSE_APERCU_KEY);
    if (!s) return null;
    const cfg = JSON.parse(s);
    return cfg[lsType] || null;
  } catch { return null; }
}

function offresFromLS(lsKey) {
  try {
    const s = localStorage.getItem(lsKey);
    if (!s) return null;
    const list = JSON.parse(s).filter(o => o.actif !== false);
    if (!list.length) return null;
    return list.map(o => ({ name: o.label, price: o.prix || "Sur devis", duration: o.duration || "", details: o.desc || "", brochure_url: o.brochure_url || "", brochure_nom: o.brochure_nom || "" }));
  } catch { return null; }
}
function loadCabinetCourse(centreKey) {
  if (!centreKey) return null;
  try {
    const s = localStorage.getItem(CENTRES_MASTER_KEY);
    if (!s) return null;
    const list = JSON.parse(s);
    const centre = list.find(c => c.key === centreKey && c.actif !== false);
    if (!centre) return null;
    const formats = (centre.offres || [])
      .filter(o => o.actif !== false)
      .map(o => ({ name: o.label, price: o.prix, duration: o.duration || "", details: o.desc, brochure_url: o.brochure_url || "", brochure_nom: o.brochure_nom || "" }));
    return {
      title: centre.name,
      subtitle: centre.subtitle || `Apprenez à ${centre.ville} dans un cadre moderne`,
      heroImage: centre.hero_image || undefined,
      description: centre.description,
      advantages: centre.advantages?.length ? centre.advantages : undefined,
      formats: formats.length ? formats : undefined,
      testimonials: centre.testimonials?.length ? centre.testimonials : undefined,
      faq: centre.faq?.length ? centre.faq : undefined,
    };
  } catch { return null; }
}

if (!document.querySelector("#cd-fonts")) {
  const l = document.createElement("link"); l.id="cd-fonts"; l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#cd-kf")) {
  const s = document.createElement("style"); s.id="cd-kf";
  s.textContent=`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}.cd-acc{animation:fadeUp .25s ease}.cd-row:hover{background:#f8f9fa!important}`;
  document.head.appendChild(s);
}

const MOCK_COURSE = {
  title:"Maîtriser l'anglais professionnel",subtitle:"Anglais des affaires · Préparation certifications · Communication internationale",
  creator:"Binnie's English Training",lastUpdate:"03/2025",language:"Français",level:"Tous niveaux",
  heroImage:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
  rating:4.9,ratingCount:1248,students:5320,duration:"18 h 30 min",lectureCount:94,
  price:"150 000 FCFA",oldPrice:"250 000 FCFA",discount:"40%",
  description:`Ce programme complet vous permettra de maîtriser l'anglais professionnel de A à Z. Que vous souhaitiez préparer une certification (TOEIC, TOEFL, IELTS), améliorer votre communication en entreprise ou partir étudier à l'étranger, cette formation est conçue pour vous.\n\nNotre méthode repose sur l'immersion progressive, la pratique intensive et un suivi personnalisé. Chaque leçon est pensée pour s'intégrer dans votre quotidien — même avec seulement 30 minutes par jour.`,
  advantages:["Accès illimité à toutes les ressources","Correction personnalisée par un coach","Certification officielle BET incluse","Sessions de conversation avec locuteurs natifs","Support 7j/7 via WhatsApp"],
  whatYouLearn:["Maîtriser la communication professionnelle en anglais","Préparer et réussir TOEIC, TOEFL ou IELTS","Rédiger des emails, rapports et présentations en anglais","Conduire des réunions et négociations internationales","Comprendre et parler l'anglais des affaires courant","Enrichir votre vocabulaire professionnel et académique","Maîtriser la grammaire anglaise sans mémorisation fastidieuse","Gagner confiance à l'oral lors d'entretiens ou conférences"],
  includes:[{icon:"🎥",label:"18h30 de vidéo à la demande"},{icon:"📝",label:"47 exercices pratiques"},{icon:"📄",label:"28 ressources téléchargeables"},{icon:"📱",label:"Accès mobile & tablette"},{icon:"∞",label:"Accès illimité à vie"},{icon:"🏆",label:"Certificat de fin de formation"},{icon:"🌐",label:"Sous-titres FR & EN"}],
  curriculum:[
    {title:"Introduction & Diagnostic",sessions:[{type:"video",title:"Bienvenue dans la formation",duration:"5:22",preview:true},{type:"quiz",title:"Test de positionnement initial",duration:""},{type:"video",title:"Comment tirer le maximum de ce cours",duration:"8:14",preview:true}]},
    {title:"Fondations de l'anglais professionnel",sessions:[{type:"video",title:"Prononciation & accent professionnel",duration:"12:30"},{type:"video",title:"Vocabulaire essentiel du monde des affaires",duration:"18:45"},{type:"quiz",title:"Exercice : Vocabulaire business",duration:""},{type:"video",title:"Construire des phrases complexes",duration:"14:20"}]},
    {title:"Communication écrite avancée",sessions:[{type:"video",title:"Rédiger un email professionnel parfait",duration:"16:10",preview:true},{type:"video",title:"Structure d'un rapport en anglais",duration:"20:05"},{type:"doc",title:"Templates : 15 modèles d'emails téléchargeables",duration:""},{type:"video",title:"Présentations PowerPoint en anglais",duration:"11:30"}]},
    {title:"Communication orale & réunions",sessions:[{type:"video",title:"Conduire une réunion en anglais",duration:"22:15"},{type:"video",title:"Techniques de négociation internationale",duration:"19:40"},{type:"quiz",title:"Mise en situation : simulation de réunion",duration:""},{type:"video",title:"Présenter des chiffres et données",duration:"14:55"}]},
    {title:"Préparation certifications TOEIC",sessions:[{type:"video",title:"Structure et stratégie du TOEIC",duration:"25:00"},{type:"video",title:"Listening Part 1 & 2 : techniques gagnantes",duration:"30:10"},{type:"quiz",title:"Test blanc TOEIC complet n°1",duration:""},{type:"video",title:"Reading et grammaire express",duration:"28:45"},{type:"quiz",title:"Test blanc TOEIC complet n°2",duration:""}]},
    {title:"Entretiens & présentation de soi",sessions:[{type:"video",title:"Se présenter en anglais avec impact",duration:"15:20",preview:true},{type:"video",title:"Répondre aux questions difficiles en entretien",duration:"18:00"},{type:"doc",title:"Guide : 50 questions d'entretien + réponses modèles",duration:""}]},
  ],
  requirements:["Niveau A2 minimum en anglais (débutant avancé)","Un ordinateur, tablette ou smartphone","30 minutes par jour de disponibilité","Motivation et persévérance 💪"],
  targetAudience:["Professionnels souhaitant évoluer dans un contexte international","Étudiants visant une certification TOEIC, TOEFL ou IELTS","Managers devant animer des équipes multinationales","Toute personne souhaitant gagner en confiance à l'oral"],
  testimonials:[
    {avatar:"👩🏾‍💼",name:"Awa Koné",role:"Responsable Marketing, NSIA",score:"TOEIC 880",rating:5,text:"Formation exceptionnelle ! Les méthodes sont vraiment efficaces. J'ai obtenu 880 au TOEIC après seulement 10 semaines de formation intensive."},
    {avatar:"👨🏿‍💻",name:"Kouamé Brou",role:"Ingénieur IT, Orange CI",score:"TOEFL 108",rating:5,text:"Le module sur la communication professionnelle a transformé ma façon de travailler. Je conduis maintenant des réunions internationales avec aisance."},
    {avatar:"👩🏽‍🎓",name:"Fatoumata Diallo",role:"Étudiante en MBA, Abidjan",score:"IELTS 7.5",rating:5,text:"Les exercices pratiques et les corrections personnalisées font vraiment la différence. Je recommande à tous ceux qui veulent progresser vite."},
    {avatar:"👨🏾‍🏫",name:"Serge Assoua",role:"DRH, Bolloré Africa Logistics",score:"Formation entreprise",rating:5,text:"Nous avons formé 15 collaborateurs avec BET. Le résultat est visible sur notre communication client internationale. Un investissement rentable."},
  ],
  faq:[
    {q:"Quelle est la durée de la formation ?",a:"La formation contient 18h30 de contenu vidéo. À raison de 30 min/jour, vous pouvez la terminer en 10 à 12 semaines. L'accès est illimité, à votre rythme."},
    {q:"Est-ce que je recevrai un certificat ?",a:"Oui ! À la fin de la formation, vous recevez un certificat officiel Binnie's English Training, reconnu par l'État de Côte d'Ivoire."},
    {q:"La formation convient-elle aux débutants complets ?",a:"Cette formation est recommandée à partir du niveau A2. Si vous êtes grand débutant, nous proposons une formation Débutant Absolu adaptée."},
    {q:"Comment fonctionne le support ?",a:"Vous avez accès à notre support 7j/7 via WhatsApp et email. Les corrections d'exercices sont faites sous 48h par votre coach personnel."},
    {q:"Y a-t-il une garantie ?",a:"Oui ! Satisfait ou remboursé sous 30 jours, sans condition ni justification."},
  ],
  relatedCourses:[
    {title:"TOEIC Express — Score 700+ garanti",price:"390 000 FCFA",img:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80",rating:4.9,students:1240},
    {title:"IELTS Academic — Band 7.0",price:"520 000 FCFA",img:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80",rating:4.8,students:870},
    {title:"Anglais à domicile — Sur mesure",price:"35 000 FCFA/h",img:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80",rating:4.7,students:2100},
  ],
  formats:[
    {name:"Découverte",price:"15 000 FCFA",duration:"/mois",details:"2 cours/sem · Accès 3 mois · Support communauté"},
    {name:"Intensif",price:"30 000 FCFA",duration:"/mois",details:"5 cours/sem · Coach personnel · Accès illimité",popular:true},
    {name:"Premium",price:"50 000 FCFA",duration:"/mois",details:"Cours illimités · Tuteur natif · Certification incluse"},
  ],
};

function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function buildHeroEmbedUrl(url) {
  if (!url) return null;
  const ytId = extractYoutubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`;
  if (/vimeo\.com\/(\d+)/.test(url)) {
    const id = url.match(/vimeo\.com\/(\d+)/)[1];
    return `https://player.vimeo.com/video/${id}?controls=1`;
  }
  return url;
}

const Stars=({rating=5,size=14})=><span style={{display:"inline-flex",gap:1}}>{Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:size,color:i<Math.floor(rating)?"#f59e0b":"#d1d5db"}}>★</span>)}</span>;

const FAQItem=({item})=>{
  const[open,setOpen]=useState(false);
  return(
    <div style={{border:`1.5px solid ${open?"#dc2626":"#e2e8f0"}`,borderRadius:10,overflow:"hidden",transition:"border-color .2s"}}>
      <button style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"15px 18px",background:"none",border:"none",fontFamily:FF,fontSize:".95rem",fontWeight:600,color:"#0f172a",cursor:"pointer",textAlign:"left",gap:12}} onClick={()=>setOpen(p=>!p)}>
        <span>{item.q}</span>
        <span style={{fontSize:"1.3rem",color:"#dc2626",transition:"transform .2s",display:"inline-block",transform:open?"rotate(45deg)":"rotate(0)"}}>+</span>
      </button>
      {open&&<p className="cd-acc" style={{padding:"0 18px 16px",fontSize:".9rem",color:"#475569",lineHeight:1.7,margin:0}}>{item.a}</p>}
    </div>
  );
};

const CourseDetail=()=>{
  const{type}=useParams(); const navigate=useNavigate();
  const[searchParams,setSearchParams]=useSearchParams();
  const initCentreKey=searchParams.get("centre");
  const rawCourse=coursesData?.[type];
  const isMounted=useRef(false);

  // Centres (cabinet mode)
  const[centresList,setCentresList]=useState([]);
  const[selectedCentreKey,setSelectedCentreKey]=useState(initCentreKey||null);
  const[sidebarAssistantes,setSidebarAssistantes]=useState([]);
  const[loadingAssistantes,setLoadingAssistantes]=useState(false);
  const[realCentresMap,setRealCentresMap]=useState({});

  // Charger la liste réelle des centres depuis l'API (même logique Navbar)
  useEffect(()=>{
    if(type!=="cabinet") return;
    const API_URL=process.env.REACT_APP_API_URL||"http://localhost:5001";
    fetch(`${API_URL}/api/parcours/centres`)
      .then(r=>r.json())
      .then(d=>{
        const map={};
        (d.centres||[]).forEach(c=>{
          const key=c.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
          map[key]=c;
        });
        setRealCentresMap(map);
      }).catch(()=>{});
  },[type]);

  // Charger les vraies assistantes dès que le centre change
  useEffect(()=>{
    if(type!=="cabinet"||!selectedCentreKey) return;
    const centre=centresList.find(c=>c.key===selectedCentreKey);
    if(!centre) return;
    setSidebarAssistantes([]);
    setLoadingAssistantes(true);
    const API_URL=process.env.REACT_APP_API_URL||"http://localhost:5001";
    const nomNorm=centre.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    let realId=null;
    for(const[k,c] of Object.entries(realCentresMap)){
      if(k.includes(nomNorm)||nomNorm.includes(k)){realId=c.id;break;}
    }
    const fallback=()=>{
      setSidebarAssistantes((centre.assistantes||[]).map(a=>({
        id:a.phone, prenom:a.nom, nom:"", telephone:a.phone, photo_url:null
      })));
      setLoadingAssistantes(false);
    };
    if(realId){
      fetch(`${API_URL}/api/parcours/assistantes-presentiel/${realId}?tous=true`)
        .then(r=>r.json())
        .then(d=>{ setSidebarAssistantes(d.assistantes||[]); setLoadingAssistantes(false); })
        .catch(fallback);
    } else { fallback(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedCentreKey,realCentresMap]);

  useEffect(()=>{
    if(type!=="cabinet") return;
    try{
      const s=localStorage.getItem(CENTRES_MASTER_KEY);
      if(s){
        const list=JSON.parse(s).filter(c=>c.actif!==false);
        setCentresList(list);
        if(!selectedCentreKey && list.length>0) setSelectedCentreKey(list[0].key);
      }
    }catch{}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[type]);

  // ── Offres dynamiques (en-ligne / domicile) ──────────────────────────────
  const [dynamicFormats, setDynamicFormats] = useState(() => {
    if (type === "en-ligne")  return offresFromLS(OFFRES_EN_LIGNE_KEY);
    if (type === "domicile")  return offresFromLS(OFFRES_DOMICILE_KEY);
    return null;
  });

  // ── Aperçu dynamique (en-ligne / domicile) ───────────────────────────────
  const [dynamicApercu, setDynamicApercu] = useState(() => apercuFromLS(type));

  const centreOverride=type==="cabinet"?loadCabinetCourse(selectedCentreKey):null;
  const selectedCentre=centresList.find(c=>c.key===selectedCentreKey)||null;
  const formatsOverride = dynamicFormats ? { formats: dynamicFormats } : {};
  const apercuOverride = dynamicApercu ? {
    ...(dynamicApercu.description  ? { description:     dynamicApercu.description }  : {}),
    ...(dynamicApercu.advantages?.length ? { advantages: dynamicApercu.advantages }  : {}),
    ...(dynamicApercu.whatYouLearn?.length ? { whatYouLearn: dynamicApercu.whatYouLearn } : {}),
    ...(dynamicApercu.includes?.length ? { includes: dynamicApercu.includes }         : {}),
    ...(dynamicApercu.requirements?.length ? { requirements: dynamicApercu.requirements } : {}),
    ...(dynamicApercu.targetAudience?.length ? { targetAudience: dynamicApercu.targetAudience } : {}),
    ...(dynamicApercu.faq?.length ? { faq: dynamicApercu.faq }                        : {}),
  } : {};
  const course=rawCourse?{...MOCK_COURSE,...rawCourse,...(centreOverride||{}),...formatsOverride,...apercuOverride}:{...MOCK_COURSE,...(centreOverride||{}),...formatsOverride,...apercuOverride};

  useEffect(() => {
    if (type !== "en-ligne" && type !== "domicile") return;
    const sbKey = type === "en-ligne" ? "offres_en_ligne" : "offres_domicile";
    const lsKey = type === "en-ligne" ? OFFRES_EN_LIGNE_KEY : OFFRES_DOMICILE_KEY;
    supabase
      .from("plateforme_config")
      .select("valeur")
      .eq("key", sbKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem(lsKey, JSON.stringify(data.valeur));
          const f = offresFromLS(lsKey);
          if (f) setDynamicFormats(f);
        }
      });
    const onStorage = (e) => {
      if (e.key === lsKey) { const f = offresFromLS(lsKey); if (f) setDynamicFormats(f); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [type]); // eslint-disable-line

  useEffect(() => {
    if (type !== "en-ligne" && type !== "domicile") return;
    // Sync depuis Supabase (dashboard sur port différent — localStorage non partagé)
    supabase.from("plateforme_config").select("valeur").eq("key","course_apercu_config").maybeSingle()
      .then(({data,error})=>{
        if(!error && data?.valeur && typeof data.valeur==="object"){
          localStorage.setItem(COURSE_APERCU_KEY, JSON.stringify(data.valeur));
          setDynamicApercu(apercuFromLS(type));
        }
      });
    const onStorage = (e) => {
      if (e.key === COURSE_APERCU_KEY) setDynamicApercu(apercuFromLS(type));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [type]); // eslint-disable-line

  // ── Média hero (configurable par type d'offre) ───────────────────────────
  const [heroMedia, setHeroMedia] = useState(null);
  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
    fetch(`${API}/api/offre-media/${type}/publiques`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.media?.length) setHeroMedia(d.media[0]); })
      .catch(() => {});
  }, [type]);

  const[activeTab,setActiveTab]=useState("apercu");
  const[openSections,setOpenSections]=useState({0:true});
  const[showAllCurr,setShowAllCurr]=useState(false);
  const[sidebarSticky,setSidebarSticky]=useState(false);
  const[modalOpen,setModalOpen]=useState(false);
  const[payMethod,setPayMethod]=useState("mobile");
  const[mobileOp,setMobileOp]=useState(null);
  const[successMsg,setSuccessMsg]=useState(false);
  const[hovCard,setHovCard]=useState(null);
  const[selectedFormat,setSelectedFormat]=useState(null);

  // ── Reset UI quand le type de cours change (pas au montage initial) ──
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    setActiveTab("apercu");
    setSelectedFormat(null);
    setModalOpen(false);
    setSuccessMsg(false);
    setHovCard(null);
    setInscForm({nom:"",email:"",tel:"",mobileNum:""});
    setInscErreur("");
    // Les données cabinet (centresList, assistantes…) sont gérées par leurs propres effects
    setDynamicFormats(
      type === "en-ligne" ? offresFromLS(OFFRES_EN_LIGNE_KEY) :
      type === "domicile" ? offresFromLS(OFFRES_DOMICILE_KEY) : null
    );
  }, [type]); // eslint-disable-line
  const[devisOpen,setDevisOpen]=useState(false);
  const[devisSuccess,setDevisSuccess]=useState(false);
  const[devisForm,setDevisForm]=useState({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});
  const[devisAuthGate,setDevisAuthGate]=useState(false);
  const[devisAuthTab,setDevisAuthTab]=useState("login");
  const[devisAuthForm,setDevisAuthForm]=useState({email:"",password:"",prenom:"",nom:"",telephone:""});
  const[devisAuthLoad,setDevisAuthLoad]=useState(false);
  const[devisAuthErr,setDevisAuthErr]=useState("");
  const[inscForm,setInscForm]=useState({nom:"",email:"",tel:"",mobileNum:""});
  const[inscErreur,setInscErreur]=useState("");
  const[inscLoading,setInscLoading]=useState(false);
  const[codePromo,setCodePromo]=useState("");
  const[codePromoApplied,setCodePromoApplied]=useState(null);
  const[codePromoLoading,setCodePromoLoading]=useState(false);
  const[codePromoError,setCodePromoError]=useState("");
  const[sbUser,setSbUser]=useState(null);
  // ── Avis ──
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
    const nom=m.full_name||(m.prenom&&m.nom?`${m.prenom} ${m.nom}`:"")||(m.first_name&&m.last_name?`${m.first_name} ${m.last_name}`:"")||"";
    setDevisForm(p=>({...p,nom:nom||p.nom,email:u.email||p.email,tel:m.telephone||m.phone||m.tel||p.tel}));
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setSbUser(session?.user||null);
      if(session?.user) prefillForm(session.user);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      setSbUser(session?.user||null);
      if(session?.user){ prefillForm(session.user); prefillDevisForm(session.user); setDevisAuthGate(false); setDevisAuthErr(""); }
    });
    return()=>subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleDevisAuthLogin=async()=>{
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    if(!devisAuthForm.email||!devisAuthForm.password) return setDevisAuthErr("Email et mot de passe requis.");
    setDevisAuthLoad(true); setDevisAuthErr("");
    try{
      const res=await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:devisAuthForm.email,password:devisAuthForm.password})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Email ou mot de passe incorrect");
      await supabase.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
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

  // ── Charger les avis live ──────────────────────────────────────────────────
  useEffect(()=>{
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    setAvisLoading(true);
    fetch(`${API}/api/avis/publics?offre_type=cours`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.avis) setAvisLive(d.avis); })
      .catch(()=>{})
      .finally(()=>setAvisLoading(false));
  },[]);

  // ── Vérifier si l'utilisateur est apprenant BET ───────────────────────────
  useEffect(()=>{
    if(!sbUser?.email) return;
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    fetch(`${API}/api/auth/prospect-info?email=${encodeURIComponent(sbUser.email)}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.is_apprenant) setIsApprenantBET(true); })
      .catch(()=>{});
  },[sbUser]);

  // ── Vérifier si l'apprenant a déjà posté un avis (cours) ─────────────────
  useEffect(()=>{
    if(!sbUser?.email||!isApprenantBET) return;
    const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session) return;
      fetch(`${API}/api/avis/publics?offre_type=cours&limit=200`)
        .then(r=>r.ok?r.json():null)
        .then(d=>{
          const already=d?.avis?.some(a=>a.apprenant_email===sbUser.email||false);
          setAvisDejaPoste(!!already);
        })
        .catch(()=>{});
    });
  },[sbUser,isApprenantBET]);

  const submitAvis=async()=>{
    if(avisForm.texte.trim().length<20) return;
    setAvisSubmitting(true); setAvisMsg(null);
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      const {data:{session}}=await supabase.auth.getSession();
      const r=await fetch(`${API}/api/avis`,{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
        body:JSON.stringify({offre_type:"cours",note:avisForm.note,texte:avisForm.texte.trim()}),
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error);
      setAvisMsg({type:"ok",text:d.message});
      setAvisDejaPoste(true);
      // Rafraîchir la liste
      fetch(`${API}/api/avis/publics?offre_type=cours`)
        .then(res=>res.ok?res.json():null)
        .then(d=>{ if(d?.avis) setAvisLive(d.avis); });
      setTimeout(()=>setAvisModalOpen(false),2000);
    }catch(err){ setAvisMsg({type:"err",text:err.message}); }
    finally{ setAvisSubmitting(false); }
  };

  // Détecte le retour après login (Google OAuth ou autre) et rouvre la modal paiement
  useEffect(()=>{
    if(searchParams.get("openPayment")!=="1") return;
    const raw=sessionStorage.getItem("bet_return_context");
    if(raw){try{const ctx=JSON.parse(raw);if(ctx.selectedFormat)setSelectedFormat(ctx.selectedFormat);sessionStorage.removeItem("bet_return_context");}catch{}}
    setModalOpen(true);
    setSearchParams(p=>{p.delete("openPayment");return p;},{replace:true});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    const h=()=>setSidebarSticky(window.scrollY>(heroRef.current?.offsetHeight||500)-80);
    window.addEventListener("scroll",h); return()=>window.removeEventListener("scroll",h);
  },[]);

  // Styles responsives injectés
  useEffect(() => {
    if (!document.querySelector("#cd-responsive")) {
      const style = document.createElement("style");
      style.id = "cd-responsive";
      style.textContent = `
        .course-detail-root { overflow-x: hidden; max-width: 100%; }
        @media (max-width: 900px) {
          .course-detail-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .course-detail-sidebar { position: relative !important; top: 0 !important; width: 100% !important; margin-top: 20px; }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .course-detail-formats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .course-detail-learn-grid, .course-detail-includes-grid { grid-template-columns: 1fr !important; }
          .course-detail-formats-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .course-detail-related-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .course-detail-hero-inner { padding: 0 16px !important; }
          .course-detail-hero-title { font-size: 1.8rem !important; }
          .course-detail-tabs-inner { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .course-detail-tab-btn { padding: 10px 14px !important; font-size: 0.8rem !important; }
          .course-detail-curr-meta { flex-wrap: wrap; gap: 8px; }
        }
        @media (max-width: 640px) {
          .course-detail-hero-title { font-size: 1.5rem !important; }
          .course-detail-side-card .price-row { flex-wrap: wrap; justify-content: center; }
          .course-detail-curr-head { flex-wrap: wrap; gap: 8px; }
        }
        .course-detail-side-card .timer-badge { word-break: break-word; white-space: normal; line-height: 1.4; }
        @media (max-width: 480px) {
          .course-detail-btn-enroll, .course-detail-btn-quote { width: calc(100% - 24px) !important; margin-left: 12px !important; margin-right: 12px !important; font-size: 0.85rem !important; }
          .course-detail-share-buttons { flex-direction: column; gap: 8px !important; }
          .course-detail-lesson-row { flex-wrap: wrap; gap: 8px; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const TABS=[{id:"apercu",label:"Aperçu"},
    // {id:"contenu",label:"Contenu du cours"},
    {id:"formules",label:"Formules & Tarifs"},
    {id:"avis",label:`Avis (${avisLive.length||course.testimonials?.length||0})`},
    {id:"faq",label:"FAQ"}];
  const toggleSection=i=>setOpenSections(p=>({...p,[i]:!p[i]}));
  const totalSessions=course.curriculum?.reduce((a,s)=>a+s.sessions.length,0)||0;
  const visibleCurr=showAllCurr?course.curriculum:course.curriculum?.slice(0,4);
  const validerCodePromo=async()=>{
    const code=codePromo.trim().toUpperCase();
    if(!code)return;
    setCodePromoLoading(true);setCodePromoError("");setCodePromoApplied(null);
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      const token=localStorage.getItem("bet_token")||"";
      const r=await fetch(`${API}/api/codes-promo/valider`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({code,offre_type:"en_ligne"})});
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
        offre_titre:selectedFormat ? `${course.title} — ${selectedFormat.name} (${selectedFormat.price})` : course.title,
        mode_paiement:payMethod==="mobile"?`Mobile Money ${mobileOp||""} — ${inscForm.mobileNum}`:"Carte bancaire",
        statut:"en_attente",
        code_promo:codePromoApplied?.code||undefined,
      });
      setSuccessMsg(true);
      setTimeout(()=>{setSuccessMsg(false);setModalOpen(false);setInscForm({nom:"",email:"",tel:"",mobileNum:""});setCodePromo("");setCodePromoApplied(null);setCodePromoError("");},3000);
    }catch(e){
      setInscErreur("Une erreur est survenue. Veuillez réessayer.");
    }finally{
      setInscLoading(false);
    }
  };
  const sendYTCmd=(func,args=[])=>{
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args}),"*");
  };
  const handleMute=()=>{ sendYTCmd(isMuted?"unMute":"mute"); setIsMuted(m=>!m); };
  const handleReplay=()=>{ sendYTCmd("seekTo",[0,true]); sendYTCmd("playVideo"); };

  const handleDevis=async()=>{
    try{
      const API=process.env.REACT_APP_API_URL||"http://localhost:5001";
      await insertDemandeDevis({nom:devisForm.nom,email:devisForm.email,tel:devisForm.tel,entreprise:devisForm.entreprise||null,participants:devisForm.participants,message:devisForm.message||null,source:"cours",source_nom:course.title});
      // Auto-assignation à l'assistante corporate dédiée (B2B)
      try{
        const ar=await fetch(`${API}/api/parcours/assistantes-ligne?profil=b2b`);
        const ad=await ar.json();
        const ca=(ad.assistantes||[])[0]||null;
        if(ca){
          await fetch(`${API}/api/parcours/assignation`,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({assistante_id:ca.id,prospect_nom:devisForm.nom,prospect_email:devisForm.email||undefined,prospect_telephone:devisForm.tel||undefined,type_cours:"en_ligne",source:"devis_cours"}),
          });
        }
      }catch{/* silent */}
      setDevisSuccess(true);
      setTimeout(()=>{setDevisSuccess(false);setDevisOpen(false);setDevisForm({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});},3000);
    }catch(err){console.error("Erreur devis:",err);}
  };

  return(
    <div className="course-detail-root" style={S.page}>
      {/* HERO */}
      <div ref={heroRef} style={heroMedia ? {
        position:"relative", overflow:"hidden",
        height: heroMedia.type==="video" ? "clamp(500px, 56.25vw, 620px)" : 480,
        background:"#07111f",
      } : S.hero}>

        {/* ── Fond media plein écran ── */}
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

        {/* Gradient cinématique : transparent haut → sombre bas */}
        {heroMedia && (
          <div style={{
            position:"absolute", inset:0, zIndex:2, pointerEvents:"none",
            background: heroMedia.type==="video"
              ? "linear-gradient(to bottom, rgba(7,17,31,0) 20%, rgba(7,17,31,.45) 58%, rgba(7,17,31,.96) 100%)"
              : "linear-gradient(135deg, rgba(7,17,31,.86) 0%, rgba(7,17,31,.48) 100%)",
          }}/>
        )}

        {/* Breadcrumb flottant en haut */}
        {heroMedia && (
          <div style={{position:"absolute",top:22,left:0,right:0,zIndex:4,maxWidth:1180,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"center",gap:6,fontSize:".76rem"}}>
            <span onClick={()=>navigate("/")} style={{color:"rgba(255,255,255,.5)",cursor:"pointer",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}>Accueil</span>
            <span style={{color:"rgba(255,255,255,.2)"}}>›</span>
            <span onClick={()=>navigate(-1)} style={{color:"rgba(255,255,255,.5)",cursor:"pointer",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.5)"}>Cours</span>
            <span style={{color:"rgba(255,255,255,.2)"}}>›</span>
            <span style={{color:"rgba(255,255,255,.7)",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{heroMedia?.titre||course.title}</span>
          </div>
        )}

        {/* Zone titre ancrée en bas */}
        {heroMedia ? (
          <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:3,padding:"0 0 36px"}}>
            <div style={{maxWidth:1180,margin:"0 auto",padding:"0 32px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
              {/* Colonne gauche : badge + titre */}
              <div style={{flex:1,minWidth:0}}>
                {/* Badge type d'offre */}
                <div style={{marginBottom:12}}>
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:6,
                    background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",
                    border:"1px solid rgba(255,255,255,.18)",
                    color:"rgba(255,255,255,.9)",borderRadius:100,
                    padding:"5px 16px",fontSize:".7rem",fontWeight:700,
                    letterSpacing:".1em",textTransform:"uppercase",
                  }}>
                    {type==="en-ligne"?"📱 En ligne":type==="domicile"?"🏠 À domicile":type==="cabinet"?"🏫 En cabinet":"📚 Formation"}
                  </span>
                </div>
                {/* Accent + Titre */}
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:4,minHeight:52,borderRadius:4,background:"linear-gradient(to bottom,#3b82f6,#1e40af)",flexShrink:0,marginTop:4}}/>
                  <div>
                    <h1 className="course-detail-hero-title" style={{
                      fontFamily:FD,fontSize:"clamp(1.7rem,4vw,3rem)",
                      color:"#fff",margin:"0 0 8px",fontWeight:800,
                      lineHeight:1.1,textShadow:"0 2px 28px rgba(0,0,0,.55)",
                    }}>
                      {type==="cabinet"&&selectedCentre ? selectedCentre.name : (heroMedia?.titre||course.title)}
                    </h1>
                    {type==="cabinet"&&selectedCentre&&(
                      <p style={{color:"rgba(255,255,255,.65)",fontSize:".95rem",margin:0,lineHeight:1.5}}>
                        {selectedCentre.subtitle||`Cours en cabinet · ${selectedCentre.ville}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Colonne droite : boutons vidéo */}
              {heroMedia.type==="video"&&(
                <div style={{display:"flex",gap:8,flexShrink:0,paddingBottom:4}}>
                  <button onClick={handleReplay} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.12)",backdropFilter:"blur(10px)",border:"1.5px solid rgba(255,255,255,.25)",color:"#fff",borderRadius:100,padding:"8px 18px",fontSize:".78rem",fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>
                    ↺ Rejouer
                  </button>
                  <button onClick={handleMute} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.12)",backdropFilter:"blur(10px)",border:"1.5px solid rgba(255,255,255,.25)",color:"#fff",borderRadius:100,padding:"8px 18px",fontSize:".78rem",fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>
                    {isMuted?"🔊 Son":"🔇 Muet"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Layout original sans media */
          <div className="course-detail-hero-inner" style={{...S.heroInner,position:"relative",zIndex:3}}>
            <div style={S.heroMain}>
              <div style={S.breadcrumb}>
                <span style={S.bLink} onClick={()=>navigate("/")}>Accueil</span><span style={S.bSep}>/</span>
                <span style={S.bLink} onClick={()=>navigate(-1)}>Cours</span><span style={S.bSep}>/</span>
                <span style={{color:"#e2e8f0"}}>{course.title}</span>
              </div>
              <h1 className="course-detail-hero-title" style={S.heroTitle}>
                {type==="cabinet"&&selectedCentre ? selectedCentre.name : course.title}
              </h1>
              {type==="cabinet"&&selectedCentre&&(
                <p style={S.heroSub}>{selectedCentre.subtitle||`Cours en cabinet · ${selectedCentre.ville}`}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SÉLECTEUR DE CENTRE (type cabinet uniquement) */}
      {type==="cabinet"&&centresList.length>0&&(
        <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"14px 0"}}>
          <div style={{maxWidth:1180,margin:"0 auto",padding:"0 24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:700,color:"#475569",whiteSpace:"nowrap",flexShrink:0}}>📍 Choisissez votre centre :</span>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {centresList.map(c=>(
                  <button key={c.key} onClick={()=>setSelectedCentreKey(c.key)}
                    style={{
                      padding:"7px 16px",borderRadius:999,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",
                      border:`2px solid ${selectedCentreKey===c.key?c.color:"#e2e8f0"}`,
                      background:selectedCentreKey===c.key?c.color+"22":"#f8fafc",
                      color:selectedCentreKey===c.key?"#0f172a":"#64748b",
                      boxShadow:selectedCentreKey===c.key?`0 0 0 3px ${c.color}33`:"none",
                    }}
                  >
                    <span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:c.color,marginRight:6,verticalAlign:"middle"}}/>
                    {c.name}
                    {c.ville&&c.ville!=="Abidjan"&&<span style={{fontSize:11,fontWeight:500,color:"#94a3b8",marginLeft:4}}>({c.ville})</span>}
                  </button>
                ))}
              </div>
            </div>
            {selectedCentre&&(
              <div style={{marginTop:10,display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#64748b"}}>
                {selectedCentre.addr&&<span>📌 {selectedCentre.addr}</span>}
                {selectedCentre.horaires&&<span>🕐 {selectedCentre.horaires}</span>}
                {selectedCentre.telephone&&<a href={`tel:${selectedCentre.telephone}`} style={{color:"#0891b2",textDecoration:"none",fontWeight:600}}>📞 {selectedCentre.telephone}</a>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{...S.tabsBar,...(sidebarSticky?S.tabsSticky:{})}}>
        <div className="course-detail-tabs-inner" style={S.tabsInner}>
          {TABS.map(t=><button key={t.id} className="course-detail-tab-btn" style={{...S.tabBtn,...(activeTab===t.id?S.tabActive:{})}} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      {/* LAYOUT */}
      <div className="course-detail-layout" style={S.layout}>
        <div style={S.contentCol}>
          {/* Aperçu */}
          {activeTab==="apercu"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce que vous apprendrez</h2>
                <div className="course-detail-learn-grid" style={S.learnGrid}>{course.whatYouLearn?.map((item,i)=><div key={i} style={S.learnItem}><span style={S.learnCheck}>✓</span><span style={S.learnTxt}>{item}</span></div>)}</div>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce cours comprend :</h2>
                <div className="course-detail-includes-grid" style={S.includesGrid}>{course.includes?.map((inc,i)=><div key={i} style={S.includeItem}><span style={{fontSize:"1.1rem",width:24,textAlign:"center",flexShrink:0}}>{inc.icon}</span><span style={{fontSize:".88rem",color:"#475569"}}>{inc.label}</span></div>)}</div>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Prérequis</h2>
                <ul style={S.plainList}>{course.requirements?.map((r,i)=><li key={i} style={S.plainLi}>• {r}</li>)}</ul>
              </section>
              <section style={S.section}>
                <h2 style={S.sH2}>Description</h2>
                {course.description?.split("\n\n").map((p,i)=><p key={i} style={S.descP}>{p}</p>)}
              </section>
              {course.advantages&&(
                <section style={S.section}>
                  <h2 style={S.sH2}>Avantages exclusifs BET</h2>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>{course.advantages.map((a,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,fontSize:".92rem",color:"#334155"}}><div style={S.advDot}>✓</div><span>{a}</span></div>)}</div>
                </section>
              )}
              <section style={S.section}>
                <h2 style={S.sH2}>À qui s'adresse cette formation ?</h2>
                <ul style={S.plainList}>{course.targetAudience?.map((t,i)=><li key={i} style={S.plainLi}>• {t}</li>)}</ul>
              </section>
            </div>
          )}

          {/* Contenu */}
          {/* {activeTab==="contenu"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Contenu du cours</h2>
                <p className="course-detail-curr-meta" style={S.currMeta}>{course.curriculum?.length} sections · {totalSessions} leçons · {course.duration} au total
                  <button style={S.expandBtn} onClick={()=>setOpenSections(course.curriculum?.reduce((a,_,i)=>({...a,[i]:true}),{}))}>Tout développer</button>
                </p>
                <div style={S.currList}>
                  {visibleCurr?.map((sec,si)=>(
                    <div key={si} style={{borderBottom:"1px solid #e2e8f0"}}>
                      <button className="course-detail-curr-head" style={S.currHead} onClick={()=>toggleSection(si)}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:".85rem",display:"inline-block",transform:openSections[si]?"rotate(90deg)":"rotate(0)",transition:"transform .2s"}}>›</span>
                          <span style={{fontSize:".92rem",fontWeight:700,color:"#0f172a"}}>{sec.title}</span>
                        </div>
                        <span style={{fontSize:".78rem",color:"#64748b",whiteSpace:"nowrap",flexShrink:0}}>{sec.sessions.length} leçons</span>
                      </button>
                      {openSections[si]&&(
                        <div className="cd-acc">{sec.sessions.map((les,li)=>(
                          <div key={li} className="cd-row course-detail-lesson-row" style={S.lessonRow}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{color:"#1e3a8a",fontSize:".9rem",width:18,textAlign:"center"}}>{les.type==="video"?"▷":les.type==="quiz"?"◇":"📄"}</span>
                              <span style={{fontSize:".86rem",color:"#334155"}}>{les.title}</span>
                              {les.preview&&<span style={S.previewBadge}>Aperçu gratuit</span>}
                            </div>
                            <span style={{fontSize:".78rem",color:"#94a3b8",flexShrink:0}}>{les.duration}</span>
                          </div>
                        ))}</div>
                      )}
                    </div>
                  ))}
                </div>
                {!showAllCurr&&course.curriculum?.length>4&&<button style={S.showMoreBtn} onClick={()=>setShowAllCurr(true)}>Voir {course.curriculum.length-4} sections supplémentaires ↓</button>}
              </section>
            </div>
          )} */}

          {/* Formules */}
          {activeTab==="formules"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={{...S.section,paddingTop:16}}>
                <h2 style={S.sH2}>Choisissez votre formule</h2>
                <p style={S.currMeta}>Sans engagement · Changez ou annulez à tout moment</p>
                <PromosBanner
                  offreType={type==="en-ligne"?"en_ligne":type==="domicile"?"domicile":"centres"}
                  accentColor="#dc2626"
                  onApply={(code)=>{setCodePromo(code);setCodePromoApplied(null);setCodePromoError("");setModalOpen(true);}}
                />
                <div className="course-detail-formats-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20,marginBottom:28}}>
                  {course.formats?.map((f,i)=>{
                    const isEntreprise=/entreprise/i.test(f.name||"");
                    const isSelected = selectedFormat?.name===f.name && !isEntreprise;
                    return(
                    <div key={i}
                      onClick={()=>{ if(isEntreprise){navigate("/parcours/entreprise");}else{setSelectedFormat(f);} }}
                      style={{...S.formatCard,cursor:isEntreprise?"default":"pointer",...(isSelected?{borderColor:"#dc2626",background:"#fef2f2",boxShadow:"0 0 0 3px #dc262622"}:f.popular?{borderColor:"#dc2626",background:"#fef2f2"}:{}),...(isEntreprise?{borderColor:"#1e3a8a",background:"#f0f4ff"}:{}),...(hovCard===i&&!isSelected?{transform:"translateY(-5px)",boxShadow:"0 16px 40px rgba(0,0,0,.1)"}:{})}}
                      onMouseEnter={()=>setHovCard(i)} onMouseLeave={()=>setHovCard(null)}>
                      {isSelected&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#dc2626",color:"#fff",borderRadius:999,padding:"3px 14px",fontSize:".68rem",fontWeight:800,whiteSpace:"nowrap"}}>✓ Sélectionnée</div>}
                      {!isSelected&&f.popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#dc2626",color:"#fff",borderRadius:999,padding:"3px 14px",fontSize:".68rem",fontWeight:800,whiteSpace:"nowrap"}}>⭐ Le plus choisi</div>}
                      {isEntreprise&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#1e3a8a",color:"#fff",borderRadius:999,padding:"3px 14px",fontSize:".68rem",fontWeight:800,whiteSpace:"nowrap"}}>🏢 Entreprises</div>}
                      <h3 style={{fontFamily:FD,fontSize:"1.2rem",margin:"0 0 10px",fontWeight:400}}>{f.name}</h3>
                      <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:10}}>
                        <span style={{fontFamily:FD,fontSize:"1.6rem",color:"#0f172a"}}>{f.price}</span>
                        <span style={{fontSize:".82rem",color:"#64748b"}}>{f.duration?" · "+f.duration:""}</span>
                      </div>
                      <p style={{fontSize:".82rem",color:"#64748b",marginBottom:f.brochure_url?10:0,lineHeight:1.5}}>{f.details}</p>
                      {f.brochure_url && (
                        <a href={f.brochure_url} download={f.brochure_nom || true} target="_blank" rel="noopener noreferrer"
                          onClick={e=>e.stopPropagation()}
                          style={{display:"flex",alignItems:"center",gap:6,background:"#eff6ff",border:"1.5px solid #bae6fd",borderRadius:8,padding:"8px 12px",marginTop:10,textDecoration:"none"}}>
                          <span>📄</span>
                          <span style={{fontSize:".82rem",fontWeight:700,color:"#0891b2",flex:1}}>{f.brochure_nom || "Télécharger la brochure"}</span>
                          <span style={{fontSize:".72rem",fontWeight:700,color:"#94a3b8",background:"#f1f5f9",borderRadius:4,padding:"2px 7px"}}>PDF</span>
                        </a>
                      )}
                    </div>
                    );
                  })}
                </div>
                <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"flex-start",gap:16,color:"#166534"}}>
                  <span style={{fontSize:"1.5rem"}}>🛡️</span>
                  <div><strong style={{display:"block",marginBottom:4}}>Garantie satisfait ou remboursé 30 jours</strong><span style={{fontSize:".88rem",color:"#64748b"}}>Aucun risque. Si vous n'êtes pas satisfait dans les 30 jours, nous vous remboursons intégralement, sans condition.</span></div>
                </div>
              </section>

          
          
              {type==="en-ligne"&&!selectedFormat&&(
                <div style={{position:"sticky",bottom:0,background:"#fafafa",borderTop:"1.5px solid #e2e8f0",padding:"12px 20px",textAlign:"center",color:"#94a3b8",fontSize:".82rem",zIndex:40}}>
                  ☝️ Cliquez sur une formule ci-dessus pour la sélectionner
                </div>
              )}
            </div>
          )}

          {/* Avis */}
          {activeTab==="avis"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24}}>
                  <h2 style={{...S.sH2,margin:0}}>Avis des apprenants</h2>
                  {isApprenantBET && !avisDejaPoste && (
                    <button onClick={()=>{setAvisForm({note:5,texte:""});setAvisMsg(null);setAvisModalOpen(true);}}
                      style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:999,padding:"10px 22px",fontWeight:800,fontSize:".85rem",cursor:"pointer",boxShadow:"0 4px 14px rgba(220,38,38,.25)"}}>
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

                {/* Barre de note globale */}
                {avisLive.length > 0 && (()=>{
                  const avg=(avisLive.reduce((s,a)=>s+a.note,0)/avisLive.length).toFixed(1);
                  const dist=[5,4,3,2,1].map(n=>({n,count:avisLive.filter(a=>a.note===n).length}));
                  return(
                    <div style={{display:"flex",gap:32,alignItems:"center",background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:24,marginBottom:28,flexWrap:"wrap"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90}}>
                        <div style={{fontSize:"3rem",fontWeight:900,color:"#0f172a",lineHeight:1}}>{avg}</div>
                        <Stars rating={Number(avg)} size={20}/>
                        <div style={{fontSize:".76rem",color:"#64748b",fontWeight:600}}>{avisLive.length} avis</div>
                      </div>
                      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                        {dist.map(({n,count})=>{
                          const pct=Math.round((count/avisLive.length)*100);
                          return(
                            <div key={n} style={{display:"flex",alignItems:"center",gap:10}}>
                              <Stars rating={n} size={11}/>
                              <div style={{flex:1,height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}>
                                <div style={{width:`${pct}%`,height:"100%",background:"#f59e0b",borderRadius:4}}/>
                              </div>
                              <span style={{fontSize:".75rem",color:"#64748b",width:30,textAlign:"right"}}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Liste avis */}
                {avisLoading && <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Chargement des avis…</div>}
                {!avisLoading && avisLive.length===0 && (
                  <div style={{textAlign:"center",padding:"48px 24px",background:"#f8fafc",borderRadius:12,border:"1.5px dashed #e2e8f0"}}>
                    <div style={{fontSize:"2.5rem",marginBottom:12}}>💬</div>
                    <p style={{color:"#64748b",fontSize:".9rem",margin:0}}>Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {avisLive.map((a)=>(
                    <div key={a.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",fontWeight:800,color:"#fff",flexShrink:0}}>
                          {(a.apprenant_nom||"?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:800,fontSize:".88rem",color:"#0f172a"}}>{a.apprenant_nom||"Apprenant BET"}</div>
                          <div style={{fontSize:".73rem",color:"#64748b"}}>{new Date(a.created_at).toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"})}</div>
                        </div>
                        <div style={{marginLeft:"auto"}}><Stars rating={a.note} size={14}/></div>
                      </div>
                      <p style={{fontSize:".9rem",color:"#475569",lineHeight:1.65,margin:0,fontStyle:"italic"}}>"{a.texte}"</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Modal avis */}
          {avisModalOpen && (
            <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setAvisModalOpen(false)}>
              <div style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                  <h3 style={{margin:0,fontSize:"1.1rem",fontWeight:800,color:"#0f172a"}}>✍️ Mon avis sur ce cours</h3>
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
                  rows={4} placeholder="Partagez votre expérience avec ce cours : les points forts, ce que vous avez appris, à qui vous le recommanderiez…"
                  style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:".88rem",resize:"vertical",boxSizing:"border-box",outline:"none",fontFamily:"inherit",lineHeight:1.6}}
                  onFocus={e=>e.target.style.borderColor="#dc2626"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                {avisMsg && (
                  <div style={{background:avisMsg.type==="ok"?"#d1fae5":"#fee2e2",color:avisMsg.type==="ok"?"#065f46":"#dc2626",borderRadius:8,padding:"10px 14px",fontSize:".82rem",marginTop:12}}>
                    {avisMsg.type==="ok"?"✅":"❌"} {avisMsg.text}
                  </div>
                )}
                <button onClick={submitAvis} disabled={avisSubmitting||avisForm.texte.trim().length<20}
                  style={{width:"100%",marginTop:18,padding:"13px",background:avisForm.texte.trim().length<20?"#e2e8f0":"#dc2626",color:avisForm.texte.trim().length<20?"#94a3b8":"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:".95rem",cursor:avisForm.texte.trim().length<20?"not-allowed":"pointer",transition:"background .2s"}}>
                  {avisSubmitting?"Envoi en cours…":"Publier mon avis →"}
                </button>
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab==="faq"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Questions fréquentes</h2>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>{course.faq?.map((item,i)=><FAQItem key={i} item={item}/>)}</div>
              </section>
            </div>
          )}

          {/* Cours associés */}
          <section style={{...S.section,borderTop:"1px solid #f1f5f9",paddingTop:40}}>
            <h2 style={S.sH2}>Les participants ont également consulté</h2>
            <div className="course-detail-related-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
              {MOCK_COURSE.relatedCourses.map((rc,i)=>(
                <div key={i} style={{borderRadius:12,overflow:"hidden",border:"1px solid #e2e8f0",cursor:"pointer",transition:"all .25s",boxShadow:hovCard===`r${i}`?"0 12px 32px rgba(0,0,0,.12)":"0 2px 8px rgba(0,0,0,.06)",transform:hovCard===`r${i}`?"translateY(-4px)":"none"}} onMouseEnter={()=>setHovCard(`r${i}`)} onMouseLeave={()=>setHovCard(null)}>
                  <img src={rc.img} alt={rc.title} style={{width:"100%",height:130,objectFit:"cover"}}/>
                  <div style={{padding:"12px 14px"}}>
                    <h4 style={{fontWeight:700,fontSize:".88rem",margin:"0 0 6px",color:"#0f172a",lineHeight:1.4}}>{rc.title}</h4>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><Stars rating={rc.rating} size={11}/><span style={{fontSize:".76rem",color:"#64748b"}}>{rc.students?.toLocaleString()} étudiants</span></div>
                    <div style={{fontWeight:800,fontSize:".9rem",color:"#0f172a"}}>{rc.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="course-detail-sidebar" style={{...S.sidebar,...(sidebarSticky?{top:80}:{})}}>

          {/* ── SIDEBAR CABINET (centre physique) ── */}
          {type==="cabinet"&&selectedCentre?(()=>{
            const offresActives=(selectedCentre.offres||[]).filter(o=>o.actif!==false);
            const prixDepart=offresActives[0]?.prix;
            return(
              <div className="course-detail-side-card" style={S.sideCard}>

                {/* Header centre coloré */}
                <div style={{padding:"16px 18px",background:`linear-gradient(135deg,${selectedCentre.color}18,${selectedCentre.color}08)`,borderBottom:`3px solid ${selectedCentre.color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:38,height:38,borderRadius:10,background:selectedCentre.color+"33",border:`2px solid ${selectedCentre.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📍</div>
                    <div>
                      <div style={{fontWeight:800,fontSize:".95rem",color:"#0f172a"}}>{selectedCentre.name}</div>
                      <div style={{fontSize:".76rem",color:"#64748b"}}>{selectedCentre.addr||selectedCentre.ville}</div>
                    </div>
                  </div>
                </div>

                {/* Offre sélectionnée ou prix de départ */}
                {selectedFormat ? (
                  <div style={{padding:"14px 18px",borderBottom:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:".08em",marginBottom:6}}>FORMULE SÉLECTIONNÉE</div>
                    <div style={{fontWeight:800,fontSize:".95rem",color:"#0f172a",marginBottom:4}}>{selectedFormat.name}</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>
                      <span style={{fontFamily:FD,fontSize:"1.7rem",color:"#dc2626"}}>{selectedFormat.price}</span>
                      {selectedFormat.duration&&<span style={{fontSize:".8rem",color:"#64748b"}}>· {selectedFormat.duration}</span>}
                    </div>
                    {selectedFormat.details&&<div style={{fontSize:".78rem",color:"#64748b",lineHeight:1.5}}>{selectedFormat.details}</div>}
                  </div>
                ) : prixDepart ? (
                  <div style={{padding:"14px 18px 4px"}}>
                    <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:".08em",marginBottom:2}}>À PARTIR DE</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                      <span style={{fontFamily:FD,fontSize:"1.9rem",color:"#0f172a",fontWeight:400}}>{prixDepart}</span>
                      {offresActives[0]?.duration&&<span style={{fontSize:".82rem",color:"#64748b"}}>/ {offresActives[0].duration}</span>}
                    </div>
                    <div style={{fontSize:".76rem",color:"#94a3b8",marginTop:4}}>← Sélectionnez une formule dans l'onglet "Formules & Tarifs"</div>
                  </div>
                ) : null}

                {/* Bouton S'inscrire */}
                <div style={{padding:"12px 18px 4px"}}>
                  <button className="course-detail-btn-enroll"
                    style={{...S.btnEnroll,opacity:selectedFormat?1:.55,pointerEvents:selectedFormat?"auto":"none"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"}
                    onMouseLeave={e=>e.currentTarget.style.background="#dc2626"}
                    onClick={()=>selectedFormat&&setModalOpen(true)}>
                    {selectedFormat?`✍️ S'inscrire — ${selectedFormat.price}`:"Choisissez d'abord une formule"}
                  </button>
                </div>

                {/* WhatsApp assistantes — style Navbar */}
                <div style={{padding:"14px 18px",borderTop:"1px solid #f1f5f9"}}>
                  <p style={{fontWeight:700,fontSize:".82rem",color:"#0f172a",margin:"0 0 10px"}}>
                    💬 Parler à une assistante
                  </p>
                  {loadingAssistantes?(
                    <div style={{textAlign:"center",padding:"16px 0",color:"#64748b",fontSize:".82rem"}}>
                      <div style={{width:24,height:24,border:"3px solid #e2e8f0",borderTopColor:"#25d366",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 8px"}}/>
                      Chargement…
                    </div>
                  ):sidebarAssistantes.length===0?(
                    <p style={{fontSize:".78rem",color:"#94a3b8",textAlign:"center",margin:0}}>
                      😔 Aucune assistante disponible pour ce centre.
                    </p>
                  ):(
                    sidebarAssistantes.map((a,i)=>{
                      const phoneRaw=(a.telephone||"").replace(/[\s+\-()]/g,"");
                      const waMsg=encodeURIComponent(`Bonjour ${a.prenom||""}${a.nom?" "+a.nom:""}, je souhaite avoir des informations sur les cours d'anglais chez ${selectedCentre.name}.`);
                      const ini=`${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase()||"A";
                      return(
                        <a key={a.id||i}
                          href={phoneRaw?`https://wa.me/${phoneRaw}?text=${waMsg}`:"#"}
                          target={phoneRaw?"_blank":undefined} rel="noopener noreferrer"
                          style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:12,textDecoration:"none",marginBottom:8,transition:"background .15s",...(!phoneRaw?{opacity:.5,pointerEvents:"none"}:{})}}
                          onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                          onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>
                          {/* Avatar */}
                          {a.photo_url
                            ?<img src={a.photo_url} alt={a.prenom} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                            :<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#0891b2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:".88rem",flexShrink:0}}>{ini}</div>
                          }
                          {/* Infos */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:".84rem",color:"#0f172a"}}>{a.prenom} {a.nom}</div>
                            <div style={{fontSize:".72rem",color:"#64748b",marginTop:1}}>{a.telephone||<em style={{color:"#94a3b8"}}>Non renseigné</em>}</div>
                          </div>
                          {/* Icône WhatsApp SVG */}
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
                            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                              <circle cx="16" cy="16" r="16" fill="#25d366"/>
                              <path d="M23.5 19.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4-.1-.5-.1-.2-.7-1.8-1-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2 .9 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/>
                            </svg>
                            <span style={{fontSize:".62rem",color:"#22c55e",fontWeight:700}}>WhatsApp</span>
                          </div>
                        </a>
                      );
                    })
                  )}
                  {selectedCentre&&sidebarAssistantes.length>0&&(
                    <p style={{fontSize:".68rem",color:"#94a3b8",margin:"8px 0 0",fontStyle:"italic",lineHeight:1.4}}>
                      💬 Message pré-rempli : « Bonjour, je souhaite avoir des informations sur les cours d'anglais chez {selectedCentre.name}. »
                    </p>
                  )}
                </div>

                {/* Brochure PDF */}
                {selectedCentre.brochure_url&&(
                  <div style={{padding:"10px 18px",borderTop:"1px solid #f1f5f9"}}>
                    <a href={selectedCentre.brochure_url} target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,textDecoration:"none",color:"#0f172a",transition:"border-color .2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#0891b2"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
                      <span style={{fontSize:"1.2rem"}}>📄</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:".82rem"}}>Télécharger la brochure</div>
                        <div style={{fontSize:".72rem",color:"#64748b"}}>{selectedCentre.brochure_nom||"brochure.pdf"}</div>
                      </div>
                      <span style={{color:"#0891b2",fontSize:".8rem",fontWeight:700}}>↓</span>
                    </a>
                  </div>
                )}

                {/* Infos pratiques */}
                <div style={{padding:"12px 18px",borderTop:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:8}}>
                  {selectedCentre.horaires&&<div style={{display:"flex",gap:8,fontSize:".8rem",color:"#475569",alignItems:"flex-start"}}><span style={{flexShrink:0}}>🕐</span><span>{selectedCentre.horaires}</span></div>}
                  {selectedCentre.telephone&&<a href={`tel:${selectedCentre.telephone}`} style={{display:"flex",gap:8,fontSize:".8rem",color:"#0891b2",fontWeight:700,textDecoration:"none",alignItems:"center"}}><span>📞</span><span>{selectedCentre.telephone}</span></a>}
                  {selectedCentre.email&&<a href={`mailto:${selectedCentre.email}`} style={{display:"flex",gap:8,fontSize:".8rem",color:"#0891b2",textDecoration:"none",alignItems:"center"}}><span>✉️</span><span>{selectedCentre.email}</span></a>}
                  {selectedCentre.maps_url&&<a href={selectedCentre.maps_url} target="_blank" rel="noreferrer" style={{display:"flex",gap:8,fontSize:".8rem",color:"#0891b2",fontWeight:700,textDecoration:"none",alignItems:"center"}}><span>🗺️</span><span>Voir sur Google Maps</span></a>}
                </div>

                <div className="course-detail-share-buttons" style={{padding:"12px 18px",display:"flex",gap:8,borderTop:"1px solid #f1f5f9"}}>
                  {["🔗 Partager","🔖 Sauver"].map((l,i)=><button key={i} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 4px",fontSize:".72rem",fontWeight:600,cursor:"pointer",color:"#475569"}}>{l}</button>)}
                </div>
              </div>
            );
          })():(

          /* ── SIDEBAR GÉNÉRIQUE (cours en ligne, domicile, etc.) ── */
          <div className="course-detail-side-card" style={S.sideCard}>
            {selectedFormat ? (
              <div style={{padding:"14px 18px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:".08em",marginBottom:6}}>FORMULE SÉLECTIONNÉE</div>
                <div style={{fontWeight:800,fontSize:".95rem",color:"#0f172a",marginBottom:4}}>{selectedFormat.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>
                  <span style={{fontFamily:FD,fontSize:"1.7rem",color:"#dc2626"}}>{selectedFormat.price}</span>
                  {selectedFormat.duration&&<span style={{fontSize:".8rem",color:"#64748b"}}>· {selectedFormat.duration}</span>}
                </div>
                {selectedFormat.details&&<div style={{fontSize:".78rem",color:"#64748b",lineHeight:1.5}}>{selectedFormat.details}</div>}
              </div>
            ) : (
              <div style={{padding:"14px 18px",borderBottom:"1px solid #f1f5f9",textAlign:"center",color:"#94a3b8",fontSize:".82rem",lineHeight:1.5}}>
                Cliquez sur une offre dans l'onglet<br/><strong style={{color:"#64748b"}}>"Formules & Tarifs"</strong> pour la sélectionner
              </div>
            )}
            <button className="course-detail-btn-enroll" style={{...S.btnEnroll,opacity:selectedFormat?1:.55,pointerEvents:selectedFormat?"auto":"none"}} onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={e=>e.currentTarget.style.background="#dc2626"} onClick={()=>selectedFormat&&setModalOpen(true)}>
              {selectedFormat?"✍️ S'inscrire — "+selectedFormat.price:"Choisissez d'abord une formule"}
            </button>
            <p style={{textAlign:"center",fontSize:".76rem",color:"#64748b",padding:"0 18px 14px",margin:0}}>✓ Garantie satisfait ou remboursé 30 jours</p>
            <div style={{padding:"14px 18px",borderTop:"1px solid #f1f5f9"}}>
              <p style={{fontWeight:700,fontSize:".82rem",color:"#0f172a",margin:"0 0 10px"}}>Ce cours comprend :</p>
              {course.includes?.map((inc,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span>{inc.icon}</span><span style={{fontSize:".82rem",color:"#475569"}}>{inc.label}</span></div>)}
            </div>
          </div>
          )}
        </aside>
      </div>

      {/* MODAL */}
      {modalOpen&&(
        <div style={S.overlayBg} onClick={()=>{setModalOpen(false);setCodePromo("");setCodePromoApplied(null);setCodePromoError("");}}>
          <div style={S.payModal} onClick={e=>e.stopPropagation()}>
            <button style={S.payClose} onClick={()=>{setModalOpen(false);setCodePromo("");setCodePromoApplied(null);setCodePromoError("");}}>✕</button>
            {/* ── Auth gate ── */}
            {!sbUser?(
              <div style={{textAlign:"center",padding:"20px 0 10px"}}>
                <div style={{fontSize:"3rem",marginBottom:12}}>🔐</div>
                <h3 style={{fontSize:"1.2rem",fontWeight:800,margin:"0 0 8px",color:"#0f172a"}}>Connexion requise</h3>
                <p style={{color:"#64748b",fontSize:".9rem",margin:"0 0 6px"}}>Vous devez être connecté pour finaliser votre inscription.</p>
                {selectedFormat&&(
                  <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",margin:"14px 0",textAlign:"left"}}>
                    <div style={{fontSize:".78rem",color:"#64748b"}}>Offre sélectionnée</div>
                    <div style={{fontWeight:700,fontSize:".95rem",color:"#0f172a"}}>{selectedFormat.name}</div>
                    <div style={{fontFamily:FD,fontSize:"1.2rem",color:"#dc2626"}}>{selectedFormat.price}</div>
                  </div>
                )}
                <button onClick={()=>window.dispatchEvent(new CustomEvent("bet:openLoginModal",{detail:{returnUrl:window.location.pathname+window.location.search,context:{type:"course",selectedFormat}}}))}
                  style={{width:"100%",padding:"13px",background:"#dc2626",color:"#fff",border:"none",borderRadius:999,fontWeight:800,fontSize:".95rem",cursor:"pointer",margin:"4px 0 10px"}}>
                  🔑 Se connecter / S'inscrire
                </button>
                <p style={{fontSize:".74rem",color:"#94a3b8",margin:0}}>Votre sélection sera conservée à votre retour.</p>
              </div>
            ):successMsg?(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:16}}>🎉</div>
                <h3 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 8px"}}>Inscription confirmée !</h3>
                <p style={{color:"#64748b",fontSize:".9rem"}}>Votre coach vous contactera sous 24h.</p>
              </div>
            ):(
              <>
                {/* Bandeau profil connecté */}
                <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <span style={{fontSize:"1rem"}}>✅</span>
                  <span style={{fontSize:".8rem",color:"#166534",fontWeight:600}}>Connecté en tant que <strong>{sbUser.user_metadata?.full_name||sbUser.email}</strong></span>
                </div>
                <h2 style={S.payTitle}>Finaliser votre inscription</h2>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
                  <div>
                    <span style={{color:"#64748b",fontSize:".9rem"}}>Formation : <strong style={{color:"#0f172a"}}>{course.title}</strong></span>
                    {selectedFormat&&<div style={{fontSize:".82rem",fontWeight:700,color:"#475569",marginTop:2}}>{selectedFormat.name}{selectedFormat.duration?" · "+selectedFormat.duration:""}</div>}
                  </div>
                  <span style={{fontFamily:FD,fontSize:"1.2rem",color:"#dc2626",flexShrink:0}}>{selectedFormat?.price||course.price}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div><p style={S.payLabel}>Nom complet *</p><input style={S.payInput} value={inscForm.nom} onChange={e=>setInscForm(p=>({...p,nom:e.target.value}))} placeholder="Jean Kouamé"/></div>
                  <div><p style={S.payLabel}>Email *</p><input style={S.payInput} type="email" value={inscForm.email} onChange={e=>setInscForm(p=>({...p,email:e.target.value}))} placeholder="jean@exemple.com"/></div>
                </div>
                <div style={{marginBottom:20}}><p style={S.payLabel}>Téléphone *</p><input style={S.payInput} type="tel" value={inscForm.tel} onChange={e=>setInscForm(p=>({...p,tel:e.target.value}))} placeholder="+225 07 00 00 00 00"/></div>
                {/* Code promo */}
                <div style={{marginBottom:20}}>
                  <p style={S.payLabel}>🏷️ Code promo <span style={{fontWeight:400,color:"#94a3b8"}}>(optionnel)</span></p>
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
                        style={{flex:1,...S.payInput,fontFamily:"monospace",letterSpacing:1,border:`1.5px solid ${codePromoError?"#dc2626":"#e2e8f0"}`}} />
                      <button onClick={validerCodePromo} disabled={!codePromo.trim()||codePromoLoading}
                        style={{padding:"0 16px",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:".8rem",opacity:(!codePromo.trim()||codePromoLoading)?.5:1,whiteSpace:"nowrap"}}>
                        {codePromoLoading?"⏳":"Appliquer"}
                      </button>
                    </div>
                  )}
                  {codePromoError&&<p style={{margin:"5px 0 0",fontSize:".72rem",color:"#dc2626"}}>{codePromoError}</p>}
                </div>
                <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                  <button style={{...S.payMethodBtn,...(payMethod==="mobile"?S.payMethodActive:{})}} onClick={()=>setPayMethod("mobile")}>📱 Mobile Money</button>
                  <button style={{...S.payMethodBtn,...(payMethod==="card"?S.payMethodActive:{})}} onClick={()=>setPayMethod("card")}>💳 Carte bancaire</button>
                </div>
                {payMethod==="mobile"&&(
                  <div style={{animation:"fadeIn .2s ease"}}>
                    <p style={S.payLabel}>Choisissez votre opérateur :</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                      {[{id:"orange",label:"Orange Money",color:"#ff7900"},{id:"mtn",label:"MTN MoMo",color:"#ffcc00"},{id:"wave",label:"Wave",color:"#1fb6ff"},{id:"moov",label:"Moov Money",color:"#00a86b"}].map(op=>(
                        <button key={op.id} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${mobileOp===op.id?op.color:"#e2e8f0"}`,background:mobileOp===op.id?op.color+"22":"#fff",fontSize:".8rem",fontWeight:mobileOp===op.id?800:600,cursor:"pointer",fontFamily:FF}} onClick={()=>setMobileOp(op.id)}>{op.label}</button>
                      ))}
                    </div>
                    {mobileOp&&<><p style={S.payLabel}>Numéro {mobileOp} :</p><input style={S.payInput} value={inscForm.mobileNum} onChange={e=>setInscForm(p=>({...p,mobileNum:e.target.value}))} placeholder="07 00 00 00 00" maxLength={10}/><p style={{fontSize:".74rem",color:"#64748b",margin:"-8px 0 14px"}}>Vous recevrez une invite de paiement sur ce numéro.</p></>}
                  </div>
                )}
                {payMethod==="card"&&(
                  <div style={{animation:"fadeIn .2s ease"}}>
                    <p style={S.payLabel}>Titulaire</p><input style={S.payInput} placeholder="Jean Kouamé"/>
                    <p style={S.payLabel}>Numéro de carte</p><input style={S.payInput} placeholder="•••• •••• •••• ••••" maxLength={19}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><p style={S.payLabel}>Expiration</p><input style={S.payInput} placeholder="MM/AA" maxLength={5}/></div>
                      <div><p style={S.payLabel}>CVV</p><input style={S.payInput} placeholder="•••" maxLength={4} type="password"/></div>
                    </div>
                    <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"9px 12px",fontSize:".76rem",color:"#166534",fontWeight:600,marginBottom:16,textAlign:"center"}}>🔒 SSL 256-bit — Visa & Mastercard acceptés</div>
                  </div>
                )}
                {inscErreur&&<p style={{color:"#dc2626",fontSize:".82rem",textAlign:"center",margin:"0 0 10px"}}>{inscErreur}</p>}
                <button style={{...S.payConfirmBtn,opacity:inscLoading?.7:1}} onClick={handlePay} disabled={inscLoading} onMouseEnter={e=>e.currentTarget.style.opacity=".9"} onMouseLeave={e=>e.currentTarget.style.opacity=inscLoading?"1":".9"}>{inscLoading?"Envoi en cours...":"Confirmer et payer "+(selectedFormat?.price||course.price)}</button>
                <p style={{textAlign:"center",fontSize:".75rem",color:"#94a3b8",marginTop:10}}>✓ Remboursement 30 jours · ✓ Accès immédiat · ✓ Sans engagement</p>
              </>
            )}
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
                    <p style={{fontSize:".78rem",color:"#64748b",margin:0}}>{course.title}</p>
                  </div>
                </div>
                <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:".82rem",color:"#92400e",display:"flex",gap:9,alignItems:"flex-start"}}>
                  <span>🏢</span>
                  <div><strong>Réservé aux entreprises uniquement.</strong> Ce service est destiné aux structures souhaitant former leurs collaborateurs. Un devis personnalisé vous sera transmis sous 24h.</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <p style={S.payLabel}>Nom complet *</p>
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
  page:        {fontFamily:FF,color:"#0f172a",background:"#fff",minHeight:"100vh"},
  hero:        {background:"linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 42, 74) 55%, rgb(30, 58, 138) 100%)", padding: "52px 0px 48px",   overflow: "hidden", position: "relative"},
  heroInner:   {maxWidth:1180,margin:"0 auto",padding:"0 24px"},
  heroMain:    {maxWidth:760},
  breadcrumb:  {display:"flex",alignItems:"center",gap:8,marginBottom:20,fontSize:".82rem",flexWrap:"wrap"},
  bLink:       {color:"#93c5fd",cursor:"pointer",textDecoration:"underline"},
  bSep:        {color:"rgba(255,255,255,.3)"},
  heroTitle:   {fontFamily:FD,fontSize:"clamp(1.8rem,4vw,2.8rem)",color:"#fff",margin:"0 0 12px",fontWeight:400,lineHeight:1.15},
  heroSub:     {color:"rgba(255,255,255,.75)",fontSize:"1.05rem",margin:"0 0 18px",lineHeight:1.6},
  heroMeta:    {display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:12},
  heroBadge:   {background:"#dc2626",color:"#fff",borderRadius:4,padding:"2px 10px",fontSize:".72rem",fontWeight:800,letterSpacing:".05em"},
  heroRating:  {color:"#f59e0b",fontWeight:800,fontSize:".95rem"},
  heroRatingCount:{color:"#93c5fd",fontSize:".82rem",textDecoration:"underline"},
  heroDot:     {color:"rgba(255,255,255,.3)"},
  heroMetaTxt: {color:"rgba(255,255,255,.8)",fontSize:".86rem"},
  heroCreator: {color:"rgba(255,255,255,.7)",fontSize:".84rem",marginBottom:16},
  heroCreatorLink:{color:"#93c5fd",textDecoration:"underline",cursor:"pointer"},
  heroPills:   {display:"flex",flexWrap:"wrap",gap:8,marginTop:4},
  heroPill:    {background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"rgba(255,255,255,.8)",borderRadius:6,padding:"4px 12px",fontSize:".78rem",fontWeight:500},
  tabsBar:     {background:"#fff",borderBottom:"1px solid #e2e8f0",position:"relative",zIndex:50},
  tabsSticky:  {position:"sticky",top:0,boxShadow:"0 2px 8px rgba(0,0,0,.06)"},
  tabsInner:   {maxWidth:1180,margin:"0 auto",padding:"0 24px",display:"flex",gap:0,overflowX:"auto"},
  tabBtn:      {background:"none",border:"none",borderBottom:"3px solid transparent",padding:"14px 20px",fontSize:".9rem",fontWeight:600,color:"#64748b",cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",fontFamily:FF},
  tabActive:   {color:"#dc2626",borderBottomColor:"#dc2626"},
  layout:      {maxWidth:1180,margin:"0 auto",padding:"36px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:40,alignItems:"start"},
  contentCol:  {minWidth:0},
  section:     {marginBottom:40,paddingBottom:36,borderBottom:"1px solid #f1f5f9"},
  sH2:         {fontFamily:FD,fontSize:"1.4rem",fontWeight:400,margin:"0 0 20px",color:"#0f172a"},
  learnGrid:   {display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:20},
  learnItem:   {display:"flex",alignItems:"flex-start",gap:10},
  learnCheck:  {color:"#1e3a8a",fontWeight:800,marginTop:1,flexShrink:0},
  learnTxt:    {fontSize:".88rem",color:"#334155",lineHeight:1.5},
  includesGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
  includeItem: {display:"flex",alignItems:"center",gap:10},
  plainList:   {listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:10},
  plainLi:     {fontSize:".92rem",color:"#334155",lineHeight:1.6},
  descP:       {fontSize:".95rem",color:"#475569",lineHeight:1.75,margin:"0 0 16px"},
  advDot:      {width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#dc2626,#1e3a8a)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",fontWeight:800,flexShrink:0},
  currMeta:    {fontSize:".86rem",color:"#64748b",margin:"0 0 16px",display:"flex",alignItems:"center",gap:12},
  expandBtn:   {background:"none",border:"1px solid #dc2626",color:"#dc2626",borderRadius:999,padding:"3px 12px",fontSize:".78rem",fontWeight:700,cursor:"pointer",marginLeft:"auto"},
  currList:    {border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"},
  currHead:    {width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",background:"#f8fafc",border:"none",cursor:"pointer",fontFamily:FF,transition:"background .15s",gap:12},
  lessonRow:   {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",transition:"background .15s",cursor:"default",borderBottom:"1px solid #f1f5f9"},
  previewBadge:{background:"#fef2f2",color:"#dc2626",borderRadius:999,padding:"2px 8px",fontSize:".68rem",fontWeight:700},
  showMoreBtn: {width:"100%",marginTop:12,padding:"12px",background:"none",border:"1.5px solid #dc2626",borderRadius:8,color:"#dc2626",fontFamily:FF,fontWeight:700,fontSize:".9rem",cursor:"pointer"},
  formatCard:  {borderRadius:16,padding:"24px 20px",border:"1.5px solid #e2e8f0",background:"#fff",cursor:"pointer",transition:"all .25s",position:"relative"},
  sidebar:     {position:"sticky",top:80,alignSelf:"start"},
  sideCard:    {background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.08)"},
  btnEnroll:   {display:"block",width:"calc(100% - 36px)",margin:"0 18px 10px",padding:"13px",background:"#dc2626",color:"#fff",border:"none",borderRadius:999,fontFamily:FF,fontWeight:800,fontSize:"1rem",cursor:"pointer",transition:"background .2s"},
  btnDevis:    {display:"block",width:"calc(100% - 36px)",margin:"0 18px 8px",padding:"12px",background:"transparent",color:"#1e3a8a",border:"1.5px solid #1e3a8a",borderRadius:999,fontFamily:FF,fontWeight:700,fontSize:".92rem",cursor:"pointer",transition:"all .2s"},
  overlayBg:   {position:"fixed",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:16,animation:"fadeIn .2s ease"},
  payModal:    {background:"#fff",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"28px",position:"relative",animation:"scaleIn .25s ease",boxShadow:"0 30px 80px rgba(0,0,0,.22)"},
  payClose:    {position:"absolute",top:14,right:14,background:"#f1f5f9",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:".9rem",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"},
  payTitle:    {fontFamily:FD,fontSize:"1.4rem",margin:"0 0 16px",fontWeight:400},
  payLabel:    {fontSize:".8rem",fontWeight:700,color:"#0f172a",margin:"0 0 6px"},
  payMethodBtn:{flex:1,padding:"10px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",fontFamily:FF,fontWeight:700,fontSize:".86rem",cursor:"pointer",transition:"all .2s"},
  payMethodActive:{borderColor:"#dc2626",background:"#fef2f2",color:"#dc2626"},
  payInput:    {width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:".9rem",fontFamily:FF,outline:"none",marginBottom:14,boxSizing:"border-box"},
  payConfirmBtn:{width:"100%",padding:"13px",background:"linear-gradient(135deg,#dc2626,#1e3a8a)",color:"#fff",border:"none",borderRadius:999,fontFamily:FF,fontWeight:800,fontSize:"1rem",cursor:"pointer",transition:"opacity .2s"},
};

export default CourseDetail;