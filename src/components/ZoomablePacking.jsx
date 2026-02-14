import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { hierarchy, pack } from "d3-hierarchy";

/** Focus-Radial v2.3 (multiline text) */

const DATA = {
  name: "Countries",
  children: [
    {
      name: "Kyrgyzstan",
      children: [
        { 
          name: "Aitbek", 
          email: "aitbeksamatov@n20i.org", 
          phone: "6164130046", 
          children: [{ name: "Erlan" }, { name: "Einar" }, { name: "Chyngyz" }, { name: "Samu" }] 
        },
        { 
          name: "Murzaev Erlan", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Jumaliev Musa" }, { name: "Belekov Kaniet" }, { name: "Amankulov Nurbek" }] 
        },
        { 
          name: "Belekov Kaniet", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Narbaev Musa" }] 
        },
        { 
          name: "Sultanaliev Rinat", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Aitbekov Ismail" }, { name: "Taalaibekov Aizek" }] 
        },
        { 
          name: "Kenchibaev Ashat", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Belekov Kerim" }, { name: "Belekov Eljan" }] 
        },
        { 
          name: "Kiyaz Pak", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Bataev Marles" }, { name: "Ergeshov Eldar" }] 
        }, { 
          name: "Kenchevaev Adilet", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Rainbekov Turat" }] 
        },
        { 
          name: "Akmataliev Nurdamir", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Sultanbekov Nuramil" }] 
        },
        { 
          name: "Baktybekov Kutnazar", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Nurlan uulu Daniel" }] 
        },
        { 
          name: "Omurov Maksat", 
          email: "null", 
          phone: "null", 
          children: [{ name: "Akunov Samyibek" }] 
        },
        { 
          name: "Jusup Erkin uulu", 
          email: "josephturganbekov@gmail.com", 
          phone: "0500046141", 
          children: [{ name: "Erbol" }, { name: "Daniel" }] 
        },
        { 
          name: "Jusup", 
          email: "blkv.jumanji@mail.com", 
          phone: "0709916965", 
          children: [{ name: "Uluk" }, { name: "Eldar" }, { name: "Musa" }, { name: "Ukubaev Musa" }, { name: "Eljan" }] 
        },
        { 
          name: "Azamat", 
          email: "ssskgz11@gmail.com", 
          phone: "0706678876", 
          children: [{ name: "Aman" }, { name: "Huseyn" }, { name: "Samuel" }, { name: "Aizek" }] 
        },
        { 
          name: "Amir", 
          email: "amir@n20i.org", 
          phone: "0222002227", 
          children: [{ name: "Example" }] 
        },
        { 
          name: "Chyngyz", 
          email: "chyngyztokbaev@gmail.com", 
          phone: "0554241198", 
          children: [{ name: "Urmat (need update)" }, { name: "Janysh (need update)" }, { name: "Almaz (need update)" }] 
        },
        { 
          name: "Isken", 
          email: "moldobaeviska@gmail.com", 
          phone: "0555599366", 
          children: [{ name: "Ayan" }, { name: "Daniil" }, { name: "Isaac" }, { name: "Emir" }] 
        },
        { 
          name: "Austin", 
          email: "reachreachreach@outlook.com", 
          phone: "0555954492", 
          children: [{ name: "Ahmad" }, { name: "Gabriel" }] 
        },
        { 
          name: "Baktybek", 
          email: "sbaktybek@gmail.com", 
          phone: "0995272798", 
          children: [{ name: "Erkin" }, { name: "Ilyaz" }, { name: "Chynarbek" }] 
        }
      ],
    },
    { name: "Kazakhstan", children: [{ name: "Bolat", email: "amangeldievbolat63@gmail.com", children: [{ name: "Nursultan" }, { name: "Daniyal" }, { name: "In progress.." }] }] },
    { name: "Uzbekistan", children: [{ name: "Paul", email: "levapyaguy@gmail.com", children: [{ name: "Ildar" }, { name: "Victor" }, { name: "Kostya" }] }] },
    { name: "Russia" },
  ],
};

function useSize(ref) {
  const [s, set] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      set({ width: r.width, height: r.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

function shrink(x1,y1,x2,y2,p1=0,p2=0){
  const dx=x2-x1, dy=y2-y1, l=Math.hypot(dx,dy)||1, ux=dx/l, uy=dy/l;
  return { x1:x1+ux*p1, y1:y1+uy*p1, x2:x2-ux*p2, y2:y2-uy*p2 };
}
function quadPath(x1,y1,x2,y2,k=0.14){
  const mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1;
  const nx=-dy, ny=dx, nl=Math.hypot(nx,ny)||1, ux=nx/nl, uy=ny/nl;
  const off=Math.hypot(dx,dy)*k;
  return `M ${x1},${y1} Q ${mx+ux*off},${my+uy*off} ${x2},${y2}`;
}
function radial(children, R, start=-Math.PI/2){
  const n=Math.max(children.length,1);
  const step=(Math.PI*2)/(n===2?3:n);
  return children.map((c,i)=>({ node:c, x:R*Math.cos(start+i*step), y:R*Math.sin(start+i*step) }));
}

function MenuButton({ open, onToggle }) {
  const GAP = 6; const W = 22; const H = 2;
  const lineStyle = (offsetPx, rotateDeg = 0) => ({
    position: "absolute", width: W, height: H, borderRadius: 2, background: "#fff",
    left: "50%", top: "50%", transform: `translate(-50%, -50%) translateY(${offsetPx}px) rotate(${rotateDeg}deg)`,
    transformOrigin: "center", transition: "transform 200ms ease, opacity 150ms ease",
  });
  return (
    <button onClick={onToggle} style={{ width: 40, height: 40, borderRadius: 9999, display: "grid", placeItems: "center", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(8px)", cursor: "pointer" }}>
      <div style={{ position: "relative", width: W, height: 18 }}>
        <span style={open ? lineStyle(0, 45) : lineStyle(-GAP, 0)} />
        <span style={{ ...lineStyle(0, 0), opacity: open ? 0 : 1 }} />
        <span style={open ? lineStyle(0, -45) : lineStyle(GAP, 0)} />
      </div>
    </button>
  );
}

export default function ZoomablePacking(){
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { width, height } = useSize(containerRef);

  const root = useMemo(() => {
    const h = hierarchy(DATA).sum(d => (d.children ? Math.max(1, d.children.length) : 1));
    return pack().padding(10).size([1000,1000])(h);
  }, []);

  const [focus, setFocus]       = useState(null);
  const [hovered, setHovered]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { if (root) setFocus(root); }, [root]);

  const minSide = Math.max(1, Math.min(width||0, height||0));
  const depth   = focus?.depth ?? 0;
  const focusR  = Math.max(minSide * (depth===0 ? 0.24 : depth===1 ? 0.22 : 0.20), 120);

  const children = focus?.children || [];
  const maxW     = children.reduce((m,c)=>Math.max(m, c.r||1), 1);
  const childBase= Math.min(Math.max(minSide*0.11, 70), 180);
  const childR   = (c)=> childBase * (0.75 + 0.25 * ((c.r||1)/maxW));
  const childMax = children.length ? Math.max(...children.map(childR)) : 0;
  const ringR    = focusR + childMax + 64;
  const sceneR   = ringR + childMax + 36;
  const placed   = radial(children, ringR);

  const minScale = width && height ? Math.min(width, height)/(2*sceneR) * 0.95 : 1;
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    if (!width || !height) return;
    setView({ x: width/2, y: height/2, k: Math.max(minScale, 0.01) });
  }, [width, height, focus, minScale]);

  const drag = useRef(null);
  function onPointerDown(e){ drag.current = { active:false, id:e.pointerId, target:e.currentTarget, x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY }; }
  function onPointerMove(e){
    const d = drag.current; if (!d) return;
    const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
    if (!d.active && moved > 4) { d.active = true; d.target.setPointerCapture?.(d.id); }
    if (d.active) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.x = e.clientX; d.y = e.clientY;
      setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  }
  function onPointerUp(){ const d = drag.current; if (d?.active) d.target.releasePointerCapture?.(d.id); drag.current = null; }

  function onWheel(e){
    e.preventDefault();
    const { clientX, clientY, deltaY } = e;
    const zoom = Math.exp(-deltaY * 0.0015);
    setView(v => {
      const nk = Math.min(6, Math.max(minScale*0.9, v.k * zoom));
      const wx = (clientX - v.x) / v.k, wy = (clientY - v.y) / v.k;
      return { x: clientX - wx*nk, y: clientY - wy*nk, k: nk };
    });
  }
  function resetView(){ if (width && height) setView({ x: width/2, y: height/2, k: Math.max(minScale, 0.01) }); }

  const transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;

  return (
    <div ref={containerRef} style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", background:"#0f172a" }} onDoubleClick={resetView}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:30 }}>
        <div style={{ display:"flex", justifyContent:"space-between", padding:16, color:"rgba(255,255,255,.85)" }}>
          <div style={{ display:"flex", gap:8, pointerEvents:"auto" }}>
            <button onClick={()=>{ setFocus(root); setSelected(null); resetView(); }} style={btn}>Страны</button>
            {focus && focus!==root && (
              <button onClick={()=>{ setFocus(focus.parent||root); setSelected(null); resetView(); }} style={btn}>Назад</button>
            )}
            <button onClick={resetView} style={btn}>Fit</button>
            <MenuButton open={menuOpen} onToggle={()=>setMenuOpen(v=>!v)} />
          </div>
        </div>

        {menuOpen && (
          <div style={{ position:"absolute", left:16, top:64, zIndex:40, pointerEvents:"auto", background:"rgba(255,255,255,.10)", border:"1px solid rgba(255,255,255,.22)", backdropFilter:"blur(10px)", color:"#fff", borderRadius:12, padding:10, minWidth:180, boxShadow:"0 10px 30px rgba(0,0,0,.35)" }}>
            <button style={itemBtn}>Профиль</button>
            <button style={itemBtn} onClick={() => navigate("/mission")}>Наша Миссия</button>
          </div>
        )}
      </div>

      <svg onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel} style={{ position:"absolute", inset:0, width:"100%", height:"100%", touchAction:"none", cursor: drag.current ? "grabbing" : "grab" }}>
        <motion.g animate={{ transform }} transition={{ type:"spring", stiffness:120, damping:24 }}>
          {placed.map(p => {
            const rChild = childR(p.node);
            const seg = shrink(0,0,p.x,p.y, focusR, rChild+6);
            const d   = quadPath(seg.x1,seg.y1,seg.x2,seg.y2,.12);
            const active = hovered === p.node || selected === p.node;
            return <path key={`stem-${p.node.data.name}`} d={d} fill="none" stroke={active ? "rgba(255,255,255,.65)" : "rgba(255,255,255,.28)"} strokeWidth={active?2.2:1.6}/>
          })}

          <g>
            <circle r={focusR+10} fill="none" stroke="rgba(168,85,247,.35)" strokeWidth={2}/>
            <motion.circle r={focusR} fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.65)" strokeWidth={2} animate={{ filter:"drop-shadow(0 0 18px rgba(168,85,247,.45))" }} />
            <text textAnchor="middle" dy=".35em" fill="#fff" fontSize={Math.max(16, Math.min(32, focusR/2.6))} style={{ userSelect:"none", pointerEvents:"none", fontWeight:600 }}>
              {focus?.data?.name}
            </text>
          </g>

          {placed.map(p=>{
            const d = p.node; const r = childR(d);
            const isH = hovered === d; const isS = selected === d;
            const stroke = isS ? "rgba(255,255,255,.95)" : isH ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.38)";
            
            // Данные для многострочного вывода
            const name = d.data.name;
            const email = d.data.email;
            const phone = d.data.phone;

            return (
              <g key={d.data.name} transform={`translate(${p.x},${p.y})`}
                 onMouseEnter={()=>setHovered(d)} onMouseLeave={()=>setHovered(h=>h===d?null:h)}
                 onClick={(e)=>{ e.stopPropagation(); setSelected(d); setFocus(d); }}
                 style={{ cursor:"pointer" }}>
                <motion.circle r={r} fill="rgba(255,255,255,.06)" stroke={stroke} strokeWidth={isS ? 2.6 : 1.6}
                               initial={false} animate={{ scale:(isH||isS)?1.04:1 }}
                               transition={{ type:"spring", stiffness:300, damping:20, mass:.3 }}/>
                
                {/* МНОГОСТРОЧНЫЙ ТЕКСТ */}
                {r > 30 && (
                  <text textAnchor="middle" fill="#fff" style={{ userSelect:"none", pointerEvents:"none" }}>
                    {/* Имя */}
                    <tspan x="0" dy={email ? "-0.6em" : "0.35em"} fontWeight="bold" fontSize={Math.max(11, Math.min(16, r/4))}>
                      {name}
                    </tspan>
                    {/* Email (если есть) */}
                    {email && (
                      <tspan x="0" dy="1.2em" fill="rgba(255,255,255,0.7)" fontSize={Math.max(9, Math.min(12, r/5))}>
                        {email}
                      </tspan>
                    )}
                    {/* Телефон (если есть) */}
                    {phone && (
                      <tspan x="0" dy="1.2em" fill="rgba(255,255,255,0.5)" fontSize={Math.max(9, Math.min(11, r/6))}>
                        {phone}
                      </tspan>
                    )}
                  </text>
                )}
              </g>
            );
          })}
        </motion.g>
      </svg>
    </div>
  );
}

const btn = { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)", color:"#fff", padding:"6px 10px", borderRadius:999, cursor:"pointer", pointerEvents:"auto" };
const itemBtn = { display:"block", width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:10, background:"transparent", color:"#fff", border:"none", cursor:"pointer" };