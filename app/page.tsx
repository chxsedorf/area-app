"use client";

import BottomNav from "@/components/BottomNav";
import { useArea } from "@/components/AreaProvider";

type Quest = {
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
};

export default function QuestPage() {
  const { revealedCount, totalCells, openedRate } = useArea();

  const openedRateNumber = Number(openedRate);

  const quests: Quest[] = [
    {
      title: "AREAを10マス解放しよう",
      description: "20km/h以下で移動して、AREAを広げよう。",
      current: revealedCount,
      target: 10,
      unit: "cells",
    },
    {
      title: "AREAを25マス解放しよう",
      description: "徒歩・ランニングで効率よくマスを解放しよう。",
      current: revealedCount,
      target: 25,
      unit: "cells",
    },
    {
      title: "解放率30%を目指そう",
      description: "地図の未解放マスを少しずつ埋めよう。",
      current: openedRateNumber,
      target: 30,
      unit: "%",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-7 pb-6 pt-10">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
              DAILY MISSION
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Quest</h1>
          </div>

          {/* Summary */}
          <div className="mt-8 rounded-[2rem] bg-[#001B2A] p-6 text-white shadow-xl">
            <p className="text-sm font-semibold text-white/60">Today</p>
            <h2 className="mt-1 text-2xl font-black">今日のクエスト</h2>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放マス</p>
                <p className="mt-2 text-2xl font-black">{revealedCount}</p>
                <p className="text-xs text-white/55">/ {totalCells}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">解放率</p>
                <p className="mt-2 text-2xl font-black">{openedRate}</p>
                <p className="text-xs text-white/55">%</p>
              </div>
            </div>
          </div>

          {/* Quest List */}
          <div className="mt-6 space-y-4">
            {quests.map((quest) => {
              const progress = Math.min(
                (quest.current / quest.target) * 100,
                100
              );

              const isCompleted = quest.current >= quest.target;

              return (
                <div
                  key={quest.title}
                  className="rounded-[2rem] border border-[#e6edf3] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-black">{quest.title}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#6b7a88]">
                        {quest.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        isCompleted
                          ? "bg-[#001B2A] text-white"
                          : "border-2 border-[#d8e1e8] text-[#9aa8b5]"
                      }`}
                    >
                      {isCompleted ? "✓" : ""}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>
                        {Math.min(quest.current, quest.target).toFixed(
                          quest.unit === "%" ? 1 : 0
                        )}{" "}
                        / {quest.target} {quest.unit}
                      </span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf2f6]">
                      <div
                        className="h-full rounded-full bg-[#001B2A] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rule */}
          <div className="mt-6 rounded-[2rem] bg-[#f3f6f8] p-5">
            <p className="text-sm font-black">解放ルール</p>
            <p className="mt-2 text-xs font-bold leading-6 text-[#6b7a88]">
              AREAは時速20km以下で通過したマスだけ解放されます。
              徒歩・ランニングでは広めに解放され、20km/hを超える移動では解放されません。
            </p>
          </div>
        </section>

        <BottomNav active="quest" />
      </div>
    </main>
  );
}