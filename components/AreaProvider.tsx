"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getDistanceKm } from "@/lib/distance";
import { getAreaRule, judgeMoveStatus, type MoveStatus } from "@/lib/areaRules";

export type AreaCell = {
  id: string;
  row: number;
  col: number;
  isCurrentPosition: boolean;
};

type PositionData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
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
  resetArea: () => void;

  isTracking: boolean;
  distance: number;
  area: number;
  newAreas: number;
  speedKmh: number;
  moveStatus: MoveStatus;
  position: PositionData | null;
  message: string;
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
  const watchIdRef = useRef<number | null>(null);
  const previousPositionRef = useRef<PositionData | null>(null);

  const [revealedCells, setRevealedCells] = useState<Set<string>>(
    () => new Set(initialRevealedCells)
  );

  const [hasLoaded, setHasLoaded] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [area, setArea] = useState(0);
  const [newAreas, setNewAreas] = useState(0);

  const [speedKmh, setSpeedKmh] = useState(0);
  const [moveStatus, setMoveStatus] = useState<MoveStatus>("unknown");
  const [position, setPosition] = useState<PositionData | null>(null);
  const [message, setMessage] = useState("位置情報を準備しています。");

  useEffect(() => {
    setRevealedCells(loadRevealedCells());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    saveRevealedCells(revealedCells);
  }, [revealedCells, hasLoaded]);

  const revealCells = useCallback((amount: number) => {
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
  }, []);

  const resetArea = useCallback(() => {
    const resetCells = new Set(initialRevealedCells);
    setRevealedCells(resetCells);
    saveRevealedCells(resetCells);

    setDistance(0);
    setArea(0);
    setNewAreas(0);
    setSpeedKmh(0);
    setMoveStatus("unknown");
    setMessage("AREAを初期化しました。");
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage("このブラウザは位置情報取得に対応していません。");
      return;
    }

    setIsTracking(true);
    setMessage("位置情報を取得中です...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const current: PositionData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        setPosition(current);

        const previous = previousPositionRef.current;

        if (!previous) {
          previousPositionRef.current = current;
          setMessage("現在地を取得しました。移動するとAREAが解放されます。");
          return;
        }

        const movedKm = getDistanceKm(
          previous.latitude,
          previous.longitude,
          current.latitude,
          current.longitude
        );

        const timeDiffHours =
          (current.timestamp - previous.timestamp) / 1000 / 60 / 60;

        if (timeDiffHours <= 0) return;

        const currentSpeedKmh = movedKm / timeDiffHours;
        const roundedSpeed = Number(currentSpeedKmh.toFixed(1));
        const status = judgeMoveStatus(roundedSpeed);
        const rule = getAreaRule(status);

        setSpeedKmh(roundedSpeed);
        setMoveStatus(status);

        const isReliable = current.accuracy <= 80;
        const movedMeters = movedKm * 1000;
        const isRealMove = movedMeters >= 3;

        if (isReliable && isRealMove) {
          setDistance((prevValue) => Number((prevValue + movedKm).toFixed(3)));

          if (rule.canReveal) {
            const revealAmount = status === "human" ? 3 : 1;
            const addedCount = revealCells(revealAmount);

            if (addedCount > 0) {
              setNewAreas((prevValue) => prevValue + addedCount);
              setArea((prevValue) =>
                Number((prevValue + rule.areaGainKm2 * addedCount).toFixed(3))
              );
            }
          }
        }

        previousPositionRef.current = current;

        if (!isReliable) {
          setMessage("GPS精度が低いため、マス解放を一時停止しています。");
          return;
        }

        if (!isRealMove) {
          setMessage("移動が小さいため、マスはまだ解放されていません。");
          return;
        }

        if (rule.canReveal) {
          setMessage("20km/h以下で通過中。AREAのマスを解放しています。");
        } else {
          setMessage("20km/hを超えているため、AREAは解放されません。");
        }
      },
      (error) => {
        setIsTracking(false);

        if (error.code === error.PERMISSION_DENIED) {
          setMessage(
            "位置情報の許可が拒否されました。ブラウザ設定から許可してください。"
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setMessage("現在地を取得できませんでした。屋外でもう一度試してください。");
        } else if (error.code === error.TIMEOUT) {
          setMessage("位置情報の取得がタイムアウトしました。もう一度試してください。");
        } else {
          setMessage("位置情報の取得中にエラーが発生しました。");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [revealCells]);

  const value = useMemo<AreaContextValue>(() => {
    const revealedCount = revealedCells.size;
    const totalCells = areaCells.length;
    const openedRate = ((revealedCount / totalCells) * 100).toFixed(1);

    return {
      revealedCells,
      revealedCount,
      totalCells,
      openedRate,
      resetArea,

      isTracking,
      distance,
      area,
      newAreas,
      speedKmh,
      moveStatus,
      position,
      message,
    };
  }, [
    revealedCells,
    resetArea,
    isTracking,
    distance,
    area,
    newAreas,
    speedKmh,
    moveStatus,
    position,
    message,
  ]);

  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

export function useArea() {
  const context = useContext(AreaContext);

  if (!context) {
    throw new Error("useArea must be used inside AreaProvider");
  }

  return context;
}