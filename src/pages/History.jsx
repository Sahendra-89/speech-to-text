import { useEffect, useState } from "react";
import {
  getTranscriptions,
  deleteTranscription,
  updateTranscription,
} from "../services/api";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Download,
  Check,
  X,
  Clock,
  Globe,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function History({ onNavigateToNew }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");

  // Modals state
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await getTranscriptions();
      setRecords(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("History loading failed:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to connect to the backend server. Please verify the backend is running."
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transcription? This cannot be undone.")) {
      return;
    }

    try {
      await deleteTranscription(id);
      setRecords((prev) => prev.filter((item) => item.id !== id));
      if (viewingRecord && viewingRecord.id === id) {
        setViewingRecord(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete transcription record");
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditTitle(record.title || "");
    setEditText(record.text || "");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsUpdating(true);
    try {
      const response = await updateTranscription(editingRecord.id, {
        title: editTitle.trim(),
        text: editText.trim(),
      });

      if (response.success && response.data) {
        setRecords((prev) =>
          prev.map((item) => (item.id === editingRecord.id ? response.data : item))
        );
        if (viewingRecord && viewingRecord.id === editingRecord.id) {
          setViewingRecord(response.data);
        }
        setEditingRecord(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update transcription");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadTextFile = (record) => {
    const filename = `${(record.title || "transcription").replace(/[^a-z0-9]/gi, "_")}.txt`;
    const element = document.createElement("a");
    const file = new Blob([record.text], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.text || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      languageFilter === "all" || (r.language || "").toLowerCase() === languageFilter.toLowerCase();
    return matchesSearch && matchesLang;
  });

  // Extract unique languages
  const availableLanguages = Array.from(
    new Set(records.map((r) => r.language).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Transcription History</h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse, view details, edit, or delete saved speech-to-text transcripts.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search in title or transcript text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {availableLanguages.length > 0 && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Failed to load transcription history</p>
            <p className="text-xs text-red-400/90 mt-0.5">{errorMessage}</p>
            <button
              onClick={loadHistory}
              className="mt-2 text-xs font-semibold text-red-200 hover:underline"
            >
              Click here to retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-5 w-1/3 bg-slate-800 rounded"></div>
              <div className="h-4 w-full bg-slate-800/60 rounded"></div>
              <div className="h-4 w-2/3 bg-slate-800/40 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMessage && filteredRecords.length === 0 && (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            {records.length === 0
              ? "No transcription records found yet"
              : "No records match your search"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? "Record speech using your microphone or upload an audio file to view saved transcripts."
              : "Try clearing your search query or language filter."}
          </p>
          {records.length === 0 && onNavigateToNew && (
            <button
              onClick={onNavigateToNew}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20"
            >
              Start New Transcription
            </button>
          )}
        </div>
      )}

      {/* Records List */}
      {!loading && filteredRecords.length > 0 && (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white text-base truncate max-w-md">
                    {record.title || "Untitled Recording"}
                  </h3>
                  {record.language && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                      {record.language}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {record.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {record.duration}s
                    </span>
                  )}
                  <span>
                    {record.createdAt ? new Date(record.createdAt).toLocaleString() : ""}
                  </span>
                </div>
              </div>

              {/* Text Preview */}
              <p className="my-3 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {record.text || <span className="italic text-slate-500">No transcribed text</span>}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  {record.text ? `${record.text.split(/\s+/).filter(Boolean).length} words` : "0 words"}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(record.text, record.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
                    title="Copy transcript"
                  >
                    {copiedId === record.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => downloadTextFile(record)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Download as TXT"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setViewingRecord(record)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition text-xs font-medium flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>

                  <button
                    onClick={() => openEditModal(record)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-medium flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/30 transition"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {viewingRecord.title || "Transcription Details"}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  {viewingRecord.language && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold uppercase">
                      {viewingRecord.language}
                    </span>
                  )}
                  {viewingRecord.duration > 0 && <span>Duration: {viewingRecord.duration}s</span>}
                  <span>Created: {new Date(viewingRecord.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setViewingRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
              {viewingRecord.text}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500">
                {viewingRecord.text.split(/\s+/).filter(Boolean).length} words •{" "}
                {viewingRecord.text.length} characters
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(viewingRecord.text, "view_modal")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 transition"
                >
                  {copiedId === "view_modal" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy
                </button>
                <button
                  onClick={() => downloadTextFile(viewingRecord)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => {
                    const toEdit = viewingRecord;
                    setViewingRecord(null);
                    openEditModal(toEdit);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Transcription</h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Transcription title..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transcription Text
                </label>
                <textarea
                  rows={8}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Transcript text..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
