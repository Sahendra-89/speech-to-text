import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Menu,
  Volume2,
  Radio,
  Cpu,
  Clock,
  Mic,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import DashboardOverview from "./components/DashboardOverview";
import AudioRecorder from "./components/AudioRecorder";
import AudioUploader from "./components/AudioUploader";
import History from "./pages/History";
import SettingsView from "./components/SettingsView";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function App() {
  const [activeView, setActiveView] = useState("overview"); // 'overview' | 'live' | 'upload' | 'history' | 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecordingLive, setIsRecordingLive] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);

  // Initialize Socket.io client
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("connect_error", (err) => {
      setSocketConnected(false);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isRecordingLive={isRecordingLive}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition lg:hidden"
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white capitalize">
                {activeView === "overview"
                  ? "Dashboard Overview"
                  : activeView === "live"
                  ? "New Live Recording"
                  : activeView === "upload"
                  ? "Upload Audio File"
                  : activeView === "history"
                  ? "Transcription History"
                  : "Settings & System Status"}
              </span>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3">
            {isRecordingLive && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
                <Radio className="h-3 w-3" /> LIVE STREAMING
              </span>
            )}

            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  socketConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="hidden sm:inline">
                {socketConnected ? "Backend Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {activeView === "overview" && (
            <DashboardOverview onNavigate={(view) => setActiveView(view)} />
          )}

          {activeView === "live" && (
            <AudioRecorder
              socket={socketRef.current}
              onRecordingStateChange={(isRec) => setIsRecordingLive(isRec)}
            />
          )}

          {activeView === "upload" && (
            <AudioUploader onTranscriptionSaved={() => {}} />
          )}

          {activeView === "history" && (
            <History onNavigateToNew={() => setActiveView("live")} />
          )}

          {activeView === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
