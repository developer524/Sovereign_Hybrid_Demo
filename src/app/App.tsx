import React, { useState, useEffect, useRef, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Shield, Wifi, WifiOff, Globe, Monitor, Cloud, Lock,
  ArrowRight, ChevronRight, FileText, CheckCircle, XCircle,
  AlertTriangle, Cpu, Server, EyeOff, Zap, Activity,
  RefreshCw, TrendingDown, Sun, Moon,
} from "lucide-react";
import { ImpactGraph } from "./components/ImpactGraph";

const F_SERIF = "'Fraunces', Georgia, serif";
const F_SANS  = "'DM Sans', system-ui, sans-serif";
const F_MONO  = "'JetBrains Mono', monospace";

/* ── light theme ── */
const L = {
  bg:     "#F4EDE1", bg2: "#EDE4D6", bg3: "#E5DAC8",
  ink:    "#18120A", mid: "#6B5F52", dim: "#A89A8C",
  card:   "#FFFFFF", cardBorder: "rgba(26,18,8,0.09)",
  navBg:  "rgba(244,237,225,0.85)",
};
/* ── dark theme ── */
const D = {
  bg:     "#0F0D20", bg2: "#14112B", bg3: "#1A1735",
  ink:    "#E8EDF5", mid: "#8A94A6", dim: "#4E5668",
  card:   "#17152E", cardBorder: "rgba(165,180,252,0.09)",
  navBg:  "rgba(15,13,32,0.90)",
};

/* serious, muted palette — near-black accent + deep semantic tones */
const GREEN  = "#15803D";
const RED    = "#B91C1C";
const BLUE   = "#1E40AF";
const PURPLE = "#111111";
const AMBER  = "#92400E";

/* terminal darks — deep indigo, not black */
const T0 = "#0E0B22";
const T1 = "#130F2A";
const T2 = "#1A1635";

const DOCS = [
  { name:"BTC_treasury_policy.pdf",       cls:"CONFIDENTIAL" },
  { name:"ISDA_confirms_Q2.pdf",           cls:"RESTRICTED"   },
  { name:"hedge_book_snapshot.xlsx",       cls:"CONFIDENTIAL" },
  { name:"board_pack_2026.pdf",            cls:"RESTRICTED"   },
  { name:"counterparty_exposure_memo.pdf", cls:"CONFIDENTIAL" },
];
const POOL = [
  { m:"POST", p:"/vendor/analytics (filename + hash)"    },
  { m:"GET",  p:"/retrieval/{doc_id} (chunk fetch)"      },
  { m:"POST", p:"/grads/private (per-example gradients)" },
  { m:"POST", p:"/telemetry/query (prompt string)"       },
  { m:"GET",  p:"/api/log-doc (raw content)"             },
  { m:"PUT",  p:"/backup/hedge_book (spreadsheet upload)"},
  { m:"POST", p:"/crash-reporter (stack incl. text)"     },
];
const GW = [
  {t:"18:27:08",src:"local→cloud",   svc:"sovereign-bridge-cn",  a:"test bridged (no source docs)"},
  {t:"18:23:15",src:"cloud→external",svc:"sovereign-bridge-cn",  a:"external knowledge lookup"    },
  {t:"18:23:19",src:"cloud→external",svc:"gateway.agentix.cloud",a:"external knowledge lookup"    },
  {t:"18:23:46",src:"local→cloud",   svc:"gateway.agentix.cloud",a:"test bridged (no source docs)"},
  {t:"18:24:02",src:"local→cloud",   svc:"sovereign-bridge-cn",  a:"assert bridge source data"    },
  {t:"18:24:46",src:"cloud→external",svc:"gateway.agentix.cloud",a:"external knowledge lookup"    },
];
const MODES = [
  {n:1,label:"Mingle: internal + external",icon:<Globe size={12}/>,  color:GREEN },
  {n:2,label:"Local-only: confidential",   icon:<Lock size={12}/>,   color:PURPLE},
  {n:3,label:"External-only",              icon:<Cloud size={12}/>,  color:BLUE  },
  {n:4,label:"Deep reasoning: 70B",        icon:<Cpu size={12}/>,    color:AMBER, badge:"70B"},
];
function ts(){ return new Date().toTimeString().slice(0,8); }

/* ── Pulse dot ─────────────────────────────────────────────────────────── */
function Dot({color=GREEN,size=7}:{color?:string;size?:number}){
  return(
    <span style={{position:"relative",display:"inline-flex",width:size,height:size,flexShrink:0}}>
      <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color,
                    animation:"pulse 1.8s ease-out infinite",opacity:.7}}/>
      <span style={{position:"relative",width:"100%",height:"100%",borderRadius:"50%",background:color}}/>
    </span>
  );
}

/* ── GLASS BUTTON ─────────────────────────────────────────────────────── */
function cnG(...inputs: (string|undefined|null|false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
const glassButtonVariants = cva(
  "relative isolate cursor-pointer rounded-full transition-all",
  { variants:{ size:{ default:"text-base font-medium", sm:"text-sm font-medium",
      lg:"text-lg font-medium", icon:"h-10 w-10" } },
    defaultVariants:{ size:"default" } }
);
const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  { variants:{ size:{ default:"px-6 py-3.5", sm:"px-4 py-2",
      lg:"px-8 py-4", icon:"flex h-10 w-10 items-center justify-center" } },
    defaultVariants:{ size:"default" } }
);
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof glassButtonVariants> { contentClassName?: string; }
const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, ...props }, ref) => (
    <div className={cnG("glass-button-wrap cursor-pointer rounded-full", className)}>
      <button className={cnG("glass-button", glassButtonVariants({size}))} ref={ref} {...props}>
        <span className={cnG(glassButtonTextVariants({size}), contentClassName)}>{children}</span>
      </button>
      <div className="glass-button-shadow rounded-full"/>
    </div>
  )
);
GlassButton.displayName = "GlassButton";

/* ═══════════════════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App(){
  const [dm,    setDm]    = useState(false);         /* dark mode */
  const [tab,   setTab]   = useState<"guided"|"howit">("guided");
  const [mode,  setMode]  = useState(0);
  const [wifi,  setWifi]  = useState(true);
  const [query, setQuery] = useState("");
  const [sent,  setSent]  = useState(false);
  const [log,   setLog]   = useState<{id:number;t:string;m:string;p:string}[]>([]);
  const [cnt,   setCnt]   = useState(94);
  const id = useRef(0);

  const C = dm ? D : L;  /* active colour set */

  /* panel text/border tones — light-on-dark in dark mode, ink-on-white in light */
  const tInk    = dm ? "rgba(255,255,255,0.85)" : C.ink;
  const tMid    = dm ? "rgba(255,255,255,0.5)"  : C.mid;
  const tDim    = dm ? "rgba(255,255,255,0.3)"  : C.dim;
  const tFaint  = dm ? "rgba(255,255,255,0.22)" : C.dim;
  const tBorder = dm ? "rgba(255,255,255,0.07)" : C.cardBorder;
  const tHover  = dm ? "rgba(255,255,255,0.03)" : "rgba(26,18,8,0.03)";
  const AC_G = dm ? "#4ADE80" : GREEN;
  const AC_B = dm ? "#60A5FA" : BLUE;
  const AC_I = dm ? "#818CF8" : PURPLE;
  const AC_R = dm ? "#F87171" : RED;

  useEffect(()=>{
    const iv=setInterval(()=>{
      const e=POOL[Math.floor(Math.random()*POOL.length)];
      id.current+=1;
      const nid=id.current;
      setLog(p=>[{id:nid,t:ts(),...e},...p.slice(0,10)]);
      setCnt(c=>c+1);
    },1900);
    return()=>clearInterval(iv);
  },[]);

  function doSend(){
    if(!query.trim())return;
    setSent(true); setQuery(""); setTimeout(()=>setSent(false),3000);
  }

  /* ── helpers that use current theme ── */
  function LightCard({children,accent="#fff",style={}}:
    {children:React.ReactNode;accent?:string;style?:React.CSSProperties}){
    return(
      <div style={{borderRadius:22,background:C.card,
                   border:`1px solid ${C.cardBorder}`,
                   boxShadow:dm
                     ?`0 0 0 1px rgba(255,255,255,0.05),0 8px 32px rgba(0,0,0,0.3),0 0 50px ${accent}12`
                     :`0 4px 32px rgba(0,0,0,0.06),0 0 50px ${accent}10`,
                   overflow:"hidden",...style}}>
        {children}
      </div>
    );
  }

  function TermPanel({children,accent="#fff",style={}}:
    {children:React.ReactNode;accent?:string;style?:React.CSSProperties}){
    return(
      <div style={{borderRadius:22,background:dm?T0:C.card,overflow:"hidden",
                   border:`1px solid ${dm?"rgba(255,255,255,0.08)":C.cardBorder}`,
                   boxShadow:dm
                     ?`0 24px 70px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.05),0 0 70px ${accent}15`
                     :`0 4px 32px rgba(0,0,0,0.06),0 0 50px ${accent}10`,
                   backgroundImage:`radial-gradient(ellipse 70% 45% at 8% 0%, ${accent}${dm?"08":"06"}, transparent)`,
                   ...style}}>
        {children}
      </div>
    );
  }

  function PHead({icon,label,sub,acc,end}:
    {icon:React.ReactNode;label:string;sub?:string;acc:string;end?:React.ReactNode}){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                   padding:"13px 22px",borderBottom:`1px solid ${tBorder}`,
                   background:`linear-gradient(90deg,${acc}10,transparent)`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {icon}
          <span style={{fontFamily:F_SANS,fontSize:11,fontWeight:700,color:tMid,
                        textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</span>
          {sub&&<span style={{fontFamily:F_MONO,fontSize:9,color:tFaint}}>{sub}</span>}
        </div>
        {end&&<div style={{display:"flex",alignItems:"center",gap:7}}>{end}</div>}
      </div>
    );
  }

  function LHead({icon,label,sub,end,accent}:
    {icon:React.ReactNode;label:string;sub?:string;end?:React.ReactNode;accent:string}){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                   padding:"15px 22px",borderBottom:`1px solid ${C.cardBorder}`,
                   background:dm?tHover:`linear-gradient(180deg,${C.card},${C.bg2}55)`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:10,background:`${accent}15`,
                       border:`1px solid ${accent}22`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {icon}
          </div>
          <div>
            <p style={{fontFamily:F_SANS,fontSize:12.5,fontWeight:700,color:C.ink}}>{label}</p>
            {sub&&<p style={{fontFamily:F_SANS,fontSize:11,color:C.dim,marginTop:1}}>{sub}</p>}
          </div>
        </div>
        {end&&<div style={{display:"flex",alignItems:"center",gap:7}}>{end}</div>}
      </div>
    );
  }

  return(
    <div style={{background:C.bg,fontFamily:F_SANS,color:C.ink,minHeight:"100vh",overflowX:"hidden",
                 transition:"background .3s,color .3s"}}>
      <style>{`
        @keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.8);opacity:0}}
        @keyframes drop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${AC_I}30}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:99px}
        input::placeholder{color:${dm?"rgba(255,255,255,.28)":"rgba(26,18,8,.35)"}}

        /* Glass Button */
        .glass-button-wrap{position:relative;display:inline-block;}
        .glass-button{
          all:unset;display:inline-flex;align-items:center;justify-content:center;
          position:relative;cursor:pointer;border-radius:9999px;
          background:rgba(255,255,255,0.18);
          border:1px solid rgba(255,255,255,0.38);
          backdrop-filter:blur(12px) saturate(180%);
          box-shadow:0 1px 2px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.55);
          transition:all .18s ease;
        }
        .glass-button:hover{
          background:rgba(255,255,255,0.28);
          box-shadow:0 4px 18px rgba(0,0,0,0.14),inset 0 1px 0 rgba(255,255,255,0.7);
          transform:translateY(-1px);
        }
        .glass-button:active{transform:translateY(0) scale(0.97);}
        .glass-button-text{
          position:relative;color:#fff;font-weight:600;letter-spacing:-0.02em;
          text-shadow:0 1px 2px rgba(0,0,0,0.18);
        }
        .glass-button-shadow{
          position:absolute;inset:0;border-radius:9999px;
          box-shadow:0 8px 24px -4px rgba(0,0,0,0.2);
          pointer-events:none;z-index:-1;
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════════ */}
      <nav style={{position:"sticky",top:0,zIndex:50,
                   background:dm?"rgba(15,13,32,0.92)":"rgba(255,255,255,0.88)",
                   backdropFilter:"blur(24px) saturate(180%)",
                   borderBottom:`1px solid ${C.cardBorder}`,transition:"background .3s"}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 36px",height:56,
                     display:"flex",alignItems:"center",justifyContent:"space-between"}}>

          {/* Left */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button style={{display:"flex",alignItems:"center",gap:5,fontFamily:F_SANS,
                            fontSize:12,color:C.mid,background:"none",border:"none",cursor:"pointer"}}>
              <ChevronRight size={12} style={{transform:"rotate(180deg)"}}/> Home
            </button>
            <span style={{width:1,height:16,background:C.cardBorder}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,fontFamily:F_SERIF,
                         fontStyle:"italic",fontWeight:300,fontSize:17,color:C.ink}}>
              <Shield size={16} style={{color:AC_I}}/> Sovereign
            </div>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:F_SANS,
                          fontSize:11.5,fontWeight:700,padding:"5px 13px",borderRadius:999,
                          background:AC_I,color:"#fff",
                          boxShadow:`0 4px 20px ${AC_I}55`}}>
              <Zap size={11}/> Guided demo
            </span>
          </div>

          {/* Centre tabs */}
          <div style={{display:"flex",gap:2,background:dm?"rgba(255,255,255,0.06)":"rgba(26,18,8,0.06)",
                       padding:3,borderRadius:999}}>
            {(["guided","howit"] as const).map(s=>(
              <button key={s} onClick={()=>setTab(s)} style={{
                fontFamily:F_SANS,fontSize:13,padding:"6px 18px",borderRadius:999,
                border:"none",cursor:"pointer",transition:"all .2s",
                background:tab===s ? (dm?"rgba(255,255,255,0.12)":"white") : "transparent",
                color:tab===s?C.ink:C.mid,fontWeight:tab===s?700:400,
                boxShadow:tab===s?"0 2px 8px rgba(0,0,0,0.1)":"none",
              }}>{s==="guided"?"Guided demo":"How it works"}</button>
            ))}
          </div>

          {/* Right */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {[
              {label:"On your Device",value:"live",         color:GREEN,bg:dm?"rgba(22,163,74,0.15)":"rgba(22,163,74,0.1)"},
              {label:"In the Cloud",  value:"external-only",color:BLUE, bg:dm?"rgba(29,78,216,0.15)":"rgba(29,78,216,0.09)"},
            ].map(p=>(
              <span key={p.label} style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:F_SANS,
                                          fontSize:11.5,fontWeight:500,padding:"6px 13px",borderRadius:999,
                                          color:p.color,background:p.bg,border:`1px solid ${p.color}28`,
                                          boxShadow:`0 0 18px ${p.color}20`}}>
                <Dot color={p.color}/> {p.label}: <b>{p.value}</b>
              </span>
            ))}
            <button onClick={()=>setWifi(v=>!v)} style={{
              display:"flex",alignItems:"center",gap:6,fontFamily:F_SANS,fontSize:12,fontWeight:600,
              padding:"6px 14px",borderRadius:999,cursor:"pointer",
              border:`1px solid ${wifi?C.cardBorder:RED+"45"}`,
              background:wifi?C.card:`${RED}10`,color:wifi?C.ink:RED,
              boxShadow:wifi?"0 2px 8px rgba(0,0,0,0.06)":`0 0 16px ${RED}30`,transition:"all .2s",
            }}>
              {wifi?<Wifi size={13}/>:<WifiOff size={13}/>}
              {wifi?"Wi-Fi ON":"Wi-Fi OFF"}
            </button>
            {/* Dark mode toggle */}
            <button onClick={()=>setDm(v=>!v)} style={{
              display:"flex",alignItems:"center",justifyContent:"center",
              width:36,height:36,borderRadius:999,cursor:"pointer",
              border:`1px solid ${C.cardBorder}`,
              background:dm?"rgba(255,255,255,0.08)":C.card,
              color:dm?"#F5D060":C.mid,
              boxShadow:dm?"0 0 16px rgba(245,208,96,0.2)":"0 2px 8px rgba(0,0,0,0.06)",
              transition:"all .2s",
            }}>
              {dm?<Sun size={15}/>:<Moon size={15}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{position:"relative",overflow:"hidden",maxWidth:1440,margin:"0 auto",padding:"72px 36px 20px"}}>
        <div style={{position:"absolute",top:-80,right:"8%",width:600,height:600,borderRadius:"50%",
                     background:`radial-gradient(circle,${AC_I}${dm?"18":"10"} 0%,transparent 65%)`,
                     pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:40,left:"4%",width:400,height:400,borderRadius:"50%",
                     background:`radial-gradient(circle,${GREEN}${dm?"10":"07"} 0%,transparent 65%)`,
                     pointerEvents:"none"}}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:60,alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,fontFamily:F_MONO,fontSize:10,
                         color:AC_I,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:20,
                         padding:"5px 14px",borderRadius:999,background:`${AC_I}12`,border:`1px solid ${AC_I}28`}}>
              <Dot color={AC_I} size={6}/> Womo Labs · Agentix · Patent Filed
            </div>
            <h1 style={{fontFamily:F_SERIF,fontWeight:300,letterSpacing:"-0.04em",
                        lineHeight:0.97,fontSize:"clamp(3.2rem,4.8vw,4.8rem)",marginBottom:24}}>
              <span style={{fontStyle:"italic",color:C.ink,display:"block"}}>Sovereign</span>
              <span style={{fontFamily:F_SANS,fontWeight:800,fontSize:"88%",color:C.ink}}>Hybrid</span>
              {" "}<span style={{fontFamily:F_SERIF,fontStyle:"italic",color:AC_I}}>Demo</span>
            </h1>
            <p style={{fontFamily:F_SANS,fontSize:15,color:C.mid,lineHeight:1.75,marginBottom:32,maxWidth:490}}>
              Two panes, one question.{" "}
              <span style={{color:GREEN,fontWeight:700}}>"On your Device"</span> sees confidential docs +
              external news (mingled).{" "}
              <span style={{color:BLUE,fontWeight:700}}>"In the Cloud"</span> sees only external
              knowledge — never your local data.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                {val:"100%",label:"data on-device",color:GREEN},
                {val:"0 bytes",label:"egressed",color:RED},
                {val:"~12 MB",label:"model delta",color:AC_I},
                {val:"SOC 2",label:"Type II",color:BLUE},
              ].map(s=>(
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",
                                           borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,
                                           boxShadow:`0 2px 10px rgba(0,0,0,${dm?.12:.04}),0 0 20px ${s.color}12`}}>
                  <span style={{fontFamily:F_SERIF,fontStyle:"italic",fontWeight:300,fontSize:22,
                                 letterSpacing:"-0.03em",color:s.color}}>{s.val}</span>
                  <span style={{fontFamily:F_SANS,fontSize:11,color:C.dim}}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrolling trust band */}
        <div style={{marginTop:36,overflow:"hidden",
                     maskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)"}}>
          <div style={{display:"flex",animation:"marquee 28s linear infinite",width:"max-content"}}>
            {[...Array(2)].map((_,k)=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:28,paddingRight:28}}>
                {["On-device inference","Zero egress enforced","DP-noised model deltas","TLS 1.3",
                  "SOC 2 Type II","HIPAA-eligible","Patent filed","Air-gap provable",
                  "Treasury desk ready","Compliance-auditable"].map(it=>(
                  <span key={it} style={{fontFamily:F_MONO,fontSize:11,color:C.dim,whiteSpace:"nowrap",
                                          display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:3,height:3,borderRadius:"50%",background:C.dim,opacity:.5}}/>
                    {it}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{maxWidth:1440,margin:"0 auto",padding:"24px 36px 80px",display:"flex",flexDirection:"column",gap:20}}>

        {/* ══ GLOBAL IMPACT GRAPH ══════════════════════════════════════════ */}
        <ImpactGraph dm={dm}/>

        {/* ══ SOVEREIGNTY CONTRACT ════════════════════════════════════════ */}
        <LightCard accent={AC_I}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                       padding:"16px 26px",borderBottom:`1px solid ${C.cardBorder}`,
                       background:dm?tHover:`linear-gradient(180deg,white,${L.bg}30)`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,background:`${GREEN}15`,border:`1px solid ${GREEN}22`,
                           display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Shield size={16} style={{color:GREEN}}/>
              </div>
              <div>
                <p style={{fontFamily:F_SANS,fontSize:13,fontWeight:700,color:C.ink}}>
                  The sovereignty contract — visualized
                </p>
                <p style={{fontFamily:F_MONO,fontSize:10,color:C.dim,marginTop:1}}>
                  One rule. No exceptions. Enforced at the network layer.
                </p>
              </div>
            </div>
            <span style={{fontFamily:F_MONO,fontSize:9,fontWeight:700,letterSpacing:"0.14em",
                          textTransform:"uppercase",padding:"5px 14px",borderRadius:999,
                          color:GREEN,background:`${GREEN}14`,border:`1px solid ${GREEN}28`,
                          boxShadow:`0 0 16px ${GREEN}28`}}>Patent Filed</span>
          </div>
          <div style={{padding:"22px 26px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr auto 1fr auto 1fr",gap:8,alignItems:"center"}}>
              {/* Outside World */}
              <ColBox color={C.mid} bg={dm?"rgba(255,255,255,0.04)":L.bg2} border={C.cardBorder}
                      icon={<Globe size={13}/>} label="Outside World" C={C}>
                {["Public news & filings","Market & macro feeds","Cloud model reasoning"].map(it=>(
                  <Row key={it} dot={C.dim} C={C}>{it}</Row>
                ))}
              </ColBox>
              <Arrow color={GREEN}/>
              {/* Allowed In */}
              <ColBox color={GREEN} bg={`${GREEN}08`} border={`${GREEN}25`} glow={`0 0 28px ${GREEN}20`}
                      icon={<ArrowRight size={13}/>} label="Allowed In" C={C}>
                <p style={{fontFamily:F_SANS,fontSize:11.5,color:C.mid,lineHeight:1.55}}>
                  Frontier-scale model runs locally. Reads the outside world and mingles with confidential data.
                </p>
                <Chip color={GREEN}>TLS · read-only</Chip>
              </ColBox>
              <Arrow color={GREEN}/>
              {/* On Device */}
              <ColBox color={GREEN} bg={`${GREEN}08`} border={`${GREEN}25`} glow={`0 0 28px ${GREEN}20`}
                      icon={<Monitor size={13}/>} label="On Your Device" live C={C}>
                {["Confidential data stays on device","Full model runs locally","Embeddings & gradients stay local"].map(it=>(
                  <Row key={it} dot={GREEN} C={C}>{it}</Row>
                ))}
              </ColBox>
              <Arrow color={RED} blocked/>
              {/* Blocked Out */}
              <ColBox color={RED} bg={`${RED}07`} border={`${RED}25`} glow={`0 0 28px ${RED}18`}
                      icon={<XCircle size={13}/>} label="Blocked Out" C={C}>
                <p style={{fontFamily:F_SANS,fontSize:11.5,color:C.mid,lineHeight:1.55}}>
                  No raw content exits. Enforced at the network layer — physical, not a policy.
                </p>
                <Chip color={RED}>zero egress</Chip>
              </ColBox>
              <Arrow color={RED} blocked/>
              {/* Private Data */}
              <ColBox color={C.mid} bg={dm?"rgba(255,255,255,0.04)":L.bg2} border={C.cardBorder}
                      icon={<Lock size={13}/>} label="Your Private Data" C={C}>
                {["Portfolio & deal docs","Client files, chats, notes","Never uploaded","Never synced"].map(it=>(
                  <Row key={it} dot={GREEN} check C={C}>{it}</Row>
                ))}
              </ColBox>
            </div>
            <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${C.cardBorder}`,
                         fontFamily:F_SANS,fontSize:13,color:C.mid,lineHeight:1.75}}>
              One rule boundary: outside knowledge flows <b style={{color:C.ink}}>in</b>, your confidential
              data never flows <b style={{color:RED}}>out</b>. Enforced at the OS → network layer on the device
              itself — not a policy, a physical property of the deployment.{" "}
              <b style={{color:GREEN}}>Patent filed</b> on this architecture.
            </div>
          </div>
        </LightCard>

        {/* ══ QUERY TABS + ASK BAR ════════════════════════════════════════ */}
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {MODES.map((m,i)=>{
              const mc = dm && m.color===PURPLE ? "#818CF8" : m.color;  /* black accent unreadable on dark */
              return(
              <button key={i} onClick={()=>setMode(i)} style={{
                display:"flex",alignItems:"center",gap:7,fontFamily:F_SANS,fontSize:13,
                fontWeight:mode===i?700:400,padding:"8px 18px",borderRadius:999,
                cursor:"pointer",transition:"all .18s",
                border:`1px solid ${mode===i?`${mc}38`:C.cardBorder}`,
                background:mode===i?`${mc}12`:C.card,
                color:mode===i?mc:C.mid,
                boxShadow:mode===i?`0 0 24px ${mc}28,0 2px 10px rgba(0,0,0,${dm?.2:.04})`
                                  :`0 1px 4px rgba(0,0,0,${dm?.15:.04})`,
              }}>
                <span style={{color:mode===i?mc:C.dim}}>{m.icon}</span>
                <span style={{color:C.dim,fontSize:11}}>{m.n}.</span>
                {m.label}
                {m.badge&&<span style={{fontFamily:F_MONO,fontSize:9,fontWeight:700,padding:"2px 7px",
                                         borderRadius:999,background:`${mc}18`,color:mc}}>{m.badge}</span>}
              </button>
            );})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14,fontFamily:F_MONO,fontSize:11.5,
                       color:C.dim,marginBottom:14,flexWrap:"wrap"}}>
            <span style={{color:C.mid,fontWeight:500}}>On-device model:</span>
            <span>Speed 2.5 · 23k → ~2k · 15k/s</span>
            <span style={{width:1,height:14,background:C.cardBorder}}/>
            <span>Llest 2.7 · 7k</span>
            <span style={{width:1,height:14,background:C.cardBorder}}/>
            <span>#: 40k / deep</span>
          </div>

          {/* Ask bar */}
          <TermPanel accent={AC_I}>
            <div style={{padding:"22px 26px 0"}}>
              <p style={{fontFamily:F_SANS,fontSize:14.5,color:tMid,marginBottom:16,lineHeight:1.5}}>
                About Agentix continual learning, how does Womolab support it?
              </p>
              <button onClick={()=>setWifi(v=>!v)} style={{
                display:"flex",alignItems:"center",gap:7,fontFamily:F_MONO,fontSize:11,
                padding:"5px 14px",borderRadius:999,cursor:"pointer",fontWeight:500,marginBottom:16,
                border:`1px solid ${wifi?(dm?"rgba(255,255,255,0.12)":C.cardBorder):RED+"55"}`,
                background:wifi?(dm?"rgba(255,255,255,0.07)":"rgba(26,18,8,0.04)"):`${RED}18`,
                color:wifi?tMid:AC_R,
              }}>
                {wifi?<Wifi size={11}/>:<WifiOff size={11}/>}
                {wifi?"Simulate Wi-Fi OFF (airplane mode)  ·  https://145.dp-agent-cn.pro"
                     :"Wi-Fi OFF — local mode active"}
              </button>
            </div>
            <div style={{display:"flex",gap:10,padding:"0 26px 22px",alignItems:"center"}}>
              <input value={query} onChange={e=>setQuery(e.target.value)}
                     onKeyDown={e=>e.key==="Enter"&&doSend()}
                     placeholder="Ask your documents anything..."
                     style={{flex:1,background:dm?T2:C.bg2+"66",borderRadius:14,
                             border:`1px solid ${dm?"rgba(255,255,255,0.09)":C.cardBorder}`,
                             padding:"13px 18px",outline:"none",
                             fontFamily:F_MONO,fontSize:13,color:tInk,
                             boxShadow:dm?"0 2px 12px rgba(0,0,0,0.3) inset":"0 1px 4px rgba(0,0,0,0.05) inset"}}/>
              <GlassButton onClick={doSend} size="default"
                style={{background:sent?`${GREEN}40`:`${AC_I}55`,
                        border:`1px solid ${sent?GREEN:AC_I}60`,fontFamily:F_SANS}}>
                {sent?"✓ Sent":"Ask both"}
              </GlassButton>
            </div>
          </TermPanel>
        </div>

        {/* ══ SPLIT PANELS ══════════════════════════════════════════════ */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <TermPanel accent={GREEN}>
            <PHead icon={<Monitor size={14} style={{color:AC_G}}/>}
                   label="On Your Device" sub="· MAC M3 MAX" acc={AC_G}
                   end={<><span style={{fontFamily:F_MONO,fontSize:10,color:tDim}}>7.1k tok · 361 T/s</span>
                         <Dot color={AC_G} size={7}/>
                         <span style={{fontFamily:F_MONO,fontSize:10,fontWeight:700,color:AC_G}}>LIVE</span></>}/>
            <div style={{padding:"18px 22px",fontFamily:F_SANS,fontSize:13,color:tMid,lineHeight:1.8}}>
              <p style={{marginBottom:12}}>
                Womo Labs supports the concept of governed continual learning for enterprise AI agents through
                its category thesis, which outlines a lifecycle operating model that includes evidence intake,
                risk scoring, update-layer routing, evaluation, approval, deployment, monitoring, and rollback.
              </p>
              <p style={{color:tDim,fontSize:12.5,marginBottom:14}}>
                This framework is grounded in research from classic and layer-model continual learning, retrieval
                and parameter-efficient adaptation research, and model-editing research. It is Agentix that acts
                specifically on the control plane for governed continual learning, deciding where new knowledge
                should be integrated — retrieval, scoped memory, prompt policy, tool workflow, or training.
              </p>
              <p style={{fontFamily:F_MONO,fontSize:10.5,color:tFaint}}>
                Sources: <span style={{color:AC_G}}>agentix_continual_learning_whitepaper.pdf</span> [local]
              </p>
            </div>
          </TermPanel>

          <TermPanel accent={BLUE}>
            <PHead icon={<Cloud size={14} style={{color:AC_B}}/>}
                   label="In the Cloud" sub="· AGENTIX GATEWAY" acc={AC_B}
                   end={<><EyeOff size={12} style={{color:AC_R}}/>
                         <span style={{fontFamily:F_MONO,fontSize:10,color:AC_R}}>Cannot see local documents</span></>}/>
            <div style={{padding:"18px 22px",fontFamily:F_SANS,fontSize:13,color:tMid,lineHeight:1.8}}>
              <p style={{marginBottom:12}}>
                Womolab supports Agentix continual learning as the{" "}
                <span style={{color:tInk,fontWeight:600}}>"controlled experimentation and improvement layer"</span>{" "}
                across all deployed agents:
              </p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8}}>
                {[["Captures learning signals","task outcomes, user corrections, tool failures, policy violations, performance drift"],
                  ["Creates test scenarios","converts signals into simulations without exporting protected enterprise data"],
                  ["Evaluates candidate improvements","compares prompts, workflows, retrieval strategies, and model-adapters"],
                  ["Governs promotion","only changes meeting accuracy, safety, and policy thresholds ship"],
                  ["Maintains provenance","records what changed, why, evidence used, approvals, rollback points"],
                ].map(([b,r])=>(
                  <li key={b} style={{display:"flex",gap:8,fontSize:12.5,color:tDim}}>
                    <span style={{color:AC_B,flexShrink:0}}>▸</span>
                    <span><span style={{color:tInk,fontWeight:600}}>{b}</span> — {r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TermPanel>
        </div>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
        {tab==="howit"&&(
          <section>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <span style={{fontFamily:F_MONO,fontSize:10,fontWeight:700,color:GREEN,
                            padding:"5px 14px",borderRadius:999,background:`${GREEN}12`,
                            border:`1px solid ${GREEN}28`,boxShadow:`0 0 16px ${GREEN}22`}}>HOW IT WORKS</span>
              <span style={{fontFamily:F_SANS,fontSize:12.5,color:C.mid}}>
                Boardroom mode · one screen · what leaves, what doesn't, what improves
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
              {[
                {tag:"Leaves the Mac",          tC:AMBER, head:"Only model deltas",
                 body:"~12 MB per round · weights, not data · DP-noised · TLS 1.3"},
                {tag:"Never Leaves the Mac",    tC:RED,   head:"Your documents",
                 body:"Raw text, embeddings, gradients on private text, retrieval hits. Enforced at the network layer."},
                {tag:"Zero Egress · Proven Live",tC:GREEN, head:"Turn WiFi off. Ask again.",
                 body:"Same answer, same box. Network log is empty. Your compliance team can watch it."},
              ].map(c=>(
                <TermPanel key={c.tag} accent={c.tC}>
                  <div style={{padding:"30px 26px 28px",
                               background:`linear-gradient(150deg,${c.tC}15 0%,transparent 55%)`}}>
                    <p style={{fontFamily:F_MONO,fontSize:9.5,fontWeight:700,color:c.tC,
                               textTransform:"uppercase",letterSpacing:"0.13em",marginBottom:24}}>{c.tag}</p>
                    <h2 style={{fontFamily:F_SERIF,fontStyle:"italic",fontWeight:300,
                               fontSize:"clamp(1.6rem,2.4vw,2.2rem)",letterSpacing:"-0.03em",
                               color:dm?"#F9FAFB":C.ink,lineHeight:1.1,marginBottom:18}}>{c.head}</h2>
                    <p style={{fontFamily:F_SANS,fontSize:13.5,color:tMid,lineHeight:1.7}}>{c.body}</p>
                  </div>
                  <div style={{height:3,background:`linear-gradient(90deg,${c.tC},transparent)`}}/>
                </TermPanel>
              ))}
            </div>
          </section>
        )}

        {/* ══ VAULT + PERIMETER ═══════════════════════════════════════════ */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <LightCard accent={AMBER}>
            <LHead icon={<FileText size={15} style={{color:AMBER}}/>} accent={AMBER}
                   label="Your Mac · Treasury Desk"
                   sub="Confidential corpus stays inside the perimeter."/>
            <div>
              {DOCS.map((doc,i)=>(
                <div key={doc.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                                            padding:"12px 22px",transition:"background .15s",cursor:"default",
                                            borderBottom:i<DOCS.length-1?`1px solid ${C.cardBorder}`:"none"}}
                  onMouseEnter={e=>(e.currentTarget.style.background=dm?"rgba(255,255,255,0.04)":"rgba(26,18,8,0.025)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                    <div style={{width:32,height:32,borderRadius:9,background:dm?"rgba(255,255,255,0.06)":L.bg2,
                                 display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <FileText size={14} style={{color:C.mid}}/>
                    </div>
                    <span style={{fontFamily:F_MONO,fontSize:12,color:C.ink,
                                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</span>
                  </div>
                  <span style={{fontFamily:F_MONO,fontSize:9,fontWeight:700,letterSpacing:"0.1em",
                                textTransform:"uppercase",padding:"3px 9px",borderRadius:999,flexShrink:0,
                                color:doc.cls==="RESTRICTED"?RED:AMBER,
                                background:doc.cls==="RESTRICTED"?`${RED}12`:`${AMBER}12`,
                                border:`1px solid ${doc.cls==="RESTRICTED"?RED:AMBER}28`}}>{doc.cls}</span>
                </div>
              ))}
            </div>
          </LightCard>

          <LightCard accent={RED}>
            <LHead icon={<AlertTriangle size={15} style={{color:RED}}/>} accent={RED}
                   label="Blocked at the Perimeter"
                   sub="Dropped at the network layer."
                   end={<><Dot color={RED} size={7}/>
                         <span style={{fontFamily:F_MONO,fontSize:10,fontWeight:700,color:RED}}>LIVE</span>
                         <RefreshCw size={11} style={{color:C.dim,animation:"spin 3s linear infinite"}}/></>}/>
            <div style={{maxHeight:256,overflowY:"auto"}}>
              {log.length===0
                ?<p style={{fontFamily:F_MONO,fontSize:12,color:C.dim,padding:20,textAlign:"center"}}>Monitoring…</p>
                :log.map((e,i)=>(
                  <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                                          padding:"9px 22px",borderBottom:`1px solid ${C.cardBorder}`,
                                          opacity:Math.max(0.2,1-i*0.09),
                                          animation:i===0?"drop .22s ease-out":undefined}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:F_MONO,fontSize:10,color:C.dim,width:52,flexShrink:0}}>{e.t}</span>
                      <span style={{fontFamily:F_MONO,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:999,flexShrink:0,
                                    color:e.m==="GET"?BLUE:e.m==="PUT"?AMBER:RED,
                                    background:e.m==="GET"?`${BLUE}12`:e.m==="PUT"?`${AMBER}12`:`${RED}12`,
                                    border:`1px solid ${e.m==="GET"?BLUE:e.m==="PUT"?AMBER:RED}28`}}>{e.m}</span>
                      <span style={{fontFamily:F_MONO,fontSize:11.5,color:C.mid,
                                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.p}</span>
                    </div>
                    <span style={{fontFamily:F_MONO,fontSize:9,fontWeight:700,letterSpacing:"0.08em",
                                  flexShrink:0,padding:"3px 10px",borderRadius:999,
                                  color:RED,background:`${RED}12`,border:`1px solid ${RED}28`}}>DROPPED</span>
                  </div>
                ))
              }
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                         padding:"11px 22px",borderTop:`1px solid ${C.cardBorder}`,
                         background:dm?"rgba(255,255,255,0.02)":"rgba(26,18,8,0.02)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:F_MONO,fontSize:11,color:C.dim}}>
                <TrendingDown size={12} style={{color:GREEN}}/>
                <b style={{color:C.ink}}>What actually leaves:</b>
                <span style={{padding:"2px 8px",borderRadius:999,background:`${AMBER}12`,color:AMBER,fontSize:10}}>weights only</span>
                <span>· ~12 MB · DP-noised · TLS</span>
              </div>
              <button style={{fontFamily:F_SANS,fontSize:12,color:C.mid,background:"none",border:"none",
                              cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                How does the global part work? <ArrowRight size={12}/>
              </button>
            </div>
          </LightCard>
        </div>

        {/* ══ EGRESS LOGGER ════════════════════════════════════════════════ */}
        <TermPanel accent={AC_I}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                       padding:"16px 24px",borderBottom:`1px solid ${tBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,background:"rgba(129,140,248,0.18)",
                           display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Server size={15} style={{color:AC_I}}/>
              </div>
              <span style={{fontFamily:F_SANS,fontSize:12,fontWeight:700,color:tMid,
                            textTransform:"uppercase",letterSpacing:"0.07em"}}>Egress Logger</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:F_MONO,fontSize:11,padding:"4px 14px",borderRadius:999,
                            color:AC_I,background:"rgba(129,140,248,0.14)",
                            border:"1px solid rgba(129,140,248,0.25)"}}>
                Sovereignty · 250 push-changed
              </span>
              <span style={{fontFamily:F_SANS,fontSize:12,color:tDim,cursor:"pointer"}}>
                Download JSON
              </span>
            </div>
          </div>
          {GW.map((g,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 24px",
                                  borderBottom:`1px solid ${tBorder}`,transition:"background .15s"}}
              onMouseEnter={e=>(e.currentTarget.style.background=tHover)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <span style={{fontFamily:F_MONO,fontSize:10,color:tDim,width:54,flexShrink:0}}>{g.t}</span>
              <span style={{fontFamily:F_MONO,fontSize:10,flexShrink:0,padding:"2px 9px",borderRadius:999,
                            color:g.src.startsWith("local")?AC_G:AC_B,
                            background:g.src.startsWith("local")?"rgba(74,222,128,0.12)":"rgba(96,165,250,0.12)",
                            border:`1px solid ${g.src.startsWith("local")?"rgba(74,222,128,0.22)":"rgba(96,165,250,0.22)"}`}}>
                {g.src}
              </span>
              <span style={{fontFamily:F_MONO,fontSize:11,color:AC_I,flexShrink:0}}>{g.svc}</span>
              <span style={{fontFamily:F_SANS,fontSize:13,color:tMid,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.a}</span>
            </div>
          ))}
        </TermPanel>

        {/* ══ METRICS ══════════════════════════════════════════════════════ */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[
            {label:"Documents Protected",     value:"5",       sub:"treasury desk",      color:GREEN,  icon:<Lock size={17}/>},
            {label:"Egress Attempts Blocked",  value:String(cnt),sub:"this session",     color:RED,    icon:<XCircle size={17}/>},
            {label:"Model Delta Size",         value:"~12 MB",  sub:"per training round", color:AC_I, icon:<Activity size={17}/>},
            {label:"Data Sovereignty",         value:"100%",    sub:"provably enforced",  color:BLUE,   icon:<Shield size={17}/>},
          ].map(m=>(
            <LightCard key={m.label} accent={m.color}>
              <div style={{padding:"22px 22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                  <span style={{fontFamily:F_MONO,fontSize:9.5,color:C.dim,textTransform:"uppercase",
                                letterSpacing:"0.1em",lineHeight:1.4,maxWidth:100}}>{m.label}</span>
                  <div style={{width:34,height:34,borderRadius:10,background:`${m.color}12`,
                               border:`1px solid ${m.color}22`,display:"flex",alignItems:"center",
                               justifyContent:"center",flexShrink:0}}>
                    <span style={{color:m.color}}>{m.icon}</span>
                  </div>
                </div>
                <div style={{fontFamily:F_SERIF,fontStyle:"italic",fontWeight:300,
                             fontSize:"2.6rem",letterSpacing:"-0.04em",color:m.color,lineHeight:1}}>
                  {m.value}
                </div>
                <div style={{fontFamily:F_SANS,fontSize:12,color:C.dim,marginTop:10}}>{m.sub}</div>
              </div>
            </LightCard>
          ))}
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                     paddingTop:32,borderTop:`1px solid ${C.cardBorder}`,flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:`${AC_I}14`,border:`1px solid ${AC_I}22`,
                         display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={15} style={{color:AC_I}}/>
            </div>
            <span style={{fontFamily:F_SERIF,fontStyle:"italic",fontWeight:300,fontSize:20,color:C.ink}}>Sovereign</span>
            <span style={{fontFamily:F_MONO,fontSize:10,color:C.dim}}>Womo Labs · Patent Filed · © 2026</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:24,fontFamily:F_SANS,fontSize:13,color:C.mid}}>
            {["Agentix Gateway","Whitepaper","Security Architecture","Careers"].map(l=>(
              <span key={l} style={{cursor:"pointer"}}
                    onMouseEnter={e=>(e.currentTarget.style.color=C.ink)}
                    onMouseLeave={e=>(e.currentTarget.style.color=C.mid)}>{l}</span>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Dot color={GREEN} size={7}/>
              <span style={{color:GREEN,fontWeight:700}}>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared atoms ───────────────────────────────────────────────────────── */
function Arrow({color,blocked}:{color:string;blocked?:boolean}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      {blocked
        ?<XCircle size={16} style={{color,opacity:.55}}/>
        :<ArrowRight size={16} style={{color,opacity:.7}}/>}
    </div>
  );
}
function ColBox({icon,label,color,bg,border,glow,live,children,C}:
  {icon:React.ReactNode;label:string;color:string;bg:string;border:string;glow?:string;
   live?:boolean;children:React.ReactNode;C:typeof L}){
  return(
    <div style={{borderRadius:14,padding:"14px 14px",background:bg,
                 border:`1px solid ${border}`,boxShadow:glow}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        {live&&<Dot color={color} size={6}/>}
        <span style={{color}}>{icon}</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color,
                      textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>{children}</div>
    </div>
  );
}
function Row({dot,check,C,children}:{dot:string;check?:boolean;C:typeof L;children:React.ReactNode}){
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
      {check
        ?<CheckCircle size={10} style={{color:dot,flexShrink:0,marginTop:2}}/>
        :<span style={{width:4,height:4,borderRadius:"50%",background:dot,flexShrink:0,marginTop:6,opacity:.55}}/>}
      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:C.mid,lineHeight:1.45}}>{children}</span>
    </div>
  );
}
function Chip({color,children}:{color:string;children:React.ReactNode}){
  return(
    <span style={{display:"inline-flex",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,
                  color,padding:"3px 9px",borderRadius:999,background:`${color}12`,
                  border:`1px solid ${color}22`,marginTop:8}}>{children}</span>
  );
}
