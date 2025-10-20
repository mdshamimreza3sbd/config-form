"use client";

import { FileText, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { DraftData, getDrafts, deleteDraft } from "@/lib/draftStorage";
import toast from "react-hot-toast";

interface DraftPanelProps {
  onLoadDraft: (draft: DraftData) => void;
}

export default function DraftPanel({ onLoadDraft }: DraftPanelProps) {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load drafts on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshDrafts();
    }
  }, [isOpen]);

  const refreshDrafts = () => {
    const allDrafts = getDrafts();
    setDrafts(allDrafts);
  };

  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this draft?")) {
      deleteDraft(draftId);
      refreshDrafts();
      toast.success("Draft deleted");
    }
  };

  const handleLoadDraft = (draft: DraftData) => {
    onLoadDraft(draft);
    setIsOpen(false);
    toast.success(`Loaded draft: ${draft.restaurantName} - ${draft.outletName}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Toggle Button - Next.js Dev Tools Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-mono rounded-md shadow-lg hover:bg-gray-800 transition-colors border border-gray-700"
        title="Toggle Draft Panel"
      >
        <FileText className="w-4 h-4" />
        <span>Drafts ({drafts.length})</span>
      </button>

      {/* Draft Panel */}
      {isOpen && (
        <div className="fixed top-20 right-4 z-50 w-80 bg-black text-white rounded-lg shadow-2xl border border-gray-700 font-mono text-xs overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-semibold">Form Drafts</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="max-h-96 overflow-y-auto">
              {drafts.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p>No drafts saved</p>
                  <p className="mt-1 text-[10px]">
                    Fill in restaurant and outlet name to save a draft
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3 hover:bg-gray-900 transition-colors cursor-pointer group"
                      onClick={() => handleLoadDraft(draft)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {draft.restaurantName}
                          </div>
                          <div className="text-gray-400 truncate">
                            {draft.outletName}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            Updated: {formatDate(draft.updatedAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-1 hover:bg-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!isMinimized && drafts.length > 0 && (
            <div className="px-3 py-2 bg-gray-900 border-t border-gray-700 text-[10px] text-gray-400">
              Click on a draft to load it
            </div>
          )}
        </div>
      )}
    </>
  );
}
