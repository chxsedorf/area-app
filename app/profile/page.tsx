"use client";

import BottomNav from "@/components/BottomNav";
import { useArea } from "@/components/AreaProvider";

export default function ProfilePage() {
  const { revealedCount, totalCells, openedRate, resetArea } = useArea();

  const estimatedArea = (revealedCount * 0.0025).toFixed(3);

  const handleReset = () => {
    const confirmed = window.confirm(
      "AREAの解放データを初期化しますか？\nこの操作は元に戻せません。"
    );

    if (!confirmed) return;

    resetArea();
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-7 pb-6 pt-10">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
              EXPLORER DATA
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Profile
            </h1>
          </div>

          {/* Profile Card */}
          <div className="mt-8 rounded-[2rem] bg-[#001B2A] p-6 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-2xl font-black text-[#001B2A]">
                A
              </div>

              <div>
                <p className="text-sm text-white/60">Lv. 1</p>
                <h2 className="text-2xl font-black">New Explorer</h2>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放面積</p>
                <p className="mt-2 text-2xl font-black">{estimatedArea}</p>
                <p className="text-xs text-white/55">km²</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放率</p>
                <p className="mt-2 text-2xl font-black">{openedRate}</p>
                <p className="text-xs text-white/55">%</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放マス</p>
                <p className="mt-2 text-2xl font-black">{revealedCount}</p>
                <p className="text-xs text-white/55">/ {totalCells}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">称号</p>
                <p className="mt-2 text-lg font-black">開拓者</p>
              </div>
            </div>
          </div>

          {/* Rule Card */}
          <div className="mt-6 rounded-[2rem] border border-[#e6edf3] bg-white p-5 shadow-sm">
            <p className="text-sm font-black">AREA Rule</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-sm font-black">徒歩・ランニング</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#6b7a88]">
                  1〜18km/h：周囲100mのAREAを解放
                </p>
              </div>

              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-sm font-black">低速通過</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#6b7a88]">
                  18〜20km/h：通過したマスのみ解放
                </p>
              </div>

              <div className="rounded-2xl bg-[#f3f6f8] p-4">
                <p className="text-sm font-black">高速移動</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#6b7a88]">
                  20km/h超：AREAは解放されません
                </p>
              </div>
            </div>
          </div>

          {/* Reset */}
          <div className="mt-6 rounded-[2rem] border border-red-100 bg-red-50 p-5">
            <p className="text-sm font-black text-red-950">開発用メニュー</p>
            <p className="mt-2 text-xs font-bold leading-5 text-red-900/70">
              テスト中に解放したAREAを初期状態に戻します。
              localStorageに保存された解放マスもリセットされます。
            </p>

            <button
              onClick={handleReset}
              className="mt-4 w-full rounded-2xl bg-red-600 py-4 text-sm font-black tracking-[0.2em] text-white transition hover:scale-[1.02] active:scale-[0.98]"
            >
              AREAを初期化
            </button>
          </div>
        </section>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}