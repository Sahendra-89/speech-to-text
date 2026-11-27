import { useState, useEffect } from "react";
import {
  Server,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function SettingsView() {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendMessage, setBackendMessage] = useState("");
  const [aiStatus, setAiStatus] = useState("checking");
  const [aiMessage, setAiMessage] = useState("");
  const [isPinging, setIsPinging] = useState(false);

  const checkHealth = async () => {
    setIsPinging(true);
    setBackendStatus("checking");
    setAiStatus("checking");

    // 1. Check Node Backend Health
    try {
      const res = await fetch("http://localhost:5000/health");
      const data = await res.json();
      if (res.ok) {
        setBackendStatus("online");
        setBackendMessage(data.message || "Online and responding");
      } else {
        setBackendStatus("error");
        setBackendMessage(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      setBackendStatus("offline");
      setBackendMessage("Unreachable at http://localhost:5000");
    }

    // 2. Check Python AI Service Health
    try {
      const res = await fetch("http://localhost:8000/health");
      const data = await res.json();
      if (res.ok) {
        setAiStatus("online");
        setAiMessage(data.status || "FastAPI is running");
      } else {
        setAiStatus("error");
        setAiMessage(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      setAiStatus("offline");
      setAiMessage("Unreachable at http://localhost:8000");
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Settings & Status</h2>
          <p className="text-sm text-slate-400 mt-1">
            Service topology, environment endpoints, and live health diagnostics.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={isPinging}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`h-4 w-4 ${isPinging ? "animate-spin" : ""}`} /> Ping Services
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node.js Backend */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Node.js Express Backend</h3>
                <p className="text-xs text-slate-400">Port 5000 • REST API & Socket.IO</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                backendStatus === "online"
                  ? "bg-emerald-950/80 border border-emerald-800 text-emerald-400"
                  : backendStatus === "checking"
                  ? "bg-slate-800 text-slate-400"
                  : "bg-red-950/80 border border-red-800 text-red-400"
              }`}
            >
              {backendStatus === "online" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Online
                </>
              ) : backendStatus === "checking" ? (
                "Checking..."
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" /> Offline
                </>
              )}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">API Base URL</span>
              <span className="font-mono text-slate-300">http://localhost:5000/api</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Socket.IO Server</span>
              <span className="font-mono text-slate-300">ws://localhost:5000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Status Detail</span>
              <span className="text-slate-400">{backendMessage || "—"}</span>
            </div>
          </div>
        </div>

        {/* Python AI Service */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Python FastAPI AI Service</h3>
                <p className="text-xs text-slate-400">Port 8000 • Faster-Whisper Engine</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                aiStatus === "online"
                  ? "bg-emerald-950/80 border border-emerald-800 text-emerald-400"
                  : aiStatus === "checking"
                  ? "bg-slate-800 text-slate-400"
                  : "bg-red-950/80 border border-red-800 text-red-400"
              }`}
            >
              {aiStatus === "online" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Online
                </>
              ) : aiStatus === "checking" ? (
                "Checking..."
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" /> Offline
                </>
              )}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Service URL</span>
              <span className="font-mono text-slate-300">http://localhost:8000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Whisper Model</span>
              <span className="font-mono text-slate-300">base (int8 CPU)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Status Detail</span>
              <span className="text-slate-400">{aiMessage || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model & Database Info Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base">Architecture Specifications</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
              <Cpu className="h-4 w-4" /> AI Model Engine
            </div>
            <p className="text-sm font-bold text-white">Faster-Whisper (CTranslate2)</p>
            <p className="text-xs text-slate-400 mt-1">
              Supports real-time multilingual transcription with voice activity detection (VAD).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Database className="h-4 w-4" /> Database Storage
            </div>
            <p className="text-sm font-bold text-white">PostgreSQL + Prisma ORM</p>
            <p className="text-xs text-slate-400 mt-1">
              Stores transcription history, title, duration, text, and creation timestamps.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs mb-1">
              <Radio className="h-4 w-4" /> Real-Time Protocol
            </div>
            <p className="text-sm font-bold text-white">Socket.IO WebSockets</p>
            <p className="text-xs text-slate-400 mt-1">
              Incremental audio chunking with word-overlap delta duplicate-text prevention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
