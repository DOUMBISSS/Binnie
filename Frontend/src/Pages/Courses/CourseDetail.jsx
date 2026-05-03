import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coursesData } from "../../data/coursesData";
import Footer from "../Footer/Footer";
import { insertDemandeDevis, insertInscriptionAdulte } from "../../services/formsService";

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
  const rawCourse=coursesData?.[type];
  const course=rawCourse?{...MOCK_COURSE,...rawCourse}:MOCK_COURSE;
  const[activeTab,setActiveTab]=useState("apercu");
  const[openSections,setOpenSections]=useState({0:true});
  const[showAllCurr,setShowAllCurr]=useState(false);
  const[sidebarSticky,setSidebarSticky]=useState(false);
  const[modalOpen,setModalOpen]=useState(false);
  const[payMethod,setPayMethod]=useState("mobile");
  const[mobileOp,setMobileOp]=useState(null);
  const[successMsg,setSuccessMsg]=useState(false);
  const[hovCard,setHovCard]=useState(null);
  const[devisOpen,setDevisOpen]=useState(false);
  const[devisSuccess,setDevisSuccess]=useState(false);
  const[devisForm,setDevisForm]=useState({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});
  const[inscForm,setInscForm]=useState({nom:"",email:"",tel:"",mobileNum:""});
  const[inscErreur,setInscErreur]=useState("");
  const[inscLoading,setInscLoading]=useState(false);
  const heroRef=useRef(null);

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

  const TABS=[{id:"apercu",label:"Aperçu"},{id:"contenu",label:"Contenu du cours"},{id:"formules",label:"Formules & Tarifs"},{id:"avis",label:`Avis (${course.testimonials?.length||0})`},{id:"faq",label:"FAQ"}];
  const toggleSection=i=>setOpenSections(p=>({...p,[i]:!p[i]}));
  const totalSessions=course.curriculum?.reduce((a,s)=>a+s.sessions.length,0)||0;
  const visibleCurr=showAllCurr?course.curriculum:course.curriculum?.slice(0,4);
  const handlePay=async()=>{
    if(!inscForm.nom||!inscForm.email||!inscForm.tel)return alert("Veuillez remplir votre nom, email et téléphone.");
    setInscLoading(true);setInscErreur("");
    try{
      await insertInscriptionAdulte({
        nom_complet:inscForm.nom,
        email:inscForm.email,
        telephone:inscForm.tel,
        offre_titre:course.title,
        mode_paiement:payMethod==="mobile"?`Mobile Money ${mobileOp||""} — ${inscForm.mobileNum}`:"Carte bancaire",
        statut:"en_attente",
      });
      setSuccessMsg(true);
      setTimeout(()=>{setSuccessMsg(false);setModalOpen(false);setInscForm({nom:"",email:"",tel:"",mobileNum:""});},3000);
    }catch(e){
      setInscErreur("Une erreur est survenue. Veuillez réessayer.");
    }finally{
      setInscLoading(false);
    }
  };
  const handleDevis=async()=>{
    try{
      await insertDemandeDevis({nom:devisForm.nom,email:devisForm.email,tel:devisForm.tel,entreprise:devisForm.entreprise||null,participants:devisForm.participants,message:devisForm.message||null,source:"cours",source_nom:course.title});
      setDevisSuccess(true);
      setTimeout(()=>{setDevisSuccess(false);setDevisOpen(false);setDevisForm({nom:"",email:"",tel:"",entreprise:"",participants:"1",message:""});},3000);
    }catch(err){console.error("Erreur devis:",err);}
  };

  return(
    <div className="course-detail-root" style={S.page}>
      {/* HERO */}
      <div ref={heroRef} style={S.hero}>
        <div className="course-detail-hero-inner" style={S.heroInner}>
          <div style={S.heroMain}>
            <div style={S.breadcrumb}>
              <span style={S.bLink} onClick={()=>navigate("/")}>Accueil</span><span style={S.bSep}>/</span>
              <span style={S.bLink} onClick={()=>navigate(-1)}>Cours</span><span style={S.bSep}>/</span>
              <span style={{color:"#e2e8f0"}}>{course.title}</span>
            </div>
            <h1 className="course-detail-hero-title" style={S.heroTitle}>{course.title}</h1>
            <p style={S.heroSub}>{course.subtitle}</p>
            <div style={S.heroMeta}>
              <span style={S.heroBadge}>⭐ BESTSELLER</span>
              <span style={S.heroRating}>{course.rating}</span>
              <Stars rating={course.rating} size={13}/>
              <span style={S.heroRatingCount}>({course.ratingCount?.toLocaleString()} avis)</span>
              <span style={S.heroDot}>•</span>
              <span style={S.heroMetaTxt}>👥 {course.students?.toLocaleString()} participants</span>
            </div>
            <div style={S.heroCreator}>Créé par <span style={S.heroCreatorLink}>{course.creator}</span></div>
            <div style={S.heroPills}>
              {[`🕐 Màj : ${course.lastUpdate}`,`🌐 ${course.language}`,`📊 ${course.level}`,`🎥 ${course.duration}`,`📋 ${course.lectureCount} leçons`].map((t,i)=><span key={i} style={S.heroPill}>{t}</span>)}
            </div>
          </div>
        </div>
      </div>

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
          {activeTab==="contenu"&&(
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
          )}

          {/* Formules */}
          {activeTab==="formules"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Choisissez votre formule</h2>
                <p style={S.currMeta}>Sans engagement · Changez ou annulez à tout moment</p>
                <div className="course-detail-formats-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,marginBottom:28}}>
                  {course.formats?.map((f,i)=>(
                    <div key={i} style={{...S.formatCard,...(f.popular?{borderColor:"#dc2626",background:"#fef2f2"}:{}),...(hovCard===i?{transform:"translateY(-5px)",boxShadow:"0 16px 40px rgba(0,0,0,.1)"}:{})}} onMouseEnter={()=>setHovCard(i)} onMouseLeave={()=>setHovCard(null)}>
                      {f.popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#dc2626",color:"#fff",borderRadius:999,padding:"3px 14px",fontSize:".68rem",fontWeight:800,whiteSpace:"nowrap"}}>⭐ Le plus choisi</div>}
                      <h3 style={{fontFamily:FD,fontSize:"1.2rem",margin:"0 0 10px",fontWeight:400}}>{f.name}</h3>
                      <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:10}}>
                        <span style={{fontFamily:FD,fontSize:"1.6rem",color:"#0f172a"}}>{f.price}</span>
                        <span style={{fontSize:".82rem",color:"#64748b"}}> FCFA{f.duration}</span>
                      </div>
                      <p style={{fontSize:".82rem",color:"#64748b",marginBottom:18,lineHeight:1.5}}>{f.details}</p>
                      <button style={{width:"100%",padding:"10px",border:`1.5px solid ${f.popular?"transparent":"#dc2626"}`,borderRadius:999,background:f.popular?"#dc2626":"transparent",color:f.popular?"#fff":"#dc2626",fontFamily:FF,fontWeight:700,fontSize:".88rem",cursor:"pointer",transition:"all .2s"}} onClick={()=>setModalOpen(true)}>Choisir cette formule →</button>
                    </div>
                  ))}
                </div>
                <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"flex-start",gap:16,color:"#166534"}}>
                  <span style={{fontSize:"1.5rem"}}>🛡️</span>
                  <div><strong style={{display:"block",marginBottom:4}}>Garantie satisfait ou remboursé 30 jours</strong><span style={{fontSize:".88rem",color:"#64748b"}}>Aucun risque. Si vous n'êtes pas satisfait dans les 30 jours, nous vous remboursons intégralement, sans condition.</span></div>
                </div>
              </section>
            </div>
          )}

          {/* Avis */}
          {activeTab==="avis"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <section style={S.section}>
                <h2 style={S.sH2}>Ce que disent nos apprenants</h2>
                <div style={{display:"flex",gap:32,alignItems:"center",background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:12,padding:24,marginBottom:28,flexWrap:"wrap"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:90}}>
                    <div style={{fontFamily:FD,fontSize:"3rem",color:"#0f172a",lineHeight:1}}>{course.rating}</div>
                    <Stars rating={course.rating} size={22}/>
                    <div style={{fontSize:".76rem",color:"#64748b",fontWeight:600}}>Note globale</div>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                    {[{s:5,p:88},{s:4,p:9},{s:3,p:2},{s:2,p:1},{s:1,p:0}].map((r,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flex:1,height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}><div style={{width:`${r.p}%`,height:"100%",background:"#f59e0b",borderRadius:4}}/></div>
                        <Stars rating={r.s} size={11}/><span style={{fontSize:".76rem",color:"#64748b",width:30,textAlign:"right"}}>{r.p}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {course.testimonials?.map((t,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>{t.avatar}</div>
                        <div><div style={{fontWeight:800,fontSize:".9rem"}}>{t.name}</div><div style={{fontSize:".76rem",color:"#64748b"}}>{t.role}</div></div>
                        <div style={{marginLeft:"auto",background:"#fef2f2",color:"#dc2626",borderRadius:999,padding:"3px 12px",fontSize:".74rem",fontWeight:800,whiteSpace:"nowrap"}}>{t.score}</div>
                      </div>
                      <Stars rating={t.rating} size={13}/>
                      <p style={{fontSize:".9rem",color:"#475569",lineHeight:1.65,marginTop:10,fontStyle:"italic"}}>"{t.text}"</p>
                    </div>
                  ))}
                </div>
              </section>
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
          <div className="course-detail-side-card" style={S.sideCard}>
            <div className="timer-badge" style={{background:"#fef3c7",padding:"8px 14px",fontSize:".8rem",color:"#92400e",fontWeight:600,textAlign:"center",borderBottom:"1px solid #fde68a",wordBreak:"break-word"}}>⏱ Offre limitée · Se termine dans <strong>05:42:11</strong></div>
            <div className="price-row" style={{padding:"16px 18px 10px",display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:FD,fontSize:"1.9rem",color:"#0f172a"}}>{course.price}</span>
              <span style={{fontSize:"1rem",color:"#94a3b8",textDecoration:"line-through"}}>{course.oldPrice}</span>
              <span style={{background:"#fef2f2",color:"#dc2626",borderRadius:999,padding:"2px 10px",fontSize:".76rem",fontWeight:800}}>-{course.discount}</span>
            </div>
            <button className="course-detail-btn-enroll" style={S.btnEnroll} onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={e=>e.currentTarget.style.background="#dc2626"} onClick={()=>setModalOpen(true)}>S'inscrire maintenant</button>
            <button className="course-detail-btn-quote" style={S.btnDevis} onMouseEnter={e=>{e.currentTarget.style.background="#1e3a8a";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#1e3a8a";}} onClick={()=>setDevisOpen(true)}>🏢 Devis entreprise</button>
            <p style={{textAlign:"center",fontSize:".76rem",color:"#64748b",padding:"0 18px 14px",margin:0}}>✓ Garantie satisfait ou remboursé 30 jours</p>
            <div style={{padding:"14px 18px",borderTop:"1px solid #f1f5f9"}}>
              <p style={{fontWeight:700,fontSize:".82rem",color:"#0f172a",margin:"0 0 10px"}}>Ce cours comprend :</p>
              {course.includes?.map((inc,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span>{inc.icon}</span><span style={{fontSize:".82rem",color:"#475569"}}>{inc.label}</span></div>)}
            </div>
            <div className="course-detail-share-buttons" style={{padding:"12px 18px",display:"flex",gap:8,borderTop:"1px solid #f1f5f9"}}>
              {["🔗 Partager","🎁 Offrir","🔖 Sauver"].map((l,i)=><button key={i} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 4px",fontSize:".72rem",fontWeight:600,cursor:"pointer",color:"#475569"}}>{l}</button>)}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      {modalOpen&&(
        <div style={S.overlayBg} onClick={()=>setModalOpen(false)}>
          <div style={S.payModal} onClick={e=>e.stopPropagation()}>
            <button style={S.payClose} onClick={()=>setModalOpen(false)}>✕</button>
            {successMsg?(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:16}}>🎉</div>
                <h3 style={{fontSize:"1.3rem",fontWeight:800,margin:"0 0 8px"}}>Inscription confirmée !</h3>
                <p style={{color:"#64748b",fontSize:".9rem"}}>Votre coach vous contactera sous 24h.</p>
              </div>
            ):(
              <>
                <h2 style={S.payTitle}>Finaliser votre inscription</h2>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
                  <span style={{color:"#64748b",fontSize:".9rem"}}>Formation : <strong style={{color:"#0f172a"}}>{course.title}</strong></span>
                  <span style={{fontFamily:FD,fontSize:"1.2rem",color:"#0f172a"}}>{course.price}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div><p style={S.payLabel}>Nom complet *</p><input style={S.payInput} value={inscForm.nom} onChange={e=>setInscForm(p=>({...p,nom:e.target.value}))} placeholder="Jean Kouamé"/></div>
                  <div><p style={S.payLabel}>Email *</p><input style={S.payInput} type="email" value={inscForm.email} onChange={e=>setInscForm(p=>({...p,email:e.target.value}))} placeholder="jean@exemple.com"/></div>
                </div>
                <div style={{marginBottom:20}}><p style={S.payLabel}>Téléphone *</p><input style={S.payInput} type="tel" value={inscForm.tel} onChange={e=>setInscForm(p=>({...p,tel:e.target.value}))} placeholder="+225 07 00 00 00 00"/></div>
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
                <button style={{...S.payConfirmBtn,opacity:inscLoading?.7:1}} onClick={handlePay} disabled={inscLoading} onMouseEnter={e=>e.currentTarget.style.opacity=".9"} onMouseLeave={e=>e.currentTarget.style.opacity=inscLoading?"1":".9"}>{inscLoading?"Envoi en cours...":"Confirmer et payer "+course.price}</button>
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