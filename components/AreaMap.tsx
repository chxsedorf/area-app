"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
} from "maplibre-gl";
import { useArea } from "@/components/AreaProvider";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

const GRID_SIZE_METERS = 50;
const METERS_PER_LAT_DEGREE = 111_320;

function getMapStyleUrl() {
  if (!MAPTILER_KEY) {
    return "https://demotiles.maplibre.org/style.json";
  }

  // シンプルな地図
  return `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`;
}

function cellIdToGridPoint(id: string) {
  const [x, y] = id.split(":").map(Number);
  return { x, y };
}

function gridPointToLngLat(x: number, y: number, latitudeHint: number) {
  const metersPerLngDegree =
    METERS_PER_LAT_DEGREE * Math.cos((latitudeHint * Math.PI) / 180);

  const lat = (y * GRID_SIZE_METERS) / METERS_PER_LAT_DEGREE;
  const lng = (x * GRID_SIZE_METERS) / metersPerLngDegree;

  return { lng, lat };
}

function buildCellRing(id: string, latitudeHint: number) {
  const { x, y } = cellIdToGridPoint(id);

  const bottomLeft = gridPointToLngLat(x, y, latitudeHint);
  const bottomRight = gridPointToLngLat(x + 1, y, latitudeHint);
  const topRight = gridPointToLngLat(x + 1, y + 1, latitudeHint);
  const topLeft = gridPointToLngLat(x, y + 1, latitudeHint);

  return [
    [bottomLeft.lng, bottomLeft.lat],
    [bottomRight.lng, bottomRight.lat],
    [topRight.lng, topRight.lat],
    [topLeft.lng, topLeft.lat],
    [bottomLeft.lng, bottomLeft.lat],
  ];
}

function buildCellPolygon(id: string, latitudeHint: number) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [buildCellRing(id, latitudeHint)],
    },
  };
}

function buildRevealedGeoJson(cellIds: string[], latitudeHint: number) {
  return {
    type: "FeatureCollection",
    features: cellIds.map((id) => buildCellPolygon(id, latitudeHint)),
  };
}

export default function AreaMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [mapReady, setMapReady] = useState(false);

  const { position, revealedCells, isTracking } = useArea();

  const mapStyle = useMemo(() => getMapStyleUrl(), []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLng = position?.longitude ?? 130.941;
    const initialLat = position?.latitude ?? 33.957;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [initialLng, initialLat],
      zoom: 17,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      })
    );

    map.on("load", () => {
      const emptyFeatureCollection = {
        type: "FeatureCollection",
        features: [],
      } as GeoJSON.FeatureCollection;

      map.addSource("revealed-cells", {
        type: "geojson",
        data: emptyFeatureCollection,
      });

      map.addSource("current-position", {
        type: "geojson",
        data: emptyFeatureCollection,
      });

      /**
       * 画面全体を暗くするオーバーレイ。
       * 未解放エリアを暗く・シンプルに見せる。
       */
      map.addLayer({
        id: "dark-overlay",
        type: "background",
        paint: {
          "background-color": "#020617",
          "background-opacity": 0.62,
        },
      });

      /**
       * 解放済みセルを明るく青く表示。
       * 穴あけではなく、上から強調するので安定する。
       */
      map.addLayer({
        id: "revealed-cells-fill",
        type: "fill",
        source: "revealed-cells",
        paint: {
          "fill-color": "#38bdf8",
          "fill-opacity": 0.48,
        },
      });

      map.addLayer({
        id: "revealed-cells-line",
        type: "line",
        source: "revealed-cells",
        paint: {
          "line-color": "#e0f2fe",
          "line-width": 1.5,
          "line-opacity": 0.95,
        },
      });

      /**
       * 解放済みセルの中心を少し光らせる。
       */
      map.addLayer({
        id: "revealed-cells-glow",
        type: "fill",
        source: "revealed-cells",
        paint: {
          "fill-color": "#7dd3fc",
          "fill-opacity": 0.16,
        },
      });

      /**
       * 現在地
       */
      map.addLayer({
        id: "current-position-point",
        type: "circle",
        source: "current-position",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffffff",
          "circle-stroke-color": "#38bdf8",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: "current-position-pulse",
        type: "circle",
        source: "current-position",
        paint: {
          "circle-radius": 18,
          "circle-color": "#38bdf8",
          "circle-opacity": 0.18,
        },
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) return;

    const latitudeHint = position?.latitude ?? 33.957;
    const cellIds = Array.from(revealedCells);

    const revealedSource = map.getSource("revealed-cells") as
      | GeoJSONSource
      | undefined;

    if (revealedSource) {
      revealedSource.setData(
        buildRevealedGeoJson(
          cellIds,
          latitudeHint
        ) as GeoJSON.FeatureCollection
      );
    }
  }, [mapReady, revealedCells, position]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !position) return;

    map.easeTo({
      center: [position.longitude, position.latitude],
      duration: 700,
      zoom: Math.max(map.getZoom(), 17),
    });

    const source = map.getSource("current-position") as
      | GeoJSONSource
      | undefined;

    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [position.longitude, position.latitude],
            },
          },
        ],
      } as GeoJSON.FeatureCollection);
    }
  }, [mapReady, position]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020912]">
      <div ref={mapContainerRef} className="h-full w-full" />

      {!MAPTILER_KEY && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-red-600/90 px-4 py-3 text-white backdrop-blur">
          <p className="text-[10px] font-bold text-white/70">MAP KEY</p>
          <p className="text-xs font-black">
            MapTiler APIキー未設定のためデモ地図です
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-[#001B2A]/80 px-4 py-3 text-white backdrop-blur">
        <p className="text-[10px] font-bold text-white/45">MAP</p>
        <p className="text-sm font-black">
          {isTracking ? "Area View" : "Waiting"}
        </p>
      </div>
    </div>
  );
}