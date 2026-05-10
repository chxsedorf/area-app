"use client";

import { useEffect, useMemo, useRef } from "react";
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

  // 衛星写真ベースのリアル地図
  return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
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

function buildCellPolygon(id: string, latitudeHint: number) {
  const { x, y } = cellIdToGridPoint(id);

  const bottomLeft = gridPointToLngLat(x, y, latitudeHint);
  const bottomRight = gridPointToLngLat(x + 1, y, latitudeHint);
  const topRight = gridPointToLngLat(x + 1, y + 1, latitudeHint);
  const topLeft = gridPointToLngLat(x, y + 1, latitudeHint);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [bottomLeft.lng, bottomLeft.lat],
          [bottomRight.lng, bottomRight.lat],
          [topRight.lng, topRight.lat],
          [topLeft.lng, topLeft.lat],
          [bottomLeft.lng, bottomLeft.lat],
        ],
      ],
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
      map.addSource("revealed-cells", {
        type: "geojson",
        data: buildRevealedGeoJson(
          Array.from(revealedCells),
          position?.latitude ?? initialLat
        ) as GeoJSON.FeatureCollection,
      });

      map.addLayer({
        id: "revealed-cells-fill",
        type: "fill",
        source: "revealed-cells",
        paint: {
          "fill-color": "#00AEEF",
          "fill-opacity": 0.34,
        },
      });

      map.addLayer({
        id: "revealed-cells-line",
        type: "line",
        source: "revealed-cells",
        paint: {
          "line-color": "#7dd3fc",
          "line-width": 1.6,
          "line-opacity": 0.95,
        },
      });

      map.addSource("current-position", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "current-position-point",
        type: "circle",
        source: "current-position",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffffff",
          "circle-stroke-color": "#00AEEF",
          "circle-stroke-width": 3,
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

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
      });
    }
  }, [position]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("revealed-cells") as
      | GeoJSONSource
      | undefined;

    if (!source) return;

    source.setData(
      buildRevealedGeoJson(
        Array.from(revealedCells),
        position?.latitude ?? 33.957
      ) as GeoJSON.FeatureCollection
    );
  }, [revealedCells, position]);

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
          {isTracking ? "Live tracking" : "Waiting"}
        </p>
      </div>
    </div>
  );
}