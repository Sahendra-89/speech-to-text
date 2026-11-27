import {
  LayoutDashboard,
  Mic,
  UploadCloud,
  Clock,
  Settings,
  X,
  Volume2,
  Radio,
} from "lucide-react";

export default function Sidebar({
  activeView,
  setActiveView,
  isOpen,
  onClose,
  isRecordingLive,
}) {
  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "live", label: "New Recording", icon: Mic, badge: isRecordingLive ? "LIVE" : null },
    { id: "upload", label: "Upload Audio", icon: UploadCloud },
    { id: "history", label: "Transcription History", icon: Clock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                SpeechFlow <span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide block uppercase">
                Speech-to-Text
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                    <Radio className="h-2.5 w-2.5" /> {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Status Card */}
        <div className="p-4 m-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Faster-Whisper Active
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Multilingual AI engine with real-time stream buffering.
          </p>
        </div>
      </aside>
    </>
  );
}
