// App.jsx (пример)
import { Routes, Route } from "react-router-dom";
import GlassLayout from "./layouts/GlassLayout"
import ZoomablePacking from "./components/ZoomablePacking";
import MissionPage from "./pages/MissionPage";
import WhoAreWe from "./pages/WhoAreWe";

export default function App() {
  return (
    <Routes>
      <Route element={<GlassLayout />}>
        <Route path="/" element={<ZoomablePacking />} />
        <Route path="/mission" element={<MissionPage />} />
        <Route path="/whoarewe" element={<WhoAreWe/>}/>

     

        
        

      </Route>
    </Routes>
  );
}


