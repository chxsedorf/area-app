import Link from "next/link";

type BottomNavProps = {
  active: "map" | "quest" | "profile";
};

export default function BottomNav({ active }: BottomNavProps) {
  const items = [
    { key: "map", label: "Map", href: "/map" },
    { key: "quest", label: "Quest", href: "/quest" },
    { key: "profile", label: "Profile", href: "/profile" },
  ] as const;

  return (
    <nav className="grid grid-cols-3 border-t border-white/10 bg-[#001B2A]/95 px-4 py-3 text-center text-xs font-bold text-white/45 backdrop-blur">
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={isActive ? "text-white" : "text-white/45"}
          >
            {isActive && (
              <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full bg-[#7dd3fc]" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}