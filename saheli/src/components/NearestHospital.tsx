import { useState, useEffect } from 'preact/hooks';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-preact';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// Placeholder API function
const getNearestHospital = async (lat: number, lng: number): Promise<{ name: string, address: string, lat: number, lng: number }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return a mock hospital slightly offset from current location
  return {
    name: 'District Health Center',
    address: 'Main Medical Road',
    lat: lat + 0.015,
    lng: lng + 0.012
  };
};

export function NearestHospital() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospital, setHospital] = useState<{ name: string, address: string, lat: number, lng: number } | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLoc({ lat, lng });
          const nearest = await getNearestHospital(lat, lng);
          setHospital(nearest);
        } catch (err) {
          setError('Failed to find nearest hospital');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Location access denied or unavailable. Unable to find nearest hospital automatically.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const handleOpenMap = () => {
    if (hospital && userLoc) {
      // Directions from user location to hospital
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${hospital.lat},${hospital.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback generic search
      const url = `https://www.google.com/maps/search/nearest+hospital`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card class="bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50 mb-3">
      <div class="flex items-start">
        <MapPin class="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Nearest Facility</h3>
          
          {loading ? (
             <div class="flex items-center text-sm text-blue-700 dark:text-blue-300 gap-2 py-2" aria-live="polite">
               <Loader2 class="w-4 h-4 animate-spin" />
               Locating nearest hospital...
             </div>
          ) : error ? (
            <div class="text-sm text-blue-700 dark:text-blue-300" aria-live="polite">
              <p class="flex items-center gap-1.5 mb-2"><AlertCircle class="w-4 h-4" aria-hidden="true" /> {error}</p>
              <Button variant="secondary" onClick={handleOpenMap} class="w-full text-xs flex justify-center py-1.5 bg-white border-blue-200 hover:bg-blue-100 text-blue-700 dark:bg-slate-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-slate-700 font-medium shadow-sm transition-colors" aria-label="Search for nearest hospital on Google Maps">
                Search Google Maps
              </Button>
            </div>
          ) : hospital ? (
            <div class="text-sm text-blue-700 dark:text-blue-300" aria-live="polite">
               <p class="font-bold flex justify-between items-center">
                 {hospital.name}
                 <span class="text-xs font-normal opacity-80 pl-2">Tap below for directions</span>
               </p>
               <p class="text-xs opacity-80 mb-3">{hospital.address}</p>
               
               <iframe 
                 width="100%" 
                 height="180" 
                 style={{ border: 0, borderRadius: '0.5rem', marginBottom: '0.5rem' }} 
                 loading="lazy"
                 src={`https://maps.google.com/maps?q=${hospital.lat},${hospital.lng}&z=14&output=embed`}
               />
               
               <Button onClick={handleOpenMap} class="w-full text-xs flex justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-transparent font-medium shadow-sm transition-colors mt-2" aria-label={`Get directions to ${hospital.name}`}>
                 <Navigation class="w-3.5 h-3.5" />
                 Open in App
               </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
