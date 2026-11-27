import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Volume2,
  Copy,
  Download,
  Check,
  Save,
  Globe,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { createTranscription } from "../services/api";

const LANGUAGES = [
  { code: "", label: "Auto-detect Language" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function AudioRecorder({ socket, onRecordingStateChange }) {
  // Recording states
  const [recordingStatus, setRecordingStatus] = useState("idle"); // 'idle' | 'recording' | 'paused' | 'processing'
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [recordingTitle, setRecordingTitle] = useState("Live Microphone Recording");
  const [permissionError, setPermissionError] = useState("");

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Audio Playback Preview
  const [audioUrl, setAudioUrl] = useState(null);
  const recordedChunksRef = useRef([]);

  // Live transcript state
  const [liveTranscript, setLiveTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [statusNotification, setStatusNotification] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // References
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Listen to Socket.IO events
  useEffect(() => {
    if (!socket) return;

    const handleChunk = (data) => {
      if (data.text) {
        setLiveTranscript(data.text);
      }
      if (data.language) {
        setDetectedLanguage(data.language);
      }
      if (data.languageProbability) {
        setConfidence(Math.round(data.languageProbability * 100));
      }
    };

    const handleComplete = (data) => {
      setRecordingStatus("idle");
      setStatusNotification(`Transcription finished (${data.duration || 0}s).`);
    };

    const handleSaved = (data) => {
      if (data.success) {
        setIsSaved(true);
        setStatusNotification("Saved to PostgreSQL database!");
      }
    };

    socket.on("transcription_chunk", handleChunk);
    socket.on("transcription_complete", handleComplete);
    socket.on("transcription_saved", handleSaved);

    return () => {
      socket.off("transcription_chunk", handleChunk);
      socket.off("transcription_complete", handleComplete);
      socket.off("transcription_saved", handleSaved);
    };
  }, [socket]);

  // Notify parent of recording state
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(recordingStatus === "recording" || recordingStatus === "paused");
    }
  }, [recordingStatus, onRecordingStateChange]);

  // Format timer MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // START RECORDING
  const startRecording = async () => {
    setPermissionError("");
    setStatusNotification("");
    setIsSaved(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    recordedChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const format = mimeType.includes("webm") ? "webm" : "ogg";

      // Notify backend through Socket
      if (socket && socket.connected) {
        socket.emit("start_transcription", {
          title: recordingTitle || "Live Microphone Recording",
          language: selectedLanguage || null,
          format: format,
        });
      }

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);

          // Stream audio chunk to backend via Socket.IO
          if (socket && socket.connected) {
            const buffer = await event.data.arrayBuffer();
            socket.emit("audio_chunk", buffer);
          }
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(1000); // 1-second chunks
      setRecordingStatus("recording");
      setLiveTranscript("");
      setElapsedSeconds(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone permission error:", err);
      setPermissionError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access denied. Please allow microphone permissions in your browser settings to record audio."
          : `Microphone error: ${err.message}`
      );
      setRecordingStatus("idle");
    }
  };

  // PAUSE RECORDING
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("paused");
      clearInterval(timerRef.current);
    }
  };

  // RESUME RECORDING
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("recording");
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    clearInterval(timerRef.current);
    setRecordingStatus("processing");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (socket && socket.connected) {
      socket.emit("stop_transcription", {
        title: recordingTitle || "Live Microphone Recording",
      });
    }

    setRecordingStatus("idle");
  };

  // COPY TEXT
  const copyTranscript = () => {
    if (!liveTranscript) return;
    navigator.clipboard.writeText(liveTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // DOWNLOAD AS TXT
  const downloadTranscript = () => {
    if (!liveTranscript) return;
    const filename = `${recordingTitle.replace(/[^a-z0-9]/gi, "_") || "transcript"}.txt`;
    const element = document.createElement("a");
    const file = new Blob([liveTranscript], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // MANUAL SAVE TO DATABASE
  const handleManualSave = async () => {
    if (!liveTranscript || isSaved) return;

    setIsSaving(true);
    try {
      await createTranscription({
        title: recordingTitle || "Live Recording",
        text: liveTranscript,
        language: detectedLanguage || selectedLanguage || "en",
        duration: elapsedSeconds || 0,
      });
      setIsSaved(true);
      setStatusNotification("Saved to PostgreSQL database successfully!");
    } catch (err) {
      alert("Failed to save transcript: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Real-Time Audio Recording</h2>
        <p className="text-sm text-slate-400 mt-1">
          Stream microphone audio live to Faster-Whisper with incremental duplicate-text prevention.
        </p>
      </div>

      {/* Permission / Status Alert */}
      {permissionError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Microphone Permission Error</p>
            <p className="text-xs text-red-400/90 mt-0.5">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Recording Title
          </label>
          <input
            type="text"
            value={recordingTitle}
            onChange={(e) => setRecordingTitle(e.target.value)}
            disabled={recordingStatus !== "idle"}
            placeholder="e.g. Weekly Standup Meeting"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-indigo-400" /> Target Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={recordingStatus !== "idle"}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Recording Controller Box */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center relative overflow-hidden shadow-sm">
        {/* Animated Sound Wave Indicator during recording */}
        {recordingStatus === "recording" && (
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-10 bg-red-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1.5 h-14 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1.5 h-8 bg-red-400 rounded-full animate-bounce [animation-delay:0.45s]"></span>
            <span className="w-1.5 h-12 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-6 bg-red-400 rounded-full animate-bounce [animation-delay:0.35s]"></span>
          </div>
        )}

        {/* Live Timer Display */}
        <div className="mb-4">
          <span className="font-mono text-4xl font-extrabold tracking-wider text-white">
            {formatTime(elapsedSeconds)}
          </span>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                recordingStatus === "recording"
                  ? "bg-red-500 animate-pulse"
                  : recordingStatus === "paused"
                  ? "bg-amber-400"
                  : "bg-slate-600"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {recordingStatus === "recording"
                ? "Recording Active"
                : recordingStatus === "paused"
                ? "Recording Paused"
                : recordingStatus === "processing"
                ? "Processing Audio..."
                : "Microphone Ready"}
            </span>
          </div>
        </div>

        {/* Recording Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {recordingStatus === "idle" ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
            >
              <Mic className="h-5 w-5" /> Start Recording
            </button>
          ) : (
            <>
              {/* Pause / Resume Button */}
              {recordingStatus === "recording" ? (
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition shadow"
                >
                  <Pause className="h-4 w-4" /> Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow"
                >
                  <Play className="h-4 w-4" /> Resume
                </button>
              )}

              {/* Stop Button */}
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition shadow"
              >
                <Square className="h-4 w-4 text-red-400 fill-current" /> Stop Recording
              </button>
            </>
          )}
        </div>

        {/* Audio Playback Preview */}
        {audioUrl && recordingStatus === "idle" && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 max-w-md mx-auto">
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-center gap-1.5">
              <Volume2 className="h-4 w-4 text-indigo-400" /> Recorded Audio Preview
            </p>
            <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
          </div>
        )}
      </div>

      {/* Real-time Transcription Stream Box */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Live Transcription Stream</h3>
          </div>

          <div className="flex items-center gap-2">
            {detectedLanguage && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/60 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                {detectedLanguage} {confidence ? `(${confidence}%)` : ""}
              </span>
            )}
            {statusNotification && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" /> {statusNotification}
              </span>
            )}
          </div>
        </div>

        {/* Transcript text window */}
        <div className="min-h-48 max-h-96 overflow-y-auto bg-slate-950 rounded-2xl p-5 border border-slate-800 text-sm leading-relaxed text-slate-200 select-text whitespace-pre-wrap">
          {liveTranscript || (
            <span className="text-slate-500 italic">
              {recordingStatus === "recording"
                ? "Listening... speak into your microphone to view real-time transcript."
                : "Click 'Start Recording' to stream audio and transcribe live."}
            </span>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <span className="text-slate-500">
            {liveTranscript ? `${liveTranscript.split(/\s+/).filter(Boolean).length} words` : "0 words"}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={copyTranscript}
              disabled={!liveTranscript}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>

            <button
              onClick={downloadTranscript}
              disabled={!liveTranscript}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Download (.txt)
            </button>

            <button
              onClick={handleManualSave}
              disabled={!liveTranscript || isSaved || isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition disabled:opacity-40 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaved ? "Saved to DB" : isSaving ? "Saving..." : "Save to History"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
