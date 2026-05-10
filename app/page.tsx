"use client";

import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { areaCells, useArea } from "@/components/AreaProvider";
import { getDistanceKm } from "@/lib/distance";
import { getAreaRule, judgeMoveStatus, type MoveStatus } from "@/lib/areaRules";

type PositionData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export default function Home() {
  const watchIdRef = useRef<number | null>(null);
  const previousPositionRef = useRef<PositionData | null>(null);

  const {
    revealedCells,
    revealedCount,
    totalCells,
    openedRate,
    revealCells,
  } = useArea();

  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [area, setArea] = useState(0);
  const [newAreas, setNewAreas] = useState(0);

  const [speedKmh, setSpeedKmh] = useState(0);
  const [moveStatus, setMoveStatus] = useState<MoveStatus>("unknown");
  const [position, setPosition] = useState<PositionData | null>(null);
  const [message, setMessage] = useState("位置情報を準備しています。");

  const currentRule = getAreaRule(moveStatus);

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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-7 pb-6 pt-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
                EXPLORE YOUR
              </p>
              <h1 className="mt-2 text-5xl font-black tracking-[0.22em] text-[#001B2A]">
                AREA
              </h1>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#001B2A] shadow-lg">
              <div className="relative h-9 w-9">
                <div className="absolute left-1/2 top-0 h-9 w-7 -translate-x-1/2 bg-white [clip-path:polygon(50%_0%,100%_100%,70%_100%,50%_45%,30%_100%,0%_100%)]" />
                <div className="absolute left-1/2 top-[18px] h-3 w-3 -translate-x-1/2 rounded-full bg-[#001B2A]" />
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-10">
            <p className="text-3xl font-black leading-tight tracking-tight">
              歩いた場所が、
              <br />
              あなたのAREAになる。
            </p>
            <p className="mt-5 text-sm leading-7 text-[#5b6a78]">
              アプリを開くと自動で位置情報を取得します。
              時速20km以下で通過したマスだけAREAとして解放されます。
            </p>
          </div>

          {/* Today Card */}
          <div className="mt-8 rounded-[2rem] bg-[#001B2A] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white/60">Today</p>
                <h2 className="mt-1 text-2xl font-black">今日のAREA</h2>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isTracking
                    ? "bg-[#7dd3fc] text-[#001B2A]"
                    : "bg-white/10 text-white"
                }`}
              >
                {isTracking ? "AUTO" : "OFF"}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放面積</p>
                <p className="mt-2 text-xl font-black">{area}</p>
                <p className="text-xs text-white/55">km²</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">移動距離</p>
                <p className="mt-2 text-xl font-black">{distance}</p>
                <p className="text-xs text-white/55">km</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">新規マス</p>
                <p className="mt-2 text-xl font-black">{newAreas}</p>
                <p className="text-xs text-white/55">cells</p>
              </div>
            </div>
          </div>

          {/* Live Status */}
          <div className="mt-6 rounded-[2rem] border border-[#e6edf3] bg-white p-5 shadow-sm">
            <p className="text-sm font-black">Live Status</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-xs font-bold text-[#6b7a88]">速度</p>
                <p className="mt-2 text-2xl font-black">{speedKmh}</p>
                <p className="text-xs font-bold text-[#6b7a88]">km/h</p>
              </div>

              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-xs font-bold text-[#6b7a88]">状態</p>
                <p className="mt-2 text-lg font-black">{currentRule.label}</p>
                <p className="text-xs font-bold text-[#6b7a88]">
                  {currentRule.openRangeLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-xs font-bold text-[#6b7a88]">解放半径</p>
                <p className="mt-2 text-2xl font-black">
                  {currentRule.revealRadiusMeters}
                </p>
                <p className="text-xs font-bold text-[#6b7a88]">m</p>
              </div>

              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-xs font-bold text-[#6b7a88]">判定</p>
                <p className="mt-2 text-lg font-black">
                  {moveStatus === "human"
                    ? "MAX"
                    : moveStatus === "slow_pass"
                    ? "LOW"
                    : moveStatus === "fast"
                    ? "OFF"
                    : moveStatus === "stopped"
                    ? "OFF"
                    : "-"}
                </p>
                <p className="text-xs font-bold text-[#6b7a88]">AREA RULE</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#f3f6f8] p-4">
              <p className="text-xs font-bold text-[#6b7a88]">メッセージ</p>
              <p className="mt-2 text-sm font-bold leading-6">{message}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#f3f6f8] p-4">
              <p className="text-xs font-bold text-[#6b7a88]">現在地</p>
              {position ? (
                <div className="mt-2 space-y-1 text-xs font-bold text-[#001B2A]">
                  <p>緯度：{position.latitude.toFixed(6)}</p>
                  <p>経度：{position.longitude.toFixed(6)}</p>
                  <p>精度：約{Math.round(position.accuracy)}m</p>
                </div>
              ) : (
                <p className="mt-2 text-sm font-bold">未取得</p>
              )}
            </div>
          </div>

          {/* Grid Map Preview */}
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#e6edf3] bg-[#061421] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Grid Preview</p>
                <p className="mt-1 text-xs font-bold text-white/45">
                  20km/h以下で通過したマスを解放
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                  currentRule.canReveal
                    ? "bg-[#7dd3fc] text-[#001B2A]"
                    : "bg-white/10 text-white"
                }`}
              >
                {currentRule.canReveal ? "OPEN" : "LOCKED"}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-[#020912] p-3">
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0ea5e9]/20 blur-3xl" />

              <div className="relative z-10 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-[3px]">
                {areaCells.map((cell) => {
                  const isRevealed = revealedCells.has(cell.id);

                  let cellClass =
                    "relative aspect-square rounded-[6px] border border-white/5 bg-white/[0.035] transition-all duration-500";

                  if (isRevealed) {
                    cellClass =
                      "relative aspect-square rounded-[6px] border border-[#7dd3fc]/30 bg-[#0ea5e9]/45 shadow-[0_0_10px_rgba(56,189,248,0.35)] transition-all duration-500";
                  }

                  if (cell.isCurrentPosition) {
                    cellClass =
                      "relative aspect-square rounded-[6px] border border-white bg-white shadow-[0_0_22px_rgba(255,255,255,1)] transition-all duration-500";
                  }

                  return (
                    <div key={cell.id} className={cellClass}>
                      {cell.isCurrentPosition && isTracking && (
                        <div className="absolute -inset-2 animate-ping rounded-lg bg-white/25" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute left-3 top-3 z-20 rounded-2xl bg-black/35 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">RULE</p>
                <p className="text-xs font-black text-white">≤20km/h</p>
              </div>

              <div className="absolute bottom-3 right-3 z-20 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">OPENED</p>
                <p className="text-xs font-black text-white">
                  {revealedCount} / {totalCells} cells
                </p>
              </div>

              <div className="absolute right-3 top-3 z-20 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">RATE</p>
                <p className="text-xs font-black text-white">{openedRate}%</p>
              </div>
            </div>
          </div>
        </section>

        <BottomNav active="home" />
      </div>
    </main>
  );
}