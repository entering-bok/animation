import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

import HouseScene from "./components/HouseScene";
import LanternScene from "./components/LanternScene";
import DailyLuckScene from "./components/dailyLuckScene";
import ConversationScene from "./components/conversationScene";

function App() {
    return (
        <Router>
        <div>
            <Routes>
                <Route path="/" element={<HouseScene />} />
                <Route path="/lantern" element={<LanternScene />} />
                <Route path="/dailyluck" element={<DailyLuckScene />} />
                <Route path="/conversation/:id1/:id2" element={<ConversationScene />} />
            </Routes>
        </div>
    </Router>
    );
}

export default App;