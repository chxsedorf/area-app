"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AreaCell = {
  id: string;
  row: number;
  col: number;
  isCurrentPosition: boolean;
};

const PREVIEW_ROWS = 9;
const PREVIEW_COLS = 9;
const STORAGE_KEY = "area_revealed_cells";

const initialRevealedCells = new Set<string>([
  "2-3",
  "2-4",
  "2-5",
  "3-3",
  "3-4",
  "3-5",
  "4-3",
  "4-4",
  "4-5",
]);

const revealOrder = [
  "5-3",
  "5-4",
  "5-5",
  "6-4",
  "6-5",
  "6-6",
  "4-6",
  "5-6",
  "3-6",
  "2-6",
  "1-5",
  "1-4",
  "1-3",
  "3-2",
  "4-2",
  "5-2",
  "6-2",
  "7-3",
  "7-4",
  "7-5",
  "7-6",
  "6-7",
  "5-7",
  "4-7",
  "3-7",
  "2-7",
  "1-7",
  "0-6",
  "0-5",
  "0-4",
  "0-3",
  "0-2",
  "1-2",
  "2-2",
  "3-1",
  "4-1",
  "5-1",
  "6-1",
  "7-1",
  "8-2",
  "8-3",
  "8-4",
  "8-5",
  "8-6",
  "8-7",
  "7-7",
  "6-8",
  "5-8",
  "4-8",
  "3-8",
  "2-8",
];

export const areaCells: AreaCell[] = Array.from(
  { length: PREVIEW_ROWS * PREVIEW_COLS },
  (_, index) => {
    const row = Math.floor(index / PREVIEW_COLS);
    const col = index % PREVIEW_COLS;
    const id = `${row}-${col}`;

    return {
      id,
      row,
      col,
      isCurrentPosition: row === 4 && col === 4,
    };
  }
);

type AreaContextValue = {
  revealedCells: Set<string>;
  revealedCount: number;
  totalCells: number;
  openedRate: string;
  revealCells: (amount: number) => number;
  resetArea: () => void;
};

const AreaContext = createContext<AreaContextValue | null>(null);

function loadRevealedCells() {
  if (typeof window === "undefined") {
    return new Set(initialRevealedCells);
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return new Set(initialRevealedCells);
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return new Set(initialRevealedCells);
    }

    return new Set<string>(parsed);
  } catch {
    return new Set(initialRevealedCells);
  }
}

function saveRevealedCells(cells: Set<string>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cells)));
}

export function AreaProvider({ children }: { children: ReactNode }) {
  const [revealedCells, setRevealedCells] = useState<Set<string>>(
    () => new Set(initialRevealedCells)
  );

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setRevealedCells(loadRevealedCells());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    saveRevealedCells(revealedCells);
  }, [revealedCells, hasLoaded]);

  const revealCells = (amount: number) => {
    let addedCount = 0;

    setRevealedCells((prevCells) => {
      const nextCells = new Set(prevCells);

      for (const cellId of revealOrder) {
        if (addedCount >= amount) break;

        if (!nextCells.has(cellId)) {
          nextCells.add(cellId);
          addedCount += 1;
        }
      }

      return nextCells;
    });

    return addedCount;
  };

  const resetArea = () => {
    const resetCells = new Set(initialRevealedCells);
    setRevealedCells(resetCells);
    saveRevealedCells(resetCells);
  };

  const value = useMemo<AreaContextValue>(() => {
    const revealedCount = revealedCells.size;
    const totalCells = areaCells.length;
    const openedRate = ((revealedCount / totalCells) * 100).toFixed(1);

    return {
      revealedCells,
      revealedCount,
      totalCells,
      openedRate,
      revealCells,
      resetArea,
    };
  }, [revealedCells]);

  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

export function useArea() {
  const context = useContext(AreaContext);

  if (!context) {
    throw new Error("useArea must be used inside AreaProvider");
  }

  return context;
}