import { useState, useRef } from "react";
import {
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Check,
  RefreshCw,
  Globe,
  Save,
  Volume2,
  Trash2,
} from "lucide-react";
import { transcribeAudioFile, createTranscription } from "../services/api";

const SUPPORTED_FORMATS = [".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".aac"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const LANGUAGES = [
  { code: "", label: "Auto-detect Language" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function AudioUploader({ onTranscriptionSaved }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelection = (file) => {
    setErrorMessage("");
    setTranscriptionResult(null);
    setIsSaved(false);

    if (!file) return;

    // Validate extension
    const ext = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!SUPPORTED_FORMATS.includes(ext)) {
      if ([".txt", ".doc", ".docx", ".pdf", ".json", ".md"].includes(ext)) {
        setErrorMessage(
          `SpeechFlow AI converts spoken audio into text. '${ext}' is a document/text file, not an audio recording. Please upload an audio recording containing speech (${SUPPORTED_FORMATS.join(", ")}).`
        );
      } else {
        setErrorMessage(
          `Unsupported audio format '${ext}'. Please upload an audio file in one of: ${SUPPORTED_FORMATS.join(", ")}`
        );
      }
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed 25MB.`
      );
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    // Create preview
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setTranscriptionResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setErrorMessage("");
    setTranscriptionResult(null);
    setIsSaved(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const ext = selectedFile.name.split(".").pop().toLowerCase();

          const response = await transcribeAudioFile({
            audioBase64: base64Data,
            format: ext,
            language: selectedLanguage || null,
            title: customTitle.trim() || selectedFile.name,
            duration: 0,
          });

          if (response.success && response.data) {
            setTranscriptionResult(response.data);
            if (response.data.savedRecord) {
              setIsSaved(true);
              if (onTranscriptionSaved) onTranscriptionSaved();
            }
          } else {
            setErrorMessage(response.message || "Failed to transcribe audio file.");
          }
        } catch (apiErr) {
          console.error("Transcribe API call error:", apiErr);
          const msg =
            apiErr.response?.data?.message ||
            apiErr.message ||
            "Failed to communicate with the transcription service.";
          setErrorMessage(msg);
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error("File read error:", err);
      setErrorMessage("Could not read audio file: " + err.message);
      setIsTranscribing(false);
    }
  };

  const copyResult = () => {
    if (!transcriptionResult?.text) return;
    navigator.clipboard.writeText(transcriptionResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResult = () => {
    if (!transcriptionResult?.text) return;
    const filename = `${(customTitle || "transcription").replace(/[^a-z0-9]/gi, "_")}.txt`;
    const element = document.createElement("a");
    const file = new Blob([transcriptionResult.text], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleManualSave = async () => {
    if (!transcriptionResult?.text || isSaved || isSaving) return;

    setIsSaving(true);
    try {
      await createTranscription({
        title: customTitle.trim() || selectedFile?.name || "Uploaded Audio Recording",
        text: transcriptionResult.text,
        language: transcriptionResult.language || selectedLanguage || "en",
        duration: 0,
      });
      setIsSaved(true);
      if (onTranscriptionSaved) onTranscriptionSaved();
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Audio File Transcription</h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload pre-recorded audio files to generate high-accuracy multilingual transcriptions.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Transcription Error</p>
            <p className="text-xs text-red-400/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Configuration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Transcription Title
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            disabled={isTranscribing}
            placeholder="e.g. Interview Recording"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-indigo-400" /> Language Hint
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isTranscribing}
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

      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-indigo-500/60 transition flex flex-col items-center justify-center text-center space-y-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FORMATS.join(",")}
          onChange={(e) => handleFileSelection(e.target.files[0])}
          className="hidden"
          id="audio-upload-input"
        />

        {!selectedFile ? (
          <>
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                Drag and drop your audio file here, or{" "}
                <label
                  htmlFor="audio-upload-input"
                  className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  browse files
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: {SUPPORTED_FORMATS.join(", ")} (up to 25MB)
              </p>
            </div>
          </>
        ) : (
          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileAudio className="h-8 w-8 text-indigo-400 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                    {selectedFile.name.split(".").pop().toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClearFile}
                disabled={isTranscribing}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Audio Preview */}
            {audioPreviewUrl && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400" /> Audio Preview
                </p>
                <audio controls src={audioPreviewUrl} className="w-full h-9 rounded-lg" />
              </div>
            )}

            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing Transcription with Faster-Whisper...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Transcribe Audio File
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Transcription Results Card */}
      {transcriptionResult && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Transcription Result</h3>
            </div>

            <div className="flex items-center gap-2">
              {transcriptionResult.language && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/60 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  {transcriptionResult.language}{" "}
                  {transcriptionResult.language_probability
                    ? `(${Math.round(transcriptionResult.language_probability * 100)}% conf)`
                    : ""}
                </span>
              )}
              {isSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saved to DB
                </span>
              )}
            </div>
          </div>

          <div className="min-h-40 max-h-96 overflow-y-auto bg-slate-950 rounded-2xl p-5 border border-slate-800 text-sm leading-relaxed text-slate-200 select-text whitespace-pre-wrap">
            {transcriptionResult.text || (
              <span className="text-slate-500 italic">No audible speech detected in this audio file.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <span className="text-slate-500">
              {transcriptionResult.text
                ? `${transcriptionResult.text.split(/\s+/).filter(Boolean).length} words • ${transcriptionResult.text.length} characters`
                : "0 words"}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={copyResult}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>

              <button
                onClick={downloadResult}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition"
              >
                <Download className="h-3.5 w-3.5" /> Download (.txt)
              </button>

              {!isSaved && (
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Save to History"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
