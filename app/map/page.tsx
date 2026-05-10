"use client";

import BottomNav from "@/components/BottomNav";
import { areaCells, useArea } from "@/components/AreaProvider";

export default function MapPage() {
  const { revealedCells, revealedCount, totalCells, openedRate } = useArea();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-6 pb-6 pt-10">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
                YOUR AREA
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">Map</h1>
            </div>

            <div className="rounded-full bg-[#001B2A] px-4 py-2 text-xs font-black text-white">
              {openedRate}%
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-[#f3f6f8] p-4">
              <p className="text-[11px] font-bold text-[#6b7a88]">解放面積</p>
              <p className="mt-2 text-xl font-black">
                {(revealedCount * 0.0025).toFixed(3)}
              </p>
              <p className="text-[11px] font-bold text-[#6b7a88]">km²</p>
            </div>

            <div className="rounded-3xl bg-[#f3f6f8] p-4">
              <p className="text-[11px] font-bold text-[#6b7a88]">GRID</p>
              <p className="mt-2 text-xl font-black">50</p>
              <p className="text-[11px] font-bold text-[#6b7a88]">m</p>
            </div>

            <div className="rounded-3xl bg-[#f3f6f8] p-4">
              <p className="text-[11px] font-bold text-[#6b7a88]">解放マス</p>
              <p className="mt-2 text-xl font-black">{revealedCount}</p>
              <p className="text-[11px] font-bold text-[#6b7a88]">
                / {totalCells}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="mt-6 overflow-hidden rounded-[2rem] bg-[#061421] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">AREA Grid</p>
                <p className="mt-1 text-xs font-bold text-white/45">
                  Homeで解放したマスがここにも反映されます
                </p>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white">
                LIVE GRID
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.5rem] bg-[#020912] p-3">
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0ea5e9]/20 blur-3xl" />

              <div className="relative z-10 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-[4px]">
                {areaCells.map((cell) => {
                  const isRevealed = revealedCells.has(cell.id);

                  let cellClass =
                    "relative aspect-square rounded-[8px] border border-white/5 bg-white/[0.035] transition-all duration-500";

                  if (isRevealed) {
                    cellClass =
                      "relative aspect-square rounded-[8px] border border-[#7dd3fc]/35 bg-[#0ea5e9]/45 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all duration-500";
                  }

                  if (cell.isCurrentPosition) {
                    cellClass =
                      "relative aspect-square rounded-[8px] border border-white bg-white shadow-[0_0_24px_rgba(255,255,255,1)] transition-all duration-500";
                  }

                  return <div key={cell.id} className={cellClass} />;
                })}
              </div>

              <div className="absolute left-5 top-5 z-20 rounded-2xl bg-black/40 px-3 py-2 backdrop-blur">
                <p className="text-[11px] font-bold text-white/60">RULE</p>
                <p className="text-sm font-black text-white">≤20km/h 解放</p>
              </div>

              <div className="absolute bottom-5 right-5 z-20 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-[11px] font-bold text-white/60">OPENED</p>
                <p className="text-sm font-black text-white">
                  {revealedCount} / {totalCells}
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f3f6f8] p-3">
              <div className="h-4 w-4 rounded bg-[#0ea5e9]/60 shadow-[0_0_10px_rgba(56,189,248,0.4)]" />
              <p className="mt-2 text-[11px] font-black">解放済み</p>
              <p className="mt-1 text-[10px] font-bold text-[#6b7a88]">
                20km/h以下
              </p>
            </div>

            <div className="rounded-2xl bg-[#f3f6f8] p-3">
              <div className="h-4 w-4 rounded bg-white shadow-[0_0_10px_rgba(0,0,0,0.15)]" />
              <p className="mt-2 text-[11px] font-black">現在地</p>
              <p className="mt-1 text-[10px] font-bold text-[#6b7a88]">
                現在の中心
              </p>
            </div>

            <div className="rounded-2xl bg-[#f3f6f8] p-3">
              <div className="h-4 w-4 rounded bg-white/[0.08] ring-1 ring-[#001B2A]/10" />
              <p className="mt-2 text-[11px] font-black">未解放</p>
              <p className="mt-1 text-[10px] font-bold text-[#6b7a88]">
                20km/h超は無効
              </p>
            </div>
          </div>
        </section>

        <BottomNav active="map" />
      </div>
    </main>
  );
}