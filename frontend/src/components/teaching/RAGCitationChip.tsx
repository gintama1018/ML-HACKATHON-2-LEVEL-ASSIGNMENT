"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Citation } from "@/lib/api";

interface RAGCitationChipProps {
  citations: Citation[];
}

export const RAGCitationChip: React.FC<RAGCitationChipProps> = ({ citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  const firstCitation = citations[0];
  const sectionTitle = firstCitation.section_ref || firstCitation.section || "Source Material";
  const pageNum = firstCitation.page_number || firstCitation.page;
  const label = `Based on: ${sectionTitle}${pageNum ? `, Page ${pageNum}` : ""}`;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 transition cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate font-medium">{label}</span>
          {citations.length > 1 && (
            <span className="px-1.5 py-0.2 bg-emerald-200 text-[10px] rounded-full text-emerald-800 font-bold">
              +{citations.length - 1} more
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white border border-emerald-200 rounded-xl space-y-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Grounded Source Excerpt(s)
          </p>
          {citations.map((c, idx) => {
            const sTitle = c.section_ref || c.section || "Source Material";
            const pNum = c.page_number || c.page;
            return (
              <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800 text-[11px]">
                  {sTitle} {pNum ? `(Page ${pNum})` : ""}
                </p>
                <p className="text-slate-600 text-xs italic font-serif leading-relaxed">
                  &ldquo;{c.excerpt}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
