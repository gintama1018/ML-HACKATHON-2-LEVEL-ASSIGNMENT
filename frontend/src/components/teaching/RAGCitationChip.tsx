"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface Citation {
  section_ref: string;
  page_number?: number;
  excerpt: string;
}

interface RAGCitationChipProps {
  citations: Citation[];
}

export const RAGCitationChip: React.FC<RAGCitationChipProps> = ({ citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  const firstCitation = citations[0];
  const label = `Based on: ${firstCitation.section_ref}${
    firstCitation.page_number ? `, Page ${firstCitation.page_number}` : ""
  }`;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 transition cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate font-medium">{label}</span>
          {citations.length > 1 && (
            <span className="px-1.5 py-0.2 bg-indigo-800 text-[10px] rounded-full text-indigo-200">
              +{citations.length - 1} more
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-slate-950/90 border border-indigo-500/20 rounded-xl space-y-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200 shadow-xl">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Grounded Source Excerpt(s)
          </p>
          {citations.map((c, idx) => (
            <div key={idx} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
              <p className="font-semibold text-slate-300 text-[11px]">
                {c.section_ref} {c.page_number ? `(Page ${c.page_number})` : ""}
              </p>
              <p className="text-slate-400 text-xs italic font-serif leading-relaxed">
                &ldquo;{c.excerpt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
