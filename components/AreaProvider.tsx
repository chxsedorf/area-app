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
import {
  buildVisibleGridCells,
  getRevealGridIds,
  positionToGridPoint,
  type GridPoint,
  type VisibleGridCell,
} from "@/lib/grid";

type PositionData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

const STORAGE_KEY = "area_revealed_cells_v2";
const DAILY_STORAGE_KEY = "area_daily_stats_v2";

type DailyStats = {
  distance: number;
  area: number;
  newAreas: number;
};

type AreaContextValue = {
  revealedCells: Set<string>;
  visibleCells: VisibleGridCell[];
  revealedCount: number;

  /**
   * Quest / Profile 互換用。
   * 現段階では「現在表示中の9×9グリッドの総マス数」として扱う。
   */
  totalCells: number;

  /**
   * Map画面用。
   * 現在表示中の9×9グリッドの総マス数。
   */
  totalVisibleCells: number;

  openedRate: string;
  resetArea: () => void;

  isTracking: boolean;
  distance: number;
  area: number;
  newAreas: number;
  speedKmh: number;
  moveStatus: MoveStatus;
  position: PositionData | null;
  currentGrid: GridPoint | null;
  message: string;
};

const AreaContext = createContext<AreaContextValue | null>(null);

function loadRevealedCells() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return new Set<string>();
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set<string>(parsed);
  } catch {
    return new Set<string>();
  }
}

function saveRevealedCells(cells: Set<string>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cells)));
}

function loadDailyStats(): DailyStats {
  if (typeof window === "undefined") {
    return {
      distance: 0,
      area: 0,
      newAreas: 0,
    };
  }

  try {
    const saved = window.localStorage.getItem(DAILY_STORAGE_KEY);

    if (!saved) {
      return {
        distance: 0,
        area: 0,
        newAreas: 0,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      distance: Number(parsed.distance ?? 0),
      area: Number(parsed.area ?? 0),
      newAreas: Number(parsed.newAreas ?? 0),
    };
  } catch {
    return {
      distance: 0,
      area: 0,
      newAreas: 0,
    };
  }
}

function saveDailyStats(stats: DailyStats) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(stats));
}

export function AreaProvider({ children }: { children: ReactNode }) {
  const watchIdRef = useRef<number | null>(null);
  const previousPositionRef = useRef<PositionData | null>(null);

  const [revealedCells, setRevealedCells] = useState<Set<string>>(
    () => new Set<string>()
  );

  const [hasLoaded, setHasLoaded] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [area, setArea] = useState(0);
  const [newAreas, setNewAreas] = useState(0);

  const [speedKmh, setSpeedKmh] = useState(0);
  const [moveStatus, setMoveStatus] = useState<MoveStatus>("unknown");
  const [position, setPosition] = useState<PositionData | null>(null);
  const [currentGrid, setCurrentGrid] = useState<GridPoint | null>(null);
  const [message, setMessage] = useState("位置情報を準備しています。");

  useEffect(() => {
    const loadedCells = loadRevealedCells();
    const stats = loadDailyStats();

    setRevealedCells(loadedCells);
    setDistance(stats.distance);
    setArea(stats.area);
    setNewAreas(stats.newAreas);

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    saveRevealedCells(revealedCells);
  }, [revealedCells, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;

    saveDailyStats({
      distance,
      area,
      newAreas,
    });
  }, [distance, area, newAreas, hasLoaded]);

  const revealCellsByPosition = useCallback((grid: GridPoint) => {
    const revealIds = getRevealGridIds(grid);
    let addedCount = 0;

    setRevealedCells((prevCells) => {
      const nextCells = new Set(prevCells);

      for (const id of revealIds) {
        if (!nextCells.has(id)) {
          nextCells.add(id);
          addedCount += 1;
        }
      }

      return nextCells;
    });

    return addedCount;
  }, []);

  const resetArea = useCallback(() => {
    const emptyCells = new Set<string>();

    setRevealedCells(emptyCells);
    saveRevealedCells(emptyCells);

    setDistance(0);
    setArea(0);
    setNewAreas(0);
    setSpeedKmh(0);
    setMoveStatus("unknown");
    setMessage("AREAを初期化しました。");

    saveDailyStats({
      distance: 0,
      area: 0,
      newAreas: 0,
    });

    previousPositionRef.current = null;
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

        const grid = positionToGridPoint(current.latitude, current.longitude);

        setPosition(current);
        setCurrentGrid(grid);

        const previous = previousPositionRef.current;

        /**
         * 初回現在地取得時：
         * 止まっていても、まず現在地周辺100mを解放する。
         * これにより、アプリを開いた瞬間に自分の周辺だけ地図が見える。
         */
        if (!previous) {
          previousPositionRef.current = current;

          const addedCount = revealCellsByPosition(grid);

          if (addedCount > 0) {
            setNewAreas((prevValue) => prevValue + addedCount);
            setArea((prevValue) =>
              Number((prevValue + 0.006 * addedCount).toFixed(3))
            );
          }

          setMessage(
            "現在地周辺100mのAREAを解放しました。移動するとさらに広がります。"
          );
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
            const addedCount = revealCellsByPosition(grid);

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
          setMessage("移動が小さいため、マスはまだ追加解放されていません。");
          return;
        }

        if (rule.canReveal) {
          setMessage(
            "1km/h以上〜20km/h未満で移動中。現在地周辺のAREAを解放しています。"
          );
        } else {
          setMessage("停止中、または20km/h以上のため、AREAは解放されません。");
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
  }, [revealCellsByPosition]);

  const value = useMemo<AreaContextValue>(() => {
    const visibleCells = buildVisibleGridCells({
      center: currentGrid,
      revealedCells,
      size: 9,
    });

    const totalVisibleCells = visibleCells.length;
    const visibleRevealedCount = visibleCells.filter(
      (cell) => cell.isRevealed
    ).length;

    const openedRate = (
      (visibleRevealedCount / totalVisibleCells) *
      100
    ).toFixed(1);

    return {
      revealedCells,
      visibleCells,
      revealedCount: revealedCells.size,

      // Quest / Profile 互換用
      totalCells: totalVisibleCells,

      totalVisibleCells,
      openedRate,
      resetArea,

      isTracking,
      distance,
      area,
      newAreas,
      speedKmh,
      moveStatus,
      position,
      currentGrid,
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
    currentGrid,
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