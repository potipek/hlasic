import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

interface StopData {
  name: string;
  arrival: string;
}

export function NextStopDisplay() {
  const [currentStop, setCurrentStop] = useState<StopData | null>(null);
  const [nextStop, setNextStop] = useState<StopData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initial load
    const currentStopData = localStorage.getItem('currentStopData');
    const nextStopData = localStorage.getItem('nextStopData');
    
    if (currentStopData) setCurrentStop(JSON.parse(currentStopData));
    if (nextStopData) setNextStop(JSON.parse(nextStopData));

    // Listen for changes
    const handleStorage = () => {
      const currentStopData = localStorage.getItem('currentStopData');
      const nextStopData = localStorage.getItem('nextStopData');
      
      if (currentStopData) setCurrentStop(JSON.parse(currentStopData));
      if (nextStopData) setNextStop(JSON.parse(nextStopData));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!currentStop) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-2xl">Waiting for stop data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Current Time */}
      <div className="bg-blue-900/20 p-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <time className="text-4xl font-mono">
              {currentTime.toLocaleTimeString('en-GB')}
            </time>
          </div>
        </div>
      </div>

      {/* Stop Information */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-8">
          <div className="flex flex-col items-center space-y-12">
            {/* Current Stop */}
            <div className="text-center">
              <div className="flex items-center space-x-4 mb-4">
                <MapPin className="w-12 h-12 text-blue-400" />
                <h2 className="text-3xl font-light">CURRENT STOP</h2>
              </div>
              <div className="text-6xl font-bold text-white mb-2">
                {currentStop.name}
              </div>
              <div className="text-2xl font-mono text-gray-400">
                {currentStop.arrival}
              </div>
            </div>

            {nextStop && (
              <>
                <ArrowRight className="w-16 h-16 text-blue-400" />
                
                {/* Next Stop */}
                <div className="text-center">
                  <div className="flex items-center space-x-4 mb-4">
                    <MapPin className="w-12 h-12 text-emerald-400" />
                    <h2 className="text-3xl font-light">NEXT STOP</h2>
                  </div>
                  <div className="text-6xl font-bold text-emerald-400 mb-2">
                    {nextStop.name}
                  </div>
                  <div className="text-2xl font-mono text-gray-400">
                    {nextStop.arrival}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}