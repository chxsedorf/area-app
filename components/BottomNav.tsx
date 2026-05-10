import Link from "next/link";

type BottomNavProps = {
  active: "home" | "map" | "quest" | "profile";
};

export default function BottomNav({ active }: BottomNavProps) {
  const items = [
    { key: "home", label: "Home", href: "/" },
    { key: "map", label: "Map", href: "/map" },
    { key: "quest", label: "Quest", href: "/quest" },
    { key: "profile", label: "Profile", href: "/profile" },
  ] as const;

  return (
    <nav className="grid grid-cols-4 border-t border-[#e6edf3] bg-white px-4 py-3 text-center text-xs font-bold text-[#8794a1]">
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={isActive ? "text-[#001B2A]" : "text-[#8794a1]"}
          >
            {isActive && (
              <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full bg-[#001B2A]" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
