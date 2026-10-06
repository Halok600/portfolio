"use client";

import { useSyncExternalStore } from "react";

const TZ = "Asia/Kolkata"; // Noida

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}
const getTime = () => fmt.format(new Date());
const getServerTime = () => "--:--";

export function LocalTime({ city, className }: { city: string; className?: string }) {
  const t = useSyncExternalStore(subscribe, getTime, getServerTime);
  return (
    <span className={className} suppressHydrationWarning>
      {city} {t} IST
    </span>
  );
}
