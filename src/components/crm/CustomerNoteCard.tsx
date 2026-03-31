"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock3, MessageSquareText, User2 } from "lucide-react";

export type CustomerNoteCardItem = {
  id: string;
  content: string;
  createdAt: string;
  noteDate?: string | null;
  noteType?: string | null;
  authorId?: string | null;
  author?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

interface CustomerNoteCardProps {
  note: CustomerNoteCardItem;
  getUserName?: (id: string) => string;
}

export function CustomerNoteCard({
  note,
  getUserName,
}: CustomerNoteCardProps) {
  const displayAuthor =
    note.author?.name ||
    (note.authorId && getUserName ? getUserName(note.authorId) : null) ||
    note.author?.email ||
    "Bilinmeyen kullanıcı";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getNoteTypeTone(
                note.noteType
              )}`}
            >
              <MessageSquareText className="mr-1 h-3.5 w-3.5" />
              {getNoteTypeLabel(note.noteType)}
            </Badge>

            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Görüşme: {formatDateTime(note.noteDate || note.createdAt)}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
            {note.content}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <User2 className="h-3.5 w-3.5" />
          {displayAuthor}
        </span>

        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          Sisteme giriş: {formatDateTime(note.createdAt)}
        </span>
      </div>
    </div>
  );
}

function getNoteTypeLabel(noteType?: string | null) {
  switch (String(noteType || "").toLowerCase()) {
    case "call":
      return "Telefon";
    case "visit":
      return "Ziyaret";
    case "meeting":
      return "Toplantı";
    case "offer":
      return "Teklif";
    case "technical":
      return "Teknik";
    default:
      return "Not";
  }
}

function getNoteTypeTone(noteType?: string | null) {
  switch (String(noteType || "").toLowerCase()) {
    case "call":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "visit":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "meeting":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "offer":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "technical":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}