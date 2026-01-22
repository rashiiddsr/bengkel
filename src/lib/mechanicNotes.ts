export type MechanicNoteItem = {
  note: string;
  cost?: number | null;
};

export const parseMechanicNotes = (
  raw: string | null | undefined
): MechanicNoteItem[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const note = typeof item.note === 'string' ? item.note : '';
          const cost = typeof item.cost === 'number' ? item.cost : null;
          if (!note.trim()) return null;
          return { note, cost };
        })
        .filter((item): item is MechanicNoteItem => item !== null);
    }
  } catch (error) {
    // Fallback to plain text notes
  }

  return [{ note: raw, cost: null }];
};

export const serializeMechanicNotes = (items: MechanicNoteItem[]): string | null => {
  const cleaned = items
    .map((item) => ({
      note: item.note.trim(),
      cost: item.cost ?? 0,
    }))
    .filter((item) => item.note);

  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
};

export const calculateMechanicNotesTotal = (items: MechanicNoteItem[]): number =>
  items.reduce((total, item) => total + (item.cost ?? 0), 0);
