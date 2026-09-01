"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Plus,
  Compass,
  History,
  Settings as SettingsIcon,
  Globe,
  WifiOff,
  User,
  ChevronDown,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{ is_live_ai: boolean; active_provider: string } | null>(null);

  const isClassroom = pathname.startsWith("/sessions/");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Fetch system AI live mode status
    api.getSystemStatus().then((res) => setSystemStatus(res)).catch(() => {});

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const navItems = [
    { label: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { label: t("nav.learning_paths"), href: "/learning-paths", icon: Compass },
    { label: t("nav.new_lesson"), href: "/lessons/new", icon: Plus, isPrimary: true },
    { label: t("nav.history"), href: "/profile", icon: History },
    { label: t("nav.settings"), href: "/settings", icon: SettingsIcon },
  ];

  const languages: Array<{ code: string; label: SupportedLanguage; native: string }> = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिंदी" },
    { code: "hinglish", label: "Hinglish", native: "Hinglish" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "bn", label: "Bengali", native: "বাংলা" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col antialiased selection:bg-[#0f172a] selection:text-white">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Offline mode · Actions will sync automatically when connection returns</span>
        </div>
      )}

      {/* Top Navbar (Structural P1 Surface) */}
      <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-40 shrink-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 rounded-lg p-1">
          <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-emerald-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-sm text-[#0f172a] tracking-tight">
              {t("app.title")}
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded hidden sm:inline-block">
              {t("app.subtitle")}
            </span>
          </div>
        </Link>

        {/* Utilities: AI Status + Language + Profile */}
        <div className="flex items-center gap-2">
          {/* AI Mode Indicator Badge */}
          {systemStatus && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                systemStatus.is_live_ai
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title={systemStatus.is_live_ai ? "Live LLM Engine Connected" : "Deterministic Offline Air-Gap Scaffolds Active"}
            >
              {systemStatus.is_live_ai ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{systemStatus.active_provider}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-slate-500" />
                  <span>Air-Gap Mode</span>
                </>
              )}
            </div>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-semibold text-[#0f172a] transition cursor-pointer interactive-tactile focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.label);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between cursor-pointer transition ${
                      language === l.label
                        ? "bg-[#0f172a] text-white font-semibold"
                        : "text-[#0f172a] hover:bg-slate-100"
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[11px] opacity-70">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Link */}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition interactive-tactile focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <div className="w-5 h-5 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-[11px] font-bold">
              <User className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-[#0f172a] hidden sm:inline-block">
              {t("user.student")}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto pb-24">
        {children}
      </main>

      {/* Floating Bottom Nav Dock (Hidden in focused AI Classroom sessions) */}
      {!isClassroom && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <nav className="bg-[#0f172a] text-white border border-slate-800 rounded-full p-1.5 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer interactive-tactile focus-visible:ring-2 focus-visible:ring-white ${
                    isActive
                      ? "bg-white text-[#0f172a] font-bold shadow-xs"
                      : item.isPrimary
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};
