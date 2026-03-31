"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2, NotebookPen } from "lucide-react";
import {
  CustomerNoteCard,
  type CustomerNoteCardItem,
} from "@/components/crm/CustomerNoteCard";

type CustomerNoteType =
  | "note"
  | "call"
  | "visit"
  | "meeting"
  | "offer"
  | "technical";

interface CustomerTimelineProps {
  notes: CustomerNoteCardItem[];
  isLoading?: boolean;
  isAdding?: boolean;
  error?: string | null;
  onAddNote: (payload: {
    content: string;
    noteDate?: string;
    noteType?: CustomerNoteType;
  }) => Promise<void> | void;
  getUserName?: (id: string) => string;
  title?: string;
}

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function CustomerTimeline({
  notes,
  isLoading = false,
  isAdding = false,
  error = null,
  onAddNote,
  getUserName,
  title = "Müşteri Notları ve Süreç",
}: CustomerTimelineProps) {
  const [content, setContent] = React.useState("");
  const [noteType, setNoteType] = React.useState<CustomerNoteType>("note");
  const [noteDate, setNoteDate] = React.useState(getCurrentDateTimeLocal());

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    await onAddNote({
      content: trimmed,
      noteDate: noteDate || undefined,
      noteType,
    });

    setContent("");
    setNoteType("note");
    setNoteDate(getCurrentDateTimeLocal());
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-[180px_220px_1fr]">
          <div className="space-y-2">
            <Label>Not Türü</Label>
            <Select
              value={noteType}
              onValueChange={(value) => setNoteType(value as CustomerNoteType)}
            >
              <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Genel Not</SelectItem>
                <SelectItem value="call">Telefon</SelectItem>
                <SelectItem value="visit">Ziyaret</SelectItem>
                <SelectItem value="meeting">Toplantı</SelectItem>
                <SelectItem value="offer">Teklif</SelectItem>
                <SelectItem value="technical">Teknik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Görüşme Tarihi</Label>
            <Input
              type="datetime-local"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="rounded-xl border-slate-200 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Not İçeriği</Label>
            <Textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Müşteriyle yapılan görüşmenin detayını yazın..."
              className="resize-none rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isAdding || !content.trim()}
            className="rounded-xl"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <NotebookPen className="mr-2 h-4 w-4" />
                Not Ekle
              </>
            )}
          </Button>
        </div>

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Notlar yükleniyor...
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
            Bu müşteri için henüz not eklenmemiş.
          </div>
        ) : (
          notes.map((note) => (
            <CustomerNoteCard
              key={note.id}
              note={note}
              getUserName={getUserName}
            />
          ))
        )}
      </div>
    </section>
  );
}