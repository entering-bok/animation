import React from "react";
// import { Routes, Route } from "react-router-dom";

// 개발용
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import OAuthCallback from "../pages/OAuthCallback";
import GameMainPage from "../pages/GameMainPage";
import SettingsPage from "../components/SettingsPage";
import RulePage from "../pages/RulePage";
import RuleNextPage from "../pages/RuleNextPage";
import MainPage from "../pages/MainPage";
import RecordPage from "../pages/RecordPage";
import RecordDetailPage from "../pages/RecordDetailPage";
import DeadTextPage from "../pages/DeadTextPage";
import CCTVMonitor from "../pages/CCTVMonitor";
import FiredTextPage from "../pages/FiredTextPage";
import WinPage from "../pages/WinPage";

function RoutesIndex({ onPlayBgm }) {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<MainPage onPlayBgm={onPlayBgm} />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/:id" element={<RecordDetailPage />} />
        <Route path="/game" element={<GameMainPage />} />
        <Route path="/auth/kakao/callback" element={<OAuthCallback />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/rule" element={<RulePage />} />
        <Route path="/rulenext" element={<RuleNextPage />} />
        <Route path="/cctv" element={<CCTVMonitor />} />
        <Route path="/deadtext" element={<DeadTextPage />} />
        <Route path="/firedtext" element={<FiredTextPage />} />
        <Route path="/win" element={<WinPage />} />
        {/* 필요한 라우트 추가 */}
      </Routes>
    </div>
  );
}

export default RoutesIndex;
