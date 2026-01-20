import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { hierarchy, pack } from "d3-hierarchy";

/** Zoomable Focus-Radial v2
 *  - авто-fit, drag-to-pan, wheel-zoom (к курсору), doubleclick reset
 *  - фокус в центре + дети по окружности
 *  deps: npm i d3 framer-motion
 */

const DATA = {
  name: "Страны",
  children: [
    {
      name: "Kyrgyzstan",
      children: [
        { name: "Adam Smith", children: [{ name: "Patrick" }, { name: "Ivan" }, { name: "Nurbek" }, { name: "Isaac" }] },
        { name: "John", children: [{ name: "Nick" }] },
      ],
    },
    { name: "Kazakhstan", children: [{ name: "Askar", children: [{ name: "Ali" }] }, { name: "Diana" }] },
    { name: "Uzbekistan" },
    { name: "Russia" },
  ],
};

function useSize(ref) {
  const [s, set] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect; set({ width: r.width, height: r.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

// кривые «стебли» + укорачивание, чтобы не входили в круги
function shrink(x1,y1,x2,y2,p1=0,p2=0){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;return{ x1:x1+ux*p1,y1:y1+uy*p1,x2:x2-ux*p2,y2:y2-uy*p2 }; }
function quadPath(x1,y1,x2,y2,k=0.14){const mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,nx=-dy,ny=dx,nl=Math.hypot(nx,ny)||1,ux=nx/nl,uy=ny/nl,off=Math.hypot(dx,dy)*k;return`M ${x1},${y1} Q ${mx+ux*off},${my+uy*off} ${x2},${y2}`;}
function radial(children, R, start=-Math.PI/2){
  const n = Math.max(children.length,1);
  const step = (Math.PI*2)/(n===2?3:n);
  return children.map((c,i)=>({ node:c, angle:start+i*step, x:R*Math.cos(start+i*step), y:R*Math.sin(start+i*step) }));
}

export default function ZoomablePacking(){
  const ref = useRef(null);
  const { width, height } = useSize(ref);

  // весы из pack (только как относительные величины)
  const root = useMemo(() => {
    const h = hierarchy(DATA).sum(d => (d.children ? Math.max(1,d.children.length) : 1));
    return pack().padding(10).size([1000,1000])(h); // размер фиктивный — используем только d.r как вес
  }, []);

  const [focus, setFocus] = useState(null);
  useEffect(()=>{ if(root) setFocus(root); },[root]);

  // размеры сцены от экрана, а не от pack
  const minSide = Math.max(1, Math.min(width||0, height||0));
  const depth = focus?.depth ?? 0;
  const focusR = Math.max(minSide * (depth===0?0.24:depth===1?0.22:0.20), 120); // фокус всегда крупный
  const children = focus?.children || [];
  const maxWeight = children.reduce((m,c)=>Math.max(m, c.r||1), 1);
  const childBase = Math.min(Math.max(minSide*0.11, 70), 180);
  const childRadius = (c)=> childBase * (0.75 + 0.25 * ((c.r||1)/maxWeight));
  const childMax = children.length ? Math.max(...children.map(childRadius)) : 0;

  const ringR   = focusR + childMax + 64;         // расстояние до кольца детей
  const sceneR  = ringR + childMax + 36;          // радиус всей сцены (для fit)
  const placed  = radial(children, ringR);

  // ==== камера (пан/зум) ====
  const minScale = width && height ? Math.min(width, height)/(2*sceneR) * 0.95 : 1;
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });

  // при смене фокуса/экрана — авто-fit по центру
  useEffect(()=>{
    if(!width||!height) return;
    setView({ x: width/2, y: height/2, k: Math.max(minScale, 0.01) });
  }, [width, height, focus, minScale]);

  // drag
  const drag = useRef(null);
  function onPointerDown(e){ drag.current={x:e.clientX,y:e.clientY}; (e.target).setPointerCapture?.(e.pointerId); }
  function onPointerMove(e){
    if(!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = {x:e.clientX,y:e.clientY};
    setView(v => ({...v, x: v.x + dx, y: v.y + dy}));
  }
  function onPointerUp(){ drag.current=null; }

  // wheel zoom к курсору
  function onWheel(e){
    e.preventDefault();
    const { clientX, clientY, deltaY } = e;
    const zoom = Math.exp(-deltaY * 0.0015);
    setView(v=>{
      const nk = Math.min(6, Math.max(minScale*0.9, v.k * zoom));
      // фиксируем точку под курсором
      const wx = (clientX - v.x) / v.k;   // world x до зума
      const wy = (clientY - v.y) / v.k;
      const nx = clientX - wx * nk;
      const ny = clientY - wy * nk;
      return { x: nx, y: ny, k: nk };
    });
  }

  function resetView(){ if(width&&height) setView({ x: width/2, y: height/2, k: Math.max(minScale,0.01) }); }

  // transform группы: переносим (0,0) в центр экрана и масштабируем
  const transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;

  return (
    <div
      ref={ref}
      style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", background:"#0f172a" }}
      onDoubleClick={resetView}
    >
      {/* UI */}
      <div style={{position:"absolute", inset:0, pointerEvents:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:16,color:"rgba(255,255,255,.85)"}}>
          <div style={{display:"flex",gap:8,pointerEvents:"auto"}}>
            <button onClick={()=>setFocus(root)} style={btn}>Страны</button>
            {focus && focus!==root && <button onClick={()=>setFocus(focus.parent||root)} style={btn}>Назад</button>}
            <button onClick={resetView} style={btn}>Fit</button>
          </div>
          <div style={{opacity:.8,fontSize:12}}>{focus?.data?.name||"—"}</div>
        </div>
        <div style={{position:"absolute",left:0,right:0,bottom:8,textAlign:"center",color:"rgba(255,255,255,.6)",fontSize:12}}>
          Колёсиком — зум, зажми и тяни — панорама, двойной клик — Fit.
        </div>
      </div>

      {/* BG */}
      <Background />

      {/* Сцена (в собственной системе координат: центр = (0,0)) */}
      <svg
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", touchAction:"none", cursor: drag.current ? "grabbing" : "grab" }}
      >
        <motion.g animate={{ transform }} transition={{ type:"spring", stiffness:120, damping:24 }}>
          {/* стебли */}
          {placed.map(p => {
            const rChild = childRadius(p.node);
            const seg = shrink(0,0,p.x,p.y, focusR, rChild+6);
            const d = quadPath(seg.x1,seg.y1,seg.x2,seg.y2, .12);
            return <path key={`stem-${p.node.data.name}`} d={d} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={1.6} />;
          })}

          {/* фокус */}
          <g>
            <circle r={focusR+10} fill="none" stroke="rgba(168,85,247,.35)" strokeWidth={2}/>
            <motion.circle r={focusR} fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.65)" strokeWidth={2}
              animate={{ filter:"drop-shadow(0 0 18px rgba(168,85,247,.45))" }} />
            <text textAnchor="middle" dy=".35em" fill="#fff"
              fontSize={Math.max(16, Math.min(32, focusR/2.6))}
              style={{userSelect:"none",pointerEvents:"none",fontWeight:600}}>
              {focus?.data?.name}
            </text>
          </g>

          {/* дети на кольце */}
          {placed.map(p=>{
            const d = p.node;
            const r = childRadius(d);
            return (
              <g key={d.data.name} transform={`translate(${p.x},${p.y})`}
                 onClick={(e)=>{ e.stopPropagation(); if(d.children) setFocus(d); }}>
                <circle r={r} fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.38)" strokeWidth={1.6}/>
                {r>12 && <text textAnchor="middle" dy=".35em" fill="#fff"
                               fontSize={Math.max(10, Math.min(18, r/3))}
                               style={{userSelect:"none",pointerEvents:"none"}}>{d.data.name}</text>}
              </g>
            );
          })}
        </motion.g>
      </svg>
    </div>
  );
}

const btn = { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)", color:"#fff", padding:"6px 10px", borderRadius:999 };

function Background(){
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:
        "radial-gradient(1100px 600px at 70% 20%, rgba(99,102,241,.24), transparent 60%),"+
        "radial-gradient(900px 500px at 20% 70%, rgba(236,72,153,.24), transparent 60%),"+
        "linear-gradient(180deg,#0f172a,#020617)"}}/>
      <div style={{position:"absolute",inset:0,opacity:.12,mixBlendMode:"screen",
        backgroundImage:"repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.15) 0 1px, transparent 2px 100px)"}}/>
    </div>
  );
}
