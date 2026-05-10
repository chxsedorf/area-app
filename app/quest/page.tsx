import BottomNav from "@/components/BottomNav";

export default function QuestPage() {
  const quests = [
    { title: "1km歩こう", progress: "0.4 / 1.0 km" },
    { title: "新しいエリアを3つ開放しよう", progress: "1 / 3 areas" },
    { title: "15分移動しよう", progress: "6 / 15 min" },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-7 pb-6 pt-10">
          <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
            DAILY MISSION
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Quest</h1>

          <div className="mt-8 rounded-[2rem] bg-[#001B2A] p-6 text-white shadow-xl">
            <p className="text-sm text-white/60">Today</p>
            <h2 className="mt-1 text-2xl font-black">今日のクエスト</h2>

            <div className="mt-6 space-y-3">
              {quests.map((quest) => (
                <div
                  key={quest.title}
                  className="rounded-2xl bg-white/10 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold">{quest.title}</p>
                    <div className="h-5 w-5 rounded-full border-2 border-white/40" />
                  </div>
                  <p className="mt-2 text-xs text-white/55">{quest.progress}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BottomNav active="quest" />
      </div>
    </main>
  );
}