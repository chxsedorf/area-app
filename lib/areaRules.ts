export type MoveStatus = "stopped" | "moving" | "fast" | "unknown";

export type AreaRule = {
  status: MoveStatus;
  label: string;
  openRangeLabel: string;
  revealRadiusMeters: number;
  gridRevealRange: number;
  areaGainKm2: number;
  canReveal: boolean;
};

export function judgeMoveStatus(speedKmh: number): MoveStatus {
  if (speedKmh <= 0) return "stopped";
  if (speedKmh < 20) return "moving";
  return "fast";
}

export function getAreaRule(status: MoveStatus): AreaRule {
  if (status === "moving") {
    return {
      status,
      label: "移動中",
      openRangeLabel: "AREA解放中",
      revealRadiusMeters: 100,
      gridRevealRange: 2,
      areaGainKm2: 0.006,
      canReveal: true,
    };
  }

  if (status === "fast") {
    return {
      status,
      label: "高速移動",
      openRangeLabel: "解放なし",
      revealRadiusMeters: 0,
      gridRevealRange: 0,
      areaGainKm2: 0,
      canReveal: false,
    };
  }

  if (status === "stopped") {
    return {
      status,
      label: "停止中",
      openRangeLabel: "解放なし",
      revealRadiusMeters: 0,
      gridRevealRange: 0,
      areaGainKm2: 0,
      canReveal: false,
    };
  }

  return {
    status,
    label: "未取得",
    openRangeLabel: "未取得",
    revealRadiusMeters: 0,
    gridRevealRange: 0,
    areaGainKm2: 0,
    canReveal: false,
  };
}