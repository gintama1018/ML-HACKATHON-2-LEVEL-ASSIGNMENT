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
  ChevronDown
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const isClassroom = pathname.startsWith("/sessions/");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const navItems = [
    { label: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { label: "Learning Paths", href: "/learning-paths", icon: Compass },
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
    <div className="min-h-screen bg-[#f8fafc] text-[#0b1c30] flex flex-col antialiased selection:bg-[#0f172a] selection:text-white">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — actions will sync when connection returns</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-14 px-4 sm:px-6 bg-white/95 border-b border-slate-200 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 shadow-xs shrink-0">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-emerald-400 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-sm text-[#0b1c30] tracking-tight">
              Bharat Academix
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded tracking-wide hidden sm:inline-block">
              AI Gurukul
            </span>
          </div>
        </Link>

        {/* Utilities */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] transition cursor-pointer"
            >
              <Globe className="w-3 h-3 text-slate-600" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.label);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      language === l.label
                        ? "bg-[#0f172a] text-white font-bold"
                        : "text-[#0b1c30] hover:bg-slate-100"
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] opacity-70">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Chip */}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            <div className="w-5 h-5 rounded-full bg-[#0f172a] text-emerald-400 flex items-center justify-center text-[10px] font-bold">
              <User className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-[#0b1c30] hidden sm:inline-block">Aarav S.</span>
          </Link>
        </div>
      </header>

      {/* Main Page Area with natural scrolling */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-6xl w-full mx-auto pb-20">
        {children}
      </main>

      {/* Floating Bottom Nav Dock (Hidden in focused AI Classroom sessions) */}
      {!isClassroom && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <nav className="bg-[#0f172a] text-white border border-slate-700/80 rounded-full p-1.5 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : item.isPrimary
                      ? "bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
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
