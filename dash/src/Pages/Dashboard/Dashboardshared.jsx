// ══════════════════════════════════════════════════════════════════
// DashboardShared.jsx — BET · Composants partagés pour tous les tableaux de bord
// ══════════════════════════════════════════════════════════════════
import React, { useState } from "react";

export const FF = "'Montserrat','Segoe UI',sans-serif";
export const FD = "'Montserrat','Segoe UI',sans-serif";

// ── Keyframes (injectés une seule fois) ─────────────────────────
if (!document.querySelector("#db-kf")) {
  const s = document.createElement("style"); s.id = "db-kf";
  s.textContent = `
    @keyframes dbFU { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes dbFI { from{opacity:0} to{opacity:1} }
    @keyframes dbSI { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    @keyframes dbSpin { to{transform:rotate(360deg)} }
    @keyframes dbCount { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(s);
}

// ── StatCard ─────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, sub, color="#dc2626", trend, idx=0 }) => (
  <div style={{
    background:"#fff", border:"1px solid #e2e8f0", borderRadius:14,
    padding:"20px 18px", display:"flex", flexDirection:"column", gap:8,
    boxShadow:"0 2px 8px rgba(0,0,0,.04)", borderTop:`3px solid ${color}`,
    animation:`dbFU .4s ease ${idx*60}ms both`,
  }}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{width:40,height:40,borderRadius:10,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem"}}>{icon}</div>
      {trend !== undefined && (
        <span style={{fontSize:".72rem",fontWeight:800,color:trend>=0?"#059669":"#dc2626",background:trend>=0?"#f0fdf4":"#fef2f2",padding:"2px 8px",borderRadius:999}}>
          {trend>=0?"↑":""}{trend}%
        </span>
      )}
    </div>
    <div style={{fontFamily:FD,fontSize:"1.8rem",fontWeight:800,color:"#0f172a",animation:`dbCount .5s ease ${idx*80}ms both`}}>{value}</div>
    <div style={{fontSize:".82rem",fontWeight:700,color:"#475569"}}>{label}</div>
    {sub && <div style={{fontSize:".74rem",color:"#94a3b8"}}>{sub}</div>}
  </div>
);

// ── FilterBar ────────────────────────────────────────────────────
export const FilterBar = ({ period, setPeriod, offre, setOffre, offres=[], profil, setProfil, profils=[] }) => (
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24,alignItems:"center"}}>
    <span style={{fontSize:".78rem",fontWeight:700,color:"#64748b"}}>Filtrer :</span>
    {/* Période */}
    <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:8,padding:3}}>
      {["Semaine","Mois","Trimestre","Année"].map(p=>(
        <button key={p} style={{padding:"5px 12px",borderRadius:6,border:"none",fontFamily:FF,fontSize:".76rem",fontWeight:700,cursor:"pointer",background:period===p?"#fff":"transparent",color:period===p?"#0f172a":"#64748b",boxShadow:period===p?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all .15s"}} onClick={()=>setPeriod(p)}>{p}</button>
      ))}
    </div>
    {/* Offre */}
    {offres.length > 0 && (
      <select style={{padding:"6px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontFamily:FF,fontSize:".78rem",color:"#475569",background:"#fff",cursor:"pointer"}} value={offre} onChange={e=>setOffre(e.target.value)}>
        <option value="">Toutes offres</option>
        {offres.map(o=><option key={o}>{o}</option>)}
      </select>
    )}
    {/* Profil */}
    {profils.length > 0 && (
      <select style={{padding:"6px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontFamily:FF,fontSize:".78rem",color:"#475569",background:"#fff",cursor:"pointer"}} value={profil} onChange={e=>setProfil(e.target.value)}>
        <option value="">Tous profils</option>
        {profils.map(p=><option key={p}>{p}</option>)}
      </select>
    )}
  </div>
);

// ── ExportBar ────────────────────────────────────────────────────
export const ExportBar = ({ onExportCSV, onExportPDF, onSchedule }) => (
  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
    <span style={{fontSize:".78rem",fontWeight:700,color:"#64748b"}}>Exporter :</span>
    <button style={btnExport("#1e3a8a")} onClick={onExportPDF}>📄 PDF</button>
    <button style={btnExport("#059669")} onClick={onExportCSV}>📊 Excel/CSV</button>
    <button style={btnExport("#7c3aed")} onClick={onSchedule}>📅 Planifier envoi</button>
  </div>
);
const btnExport = (color) => ({
  display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
  background:`${color}12`,border:`1.5px solid ${color}30`,
  borderRadius:8,fontFamily:FF,fontSize:".76rem",fontWeight:700,
  color,cursor:"pointer",transition:"all .2s",
});

// ── ScheduleModal ────────────────────────────────────────────────
export const ScheduleModal = ({ onClose }) => {
  const [freq, setFreq] = useState("hebdomadaire");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const handleSave = () => { if(!email.trim()) return; setSent(true); setTimeout(()=>{setSent(false);onClose();},2000); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16,animation:"dbFI .2s ease"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:440,padding:"28px",position:"relative",animation:"dbSI .25s ease",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <button style={{position:"absolute",top:14,right:14,background:"#f1f5f9",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",color:"#64748b",fontSize:".88rem"}} onClick={onClose}>✕</button>
        {sent ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:"2.5rem",marginBottom:12}}>✅</div>
            <p style={{fontWeight:800,color:"#0f172a",margin:"0 0 6px"}}>Planification enregistrée !</p>
            <p style={{fontSize:".86rem",color:"#64748b",margin:0}}>Les rapports seront envoyés à {email}</p>
          </div>
        ) : <>
          <h3 style={{fontFamily:FD,fontWeight:800,fontSize:"1.2rem",margin:"0 0 20px",color:"#0f172a"}}>📅 Planifier l'envoi automatique</h3>
          <div style={{marginBottom:14}}>
            <p style={{fontSize:".78rem",fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>Fréquence d'envoi</p>
            <div style={{display:"flex",gap:8}}>
              {["hebdomadaire","mensuel"].map(f=>(
                <button key={f} style={{flex:1,padding:"9px",border:`1.5px solid ${freq===f?"#dc2626":"#e2e8f0"}`,borderRadius:10,background:freq===f?"#fef2f2":"#fff",fontFamily:FF,fontSize:".82rem",fontWeight:700,color:freq===f?"#dc2626":"#64748b",cursor:"pointer"}} onClick={()=>setFreq(f)}>
                  {f==="hebdomadaire"?"📅 Hebdomadaire":"🗓 Mensuel"}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontSize:".78rem",fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>Email du destinataire *</p>
            <input style={{width:"100%",padding:"10px 13px",border:"1.5px solid #e2e8f0",borderRadius:10,fontFamily:FF,fontSize:".9rem",boxSizing:"border-box",outline:"none"}} placeholder="manager@binnies-english.ci" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:".78rem",color:"#64748b"}}>
            📧 Le rapport sera envoyé automatiquement tous les <strong>{freq==="hebdomadaire"?"lundis matins":"1ers du mois"}</strong> à 8h00.
          </div>
          <button style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#dc2626,#1e3a8a)",color:"#fff",border:"none",borderRadius:999,fontFamily:FF,fontWeight:800,fontSize:".95rem",cursor:"pointer"}} onClick={handleSave}>
            Confirmer la planification →
          </button>
        </>}
      </div>
    </div>
  );
};

// ── MiniBarChart (SVG) ───────────────────────────────────────────
export const MiniBarChart = ({ data=[], color="#dc2626", height=60 }) => {
  const max = Math.max(...data.map(d=>d.v),1);
  const w = 260; const barW = w/data.length - 4;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height+24}`} style={{display:"block"}}>
      {data.map((d,i)=>{
        const bh = Math.max((d.v/max)*(height-4),4);
        const x = i*(w/data.length)+2;
        return <g key={i}>
          <rect x={x} y={height-bh+2} width={barW} height={bh} rx={3} fill={color} opacity={.85}/>
          <text x={x+barW/2} y={height+16} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily={FF}>{d.l}</text>
        </g>;
      })}
    </svg>
  );
};

// ── MiniLineChart (SVG) ──────────────────────────────────────────
export const MiniLineChart = ({ data=[], color="#1e3a8a", height=60 }) => {
  const max = Math.max(...data.map(d=>d.v),1);
  const w = 260;
  const pts = data.map((d,i)=>({ x: (i/(data.length-1||1))*w, y: height-(d.v/max)*(height-8)+4 }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const area = path + ` L${w},${height} L0,${height} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height+24}`} style={{display:"block"}}>
      <defs>
        <linearGradient id={`lg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg${color.replace("#","")})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3} fill={color}/>)}
      {data.map((d,i)=>{
        const p = pts[i];
        return <text key={i} x={p.x} y={height+16} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily={FF}>{d.l}</text>;
      })}
    </svg>
  );
};

// ── ProgressBar ──────────────────────────────────────────────────
export const ProgressBar = ({ value, max=100, color="#dc2626", label, showPct=true }) => (
  <div style={{marginBottom:10}}>
    {label && <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
      <span style={{fontSize:".82rem",color:"#475569",fontWeight:600}}>{label}</span>
      {showPct && <span style={{fontSize:".78rem",fontWeight:800,color}}>{Math.round((value/max)*100)}%</span>}
    </div>}
    <div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min((value/max)*100,100)}%`,background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:4,transition:"width 1s ease"}}/>
    </div>
  </div>
);

// ── Badge ────────────────────────────────────────────────────────
export const Badge = ({ label, color="#dc2626" }) => (
  <span style={{background:`${color}15`,color,borderRadius:999,padding:"2px 10px",fontSize:".72rem",fontWeight:800,whiteSpace:"nowrap"}}>{label}</span>
);

// ── DataTable ────────────────────────────────────────────────────
export const DataTable = ({ columns=[], rows=[], onRowClick }) => (
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:FF,fontSize:".84rem"}}>
      <thead>
        <tr style={{background:"#f8fafc"}}>
          {columns.map((col,i)=>(
            <th key={i} style={{padding:"10px 14px",textAlign:"left",fontWeight:800,color:"#64748b",fontSize:".72rem",textTransform:"uppercase",letterSpacing:".05em",borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row,ri)=>(
          <tr key={ri} style={{borderBottom:"1px solid #f1f5f9",cursor:onRowClick?"pointer":"default",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>onRowClick?.(row)}>
            {row.map((cell,ci)=>(
              <td key={ci} style={{padding:"10px 14px",color:"#334155",verticalAlign:"middle"}}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Helpers export ───────────────────────────────────────────────
export const exportCSV = (headers, rows, filename="rapport") => {
  const csvContent = [headers, ...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csvContent], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`${filename}_${new Date().toLocaleDateString("fr")}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (title) => {
  const style = document.createElement("style");
  style.id = "__print_style";
  style.textContent = `@media print { .no-print{display:none!important} body{font-family:'Montserrat',sans-serif} }`;
  document.head.appendChild(style);
  const orig = document.title;
  document.title = title;
  window.print();
  document.title = orig;
  style.remove();
};

// ── Shared tab styles ─────────────────────────────────────────────
export const tabStyles = {
  tabsBar:    { background:"#fff", borderBottom:"1px solid #e2e8f0", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  tabsInner:  { maxWidth:1280, margin:"0 auto", padding:"0 28px", display:"flex", overflowX:"auto", gap:0 },
  tabBtn:     (active) => ({ background:"none", border:"none", borderBottom:`3px solid ${active?"#dc2626":"transparent"}`, padding:"13px 18px", fontSize:".86rem", fontWeight:700, color:active?"#dc2626":"#64748b", cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s", fontFamily:FF }),
  body:       { maxWidth:1280, margin:"0 auto", padding:"28px 28px 60px" },
  sectionCard:{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"22px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,.04)" },
  sH2:        { fontFamily:FD, fontSize:"1.05rem", fontWeight:800, margin:"0 0 18px", color:"#0f172a" },
};