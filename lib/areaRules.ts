export type MoveStatus = "stopped" | "human" | "slow_pass" | "fast" | "unknown";

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
  if (speedKmh < 1) return "stopped";
  if (speedKmh <= 18) return "human";
  if (speedKmh <= 20) return "slow_pass";
  return "fast";
}

export function getAreaRule(status: MoveStatus): AreaRule {
  if (status === "human") {
    return {
      status,
      label: "徒歩・ランニング",
      openRangeLabel: "周囲100m解放",
      revealRadiusMeters: 100,
      gridRevealRange: 2,
      areaGainKm2: 0.006,
      canReveal: true,
    };
  }

  if (status === "slow_pass") {
    return {
      status,
      label: "低速通過",
      openRangeLabel: "通過マスのみ解放",
      revealRadiusMeters: 25,
      gridRevealRange: 0,
      areaGainKm2: 0.001,
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