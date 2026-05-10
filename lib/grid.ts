export const GRID_SIZE_METERS = 50;
export const REVEAL_RADIUS_METERS = 100;

const METERS_PER_LAT_DEGREE = 111_320;

export type GridPoint = {
  x: number;
  y: number;
};

export type VisibleGridCell = {
  id: string;
  x: number;
  y: number;
  row: number;
  col: number;
  isCurrentPosition: boolean;
  isRevealed: boolean;
  isRevealTarget: boolean;
};

export function getLngMeterRatio(latitude: number) {
  const latitudeRad = (latitude * Math.PI) / 180;
  return METERS_PER_LAT_DEGREE * Math.cos(latitudeRad);
}

export function positionToGridPoint(
  latitude: number,
  longitude: number
): GridPoint {
  const metersPerLngDegree = getLngMeterRatio(latitude);

  const y = Math.floor((latitude * METERS_PER_LAT_DEGREE) / GRID_SIZE_METERS);
  const x = Math.floor((longitude * metersPerLngDegree) / GRID_SIZE_METERS);

  return { x, y };
}

export function gridPointToId(point: GridPoint) {
  return `${point.x}:${point.y}`;
}

export function getRevealGridIds(center: GridPoint) {
  const revealRange = Math.ceil(REVEAL_RADIUS_METERS / GRID_SIZE_METERS);
  const ids: string[] = [];

  for (let dy = -revealRange; dy <= revealRange; dy += 1) {
    for (let dx = -revealRange; dx <= revealRange; dx += 1) {
      const distanceMeters = Math.sqrt(dx * dx + dy * dy) * GRID_SIZE_METERS;

      if (distanceMeters <= REVEAL_RADIUS_METERS) {
        ids.push(
          gridPointToId({
            x: center.x + dx,
            y: center.y + dy,
          })
        );
      }
    }
  }

  return ids;
}

export function buildVisibleGridCells(params: {
  center: GridPoint | null;
  revealedCells: Set<string>;
  size?: number;
}): VisibleGridCell[] {
  const { center, revealedCells, size = 9 } = params;

  const fallbackCenter = center ?? { x: 0, y: 0 };
  const half = Math.floor(size / 2);
  const revealTargetIds = new Set(getRevealGridIds(fallbackCenter));

  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;

    const x = fallbackCenter.x + (col - half);
    const y = fallbackCenter.y + (row - half);
    const id = gridPointToId({ x, y });

    return {
      id,
      x,
      y,
      row,
      col,
      isCurrentPosition: row === half && col === half,
      isRevealed: revealedCells.has(id),
      isRevealTarget: revealTargetIds.has(id),
    };
  });
}