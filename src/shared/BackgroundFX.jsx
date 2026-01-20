export default function BackgroundFX() {
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
