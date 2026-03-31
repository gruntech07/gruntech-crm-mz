"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type CustomerNoteType =
  | "note"
  | "call"
  | "visit"
  | "meeting"
  | "offer"
  | "technical";

export interface CustomerNoteAuthor {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  noteDate?: string | null;
  noteType?: string | null;
  author?: CustomerNoteAuthor | null;
}

interface AddCustomerNotePayload {
  content: string;
  noteDate?: string;
  noteType?: CustomerNoteType;
  type?: string;
}

interface UseCustomerNotesOptions {
  customerId?: string | null;
  enabled?: boolean;
}

export function useCustomerNotes({
  customerId,
  enabled = true,
}: UseCustomerNotesOptions) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!customerId || !enabled) {
      setNotes([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri notları alınamadı.");
      }

      const incoming = Array.isArray(data?.notes) ? data.notes : [];

      const sorted = [...incoming].sort((a, b) => {
        const aDate = new Date(a.noteDate || a.createdAt).getTime();
        const bDate = new Date(b.noteDate || b.createdAt).getTime();
        return bDate - aDate;
      });

      setNotes(sorted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Müşteri notları alınamadı.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, enabled]);

  const addNote = useCallback(
    async ({
      content,
      noteDate,
      noteType = "note",
      type,
    }: AddCustomerNotePayload) => {
      if (!customerId) {
        throw new Error("Müşteri seçilmedi.");
      }

      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error("Not içeriği boş olamaz.");
      }

      try {
        setIsAdding(true);
        setError(null);

        const effectiveNoteDate = noteDate || new Date().toISOString();

        const res = await fetch(`/api/customers/${customerId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmed,
            note: trimmed,
            noteDate: effectiveNoteDate,
            noteType,
            type: type || noteType.toUpperCase(),
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Müşteri notu eklenemedi.");
        }

        await loadNotes();

        return data?.note as CustomerNote | undefined;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Müşteri notu eklenemedi.";
        setError(message);
        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    [customerId, loadNotes]
  );

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const latestNote = useMemo(() => {
    return notes.length > 0 ? notes[0] : null;
  }, [notes]);

  return {
    notes,
    latestNote,
    isLoading,
    isAdding,
    error,
    loadNotes,
    addNote,
    setNotes,
  };
}