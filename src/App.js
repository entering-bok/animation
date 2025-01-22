import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

import HouseScene from "./components/HouseScene";
import LanternScene from "./components/LanternScene";
import DailyLuckScene from "./components/dailyLuckScene";

function App() {
    return (
        <Router>
        <div>
            <Routes>
                <Route path="/" element={<HouseScene />} />
                <Route path="/lantern" element={<LanternScene />} />
                <Route path="/dailyluck" element={<DailyLuckScene />} />
            </Routes>
        </div>
    </Router>
    );
}

export default App;