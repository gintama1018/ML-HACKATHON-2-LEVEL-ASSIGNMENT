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
  const label = `Source: ${sectionTitle}${pageNum ? `, p.${pageNum}` : ""}`;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 transition cursor-pointer interactive-tactile"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate font-medium">{label}</span>
          {citations.length > 1 && (
            <span className="px-1.5 py-0.2 bg-slate-200 text-[10px] rounded text-slate-700 font-semibold">
              +{citations.length - 1} more
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-xs animate-in fade-in duration-150 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Grounded Source Excerpts
          </span>
          {citations.map((c, idx) => {
            const sTitle = c.section_ref || c.section || "Source Material";
            const pNum = c.page_number || c.page;
            return (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                <p className="font-semibold text-[#0f172a] text-[11px]">
                  {sTitle} {pNum ? `(Page ${pNum})` : ""}
                </p>
                <p className="text-slate-600 text-xs italic leading-relaxed">
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
