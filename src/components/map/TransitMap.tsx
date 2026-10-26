import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Locate,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTransit } from '../../context/TransitContext';
import { BusRoute, BusStop } from '../../types/transit';
import { calculateStopETA } from '../../services/etaEngine';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDv8Yd8_tA-fpaDMFlwSBJwyisCDeR33Hs';

// Helper component that renders Route Polylines onto the Google Map instance
const RoutePolylines: React.FC<{
  routes: BusRoute[];
  selectedRouteId?: string;
  onSelectRoute: (r: BusRoute) => void;
}> = ({ routes, selectedRouteId, onSelectRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    const polylines: google.maps.Polyline[] = [];

    routes.forEach((route) => {
      if (!route.geometry || route.geometry.length < 2) return;

      const path = route.geometry.map(([lat, lng]) => ({ lat, lng }));
      const isSelected = selectedRouteId === route.id;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: route.color || (isSelected ? '#38bdf8' : '#2563eb'),
        strokeOpacity: isSelected ? 0.95 : 0.65,
        strokeWeight: isSelected ? 6 : 4,
        map,
        zIndex: isSelected ? 10 : 2,
      });

      polyline.addListener('click', () => {
        onSelectRoute(route);
      });

      polylines.push(polyline);
    });

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, routes, selectedRouteId, onSelectRoute]);

  return null;
};

// Helper component to auto-pan / fit bounds when selected route changes
const MapBoundsController: React.FC<{
  route: BusRoute | null;
  userCoords: { lat: number; lng: number } | null;
}> = ({ route, userCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (route?.geometry && route.geometry.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      route.geometry.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      if (userCoords) {
        bounds.extend(userCoords);
      }
      map.fitBounds(bounds, { top: 70, right: 30, bottom: 80, left: 30 });
    }
  }, [map, route, userCoords]);

  return null;
};

export const TransitMap: React.FC = () => {
  const {
    routes,
    stops,
    schedules,
    reports,
    selectedRoute,
    setSelectedRoute,
    selectedStop,
    setSelectedStop,
  } = useTransit();

  const [mapFilterRouteId, setMapFilterRouteId] = useState<string>(
    selectedRoute?.id || 'all'
  );
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Synchronize route filter state with selectedRoute
  useEffect(() => {
    if (selectedRoute) {
      setMapFilterRouteId(selectedRoute.id);
    }
  }, [selectedRoute]);

  const activeRoutes = useMemo(() => {
    return mapFilterRouteId === 'all'
      ? routes
      : routes.filter((r) => r.id === mapFilterRouteId);
  }, [routes, mapFilterRouteId]);

  // Stops to display based on selected filter
  const stopsToRender = useMemo(() => {
    if (mapFilterRouteId === 'all') return stops;
    const targetRoute = routes.find((r) => r.id === mapFilterRouteId);
    if (!targetRoute) return stops;
    const stopIdSet = new Set(targetRoute.stops.map((s) => s.stopId));
    return stops.filter((s) => stopIdSet.has(s.id));
  }, [stops, routes, mapFilterRouteId]);

  // Handle Geolocation with browser permissions
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const activeRouteForETA =
    selectedRoute || routes.find((r) => r.id === mapFilterRouteId) || routes[0];

  const stopETA = selectedStop && activeRouteForETA
    ? calculateStopETA(activeRouteForETA, selectedStop.id, stops, schedules, reports)
    : null;

  return (
    <div className="relative w-full h-[calc(100vh-4rem-3.5rem)] md:h-[calc(100vh-4rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Floating Control Panel */}
      <div className="absolute top-3 left-3 right-3 md:left-4 md:right-auto md:w-96 z-20 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white tracking-tight">
              Google Maps Transit Explorer
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {stopsToRender.length} Stops
          </span>
        </div>

        {/* Route Selector Dropdown */}
        <div className="flex gap-2">
          <select
            value={mapFilterRouteId}
            onChange={(e) => {
              const val = e.target.value;
              setMapFilterRouteId(val);
              if (val !== 'all') {
                const found = routes.find((r) => r.id === val);
                if (found) setSelectedRoute(found);
              }
            }}
            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">All Transit Corridors</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeNumber} — {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Map Type Switcher Buttons */}
        <div className="mt-2.5 flex items-center justify-between gap-1 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Map Style:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                mapTypeId === 'roadmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapTypeId('satellite')}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                mapTypeId === 'satellite'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                mapTypeId === 'hybrid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setMapTypeId('terrain')}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                mapTypeId === 'terrain'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>

        {/* Ethical Transparency badge */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>Stops & Road Geometry</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Real Google Maps
          </span>
        </div>
      </div>

      {/* Floating Geolocation Button */}
      <div className="absolute bottom-20 md:bottom-6 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          className="w-11 h-11 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-blue-400 border border-slate-700 shadow-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          title="Locate my position (GPS)"
        >
          <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute top-20 left-4 right-4 md:left-auto md:right-4 z-20 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Google Maps Viewport with APIProvider */}
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <div className="w-full h-full relative">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: 30.43, lng: 76.54 }}
            defaultZoom={11}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Draw corridor polylines on Google Map */}
            <RoutePolylines
              routes={activeRoutes}
              selectedRouteId={selectedRoute?.id}
              onSelectRoute={setSelectedRoute}
            />

            {/* Auto fit map bounds controller */}
            <MapBoundsController
              route={selectedRoute}
              userCoords={userCoords}
            />

            {/* Advanced Markers for Bus Stops */}
            {stopsToRender.map((stop) => {
              const isSelected = selectedStop?.id === stop.id;

              return (
                <AdvancedMarker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  onClick={() => setSelectedStop(stop)}
                  title={stop.name}
                >
                  <Pin
                    background={isSelected ? '#38bdf8' : stop.isTerminal ? '#2563eb' : '#0f172a'}
                    borderColor={isSelected ? '#ffffff' : '#38bdf8'}
                    glyphColor={isSelected ? '#0f172a' : '#ffffff'}
                    scale={isSelected ? 1.25 : stop.isTerminal ? 1.1 : 0.9}
                  />
                </AdvancedMarker>
              );
            })}

            {/* User GPS Location Marker */}
            {userCoords && (
              <AdvancedMarker
                position={userCoords}
                title="Your Current Location"
              >
                <div className="user-pulse-marker w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg" />
              </AdvancedMarker>
            )}

            {/* Stop Information Window */}
            {selectedStop && (
              <InfoWindow
                position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                onCloseClick={() => setSelectedStop(null)}
              >
                <div className="p-1 min-w-[200px] text-slate-900">
                  <div className="font-bold text-sm text-slate-950">
                    {selectedStop.name}
                  </div>
                  {selectedStop.punjabiName && (
                    <div className="text-xs text-blue-700 font-medium">
                      {selectedStop.punjabiName}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedStop.landmark || selectedStop.city}
                  </div>

                  {stopETA && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs">
                      <div className="text-slate-600 font-semibold">
                        Route {activeRouteForETA?.routeNumber}
                      </div>
                      <div className="text-blue-700 font-bold mt-0.5">
                        ETA: in {stopETA.estimatedArrivalMin} min (~{stopETA.estimatedArrivalTimeFormatted})
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Confidence: {stopETA.confidenceScore}% ({stopETA.confidenceLevel})
                      </div>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </APIProvider>
    </div>
  );
};
