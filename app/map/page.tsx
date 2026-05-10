"use client";

import BottomNav from "@/components/BottomNav";
import { useArea } from "@/components/AreaProvider";

export default function MapPage() {
  const {
    visibleCells,
    revealedCount,
    totalVisibleCells,
    openedRate,
    isTracking,
    distance,
    area,
    newAreas,
    speedKmh,
  } = useArea();

  return (
    <main className="min-h-screen bg-[#020912] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#020912]">
        <section className="relative flex flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0ea5e9]/20 blur-3xl" />

          <div className="absolute left-4 right-4 top-5 z-20 rounded-[2rem] border border-white/10 bg-[#001B2A]/80 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.35em] text-white/45">
                  EXPLORE YOUR
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-[0.22em]">
                  AREA
                </h1>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  isTracking
                    ? "bg-[#7dd3fc] text-[#001B2A]"
                    : "bg-white/10 text-white"
                }`}
              >
                {isTracking ? "AUTO" : "OFF"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-bold text-white/45">解放面積</p>
                <p className="mt-1 text-lg font-black">{area}</p>
                <p className="text-[10px] font-bold text-white/45">km²</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-bold text-white/45">移動距離</p>
                <p className="mt-1 text-lg font-black">{distance}</p>
                <p className="text-[10px] font-bold text-white/45">km</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-bold text-white/45">新規マス</p>
                <p className="mt-1 text-lg font-black">{newAreas}</p>
                <p className="text-[10px] font-bold text-white/45">cells</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-32 pt-48">
            <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] gap-[4px]">
                {visibleCells.map((cell) => {
                  let cellClass =
                    "relative aspect-square rounded-[8px] border border-white/5 bg-white/[0.035] transition-all duration-500";

                  if (cell.isRevealed) {
                    cellClass =
                      "relative aspect-square rounded-[8px] border border-[#7dd3fc]/35 bg-[#0ea5e9]/45 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all duration-500";
                  }

                  if (cell.isCurrentPosition) {
                    cellClass =
                      "relative aspect-square rounded-[8px] border border-white bg-white shadow-[0_0_24px_rgba(255,255,255,1)] transition-all duration-500";
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
            </div>
          </div>

          <div className="absolute bottom-[76px] left-4 right-4 z-20 rounded-[2rem] border border-white/10 bg-[#001B2A]/80 p-4 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-bold text-white/45">速度</p>
                <p className="mt-1 text-lg font-black">{speedKmh}</p>
                <p className="text-[10px] font-bold text-white/45">km/h</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-bold text-white/45">表示解放率</p>
                <p className="mt-1 text-lg font-black">{openedRate}%</p>
                <p className="text-[10px] font-bold text-white/45">
                  total {revealedCount} cells
                </p>
              </div>
            </div>
          </div>
        </section>

        <BottomNav active="map" />
      </div>
    </main>
  );
}