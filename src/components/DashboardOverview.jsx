import { useEffect, useState } from "react";
import { getTranscriptions } from "../services/api";
import {
  FileText,
  Clock,
  Globe2,
  Cpu,
  Mic,
  UploadCloud,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function DashboardOverview({ onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getTranscriptions()
      .then((res) => {
        if (isMounted) {
          setRecords(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Dashboard overview fetch error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalTranscriptions = records.length;
  const totalDurationSeconds = records.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  const remainingSeconds = totalDurationSeconds % 60;

  const languagesCount = Array.from(
    new Set(records.map((r) => r.language).filter(Boolean))
  ).length;

  const recentRecords = records.slice(0, 4);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 p-8 border border-indigo-900/40 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            Procucev SpeechFlow AI Assignment
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Speech-to-Text Studio
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Record real-time audio streams or upload pre-recorded audio files. Transcribe in multiple
            languages using Faster-Whisper with PostgreSQL history tracking.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={() => onNavigate("live")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/25"
            >
              <Mic className="h-4 w-4" /> Start Live Recording
            </button>
            <button
              onClick={() => onNavigate("upload")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
            >
              <UploadCloud className="h-4 w-4" /> Upload Audio File
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Transcriptions</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? "..." : totalTranscriptions}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Persisted in PostgreSQL</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Audio Processed</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? "..." : `${totalMinutes}m ${remainingSeconds}s`}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Total duration tracked</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Languages Detected</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? "..." : Math.max(1, languagesCount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Multilingual Whisper</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Globe2 className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">AI Service</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5" /> Online
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Faster-Whisper int8</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cpu className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Access & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Cards (1 col) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Quick Actions</h3>

          <div
            onClick={() => onNavigate("live")}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-600/60 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <Mic className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-semibold text-white text-base mt-3">Live Microphone</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Stream live audio via Socket.IO with real-time text delta buffering and duplicate
              prevention.
            </p>
          </div>

          <div
            onClick={() => onNavigate("upload")}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-600/60 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <UploadCloud className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-semibold text-white text-base mt-3">Upload Audio File</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Transcribe pre-recorded WAV, MP3, M4A, WebM, OGG, or FLAC audio files up to 25MB.
            </p>
          </div>
        </div>

        {/* Recent Transcriptions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Transcriptions</h3>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
            >
              View All ({totalTranscriptions}) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse h-20"
                />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
              <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No transcripts recorded yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Record your voice or upload an audio file to see recent items here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white truncate max-w-xs sm:max-w-md">
                        {item.title || "Untitled Recording"}
                      </h4>
                      {item.language && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 uppercase">
                          {item.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 mt-1.5">
                      {item.text || "No speech detected"}
                    </p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </span>
                  </div>

                  <button
                    onClick={() => copyText(item.text, item.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex-shrink-0"
                    title="Copy transcript"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
