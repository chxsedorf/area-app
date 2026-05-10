import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#001B2A]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl">
        <section className="flex flex-1 flex-col px-7 pb-6 pt-10">
          <p className="text-xs font-semibold tracking-[0.35em] text-[#6b7a88]">
            EXPLORER DATA
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Profile</h1>

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
                <p className="text-xs text-white/55">総開放面積</p>
                <p className="mt-2 text-2xl font-black">0.32</p>
                <p className="text-xs text-white/55">km²</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">総移動距離</p>
                <p className="mt-2 text-2xl font-black">2.4</p>
                <p className="text-xs text-white/55">km</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">称号</p>
                <p className="mt-2 text-lg font-black">開拓者</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">連続記録</p>
                <p className="mt-2 text-2xl font-black">1</p>
                <p className="text-xs text-white/55">day</p>
              </div>
            </div>
          </div>
        </section>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}