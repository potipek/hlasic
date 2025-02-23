import React, { useState, useRef } from 'react';
import { Bus, Upload, PlayCircle, Clock, MapPin, DoorClosed, RotateCcw, Globe2, ExternalLink } from 'lucide-react';
import useSound from 'use-sound';
import type { BusStop, BusRoute } from './types';

function App() {
  const [route, setRoute] = useState<BusRoute>({ stops: [], currentStopIndex: -1 });
  const [language, setLanguage] = useState<'en' | 'cs'>('cs');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [displayWindow, setDisplayWindow] = useState<Window | null>(null);
  
  const [playDing] = useSound('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  const [playDoorBeep] = useSound('https://assets.mixkit.co/active_storage/sfx/2193/2193-preview.mp3', {
    playbackRate: 1.0,
    volume: 0.5
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const stops: BusStop[] = lines.map(line => {
          const [name, arrival, departure, announcement] = line.split(' ');
          if (!name || !arrival || !departure || !announcement) {
            throw new Error('Invalid file format');
          }
          return { name, arrival, departure, announcement };
        });
        setRoute({ stops, currentStopIndex: 0 });
        setError('');
        updateNextStop(stops[0], stops[1]);
      } catch (err) {
        setError('Invalid file format. Each line should contain: name arrival departure announcement');
      }
    };
    reader.readAsText(file);
  };

  const updateNextStop = (currentStop: BusStop, nextStop: BusStop | undefined) => {
    const nextStopData = nextStop ? {
      name: nextStop.name,
      arrival: nextStop.arrival
    } : null;
    
    localStorage.setItem('nextStopData', JSON.stringify(nextStopData));
    localStorage.setItem('currentStopData', JSON.stringify({
      name: currentStop.name,
      arrival: currentStop.arrival
    }));
    
    // Trigger update in display window
    window.dispatchEvent(new Event('storage'));
  };

  const openNextStopDisplay = () => {
    const newWindow = window.open('http://localhost:5174', 'NextStopDisplay', 'width=1024,height=768');
    if (newWindow) {
      setDisplayWindow(newWindow);
      
      // If we have current route data, update it immediately
      if (route.stops.length > 0 && route.currentStopIndex >= 0) {
        const currentStop = route.stops[route.currentStopIndex];
        const nextStop = route.stops[route.currentStopIndex + 1];
        updateNextStop(currentStop, nextStop);
      }
    }
  };

  const playAnnouncement = async () => {
    if (route.currentStopIndex >= 0 && route.currentStopIndex < route.stops.length) {
      playDing();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const utterance = new SpeechSynthesisUtterance(
        route.stops[route.currentStopIndex].announcement
      );
      utterance.lang = language === 'cs' ? 'cs-CZ' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const announceNextStop = async () => {
    if (route.currentStopIndex < route.stops.length - 1) {
      const nextStop = route.stops[route.currentStopIndex + 1];
      const nextStopText = language === 'cs' 
        ? `příští zastávka ${nextStop.name}`
        : `next stop ${nextStop.name}`;
        
      const utterance = new SpeechSynthesisUtterance(nextStopText);
      utterance.lang = language === 'cs' ? 'cs-CZ' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const nextStop = () => {
    if (route.currentStopIndex < route.stops.length - 1) {
      const newIndex = route.currentStopIndex + 1;
      setRoute(prev => ({
        ...prev,
        currentStopIndex: newIndex
      }));
      
      const currentStop = route.stops[newIndex];
      const nextStop = route.stops[newIndex + 1];
      updateNextStop(currentStop, nextStop);
    }
  };

  const previousStop = () => {
    if (route.currentStopIndex > 0) {
      const newIndex = route.currentStopIndex - 1;
      setRoute(prev => ({
        ...prev,
        currentStopIndex: newIndex
      }));
      
      const currentStop = route.stops[newIndex];
      const nextStop = route.stops[newIndex + 1];
      updateNextStop(currentStop, nextStop);
    }
  };

  const selectStop = (index: number) => {
    setRoute(prev => ({
      ...prev,
      currentStopIndex: index
    }));
    
    const currentStop = route.stops[index];
    const nextStop = route.stops[index + 1];
    updateNextStop(currentStop, nextStop);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'cs' ? 'en' : 'cs');
  };

  const currentStop = route.stops[route.currentStopIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                  TransitControl
                </h1>
                <p className="text-gray-400">Advanced Transport Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openNextStopDisplay}
                className="flex items-center space-x-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                <span>{language === 'cs' ? 'Otevřít display' : 'Open Display'}</span>
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 bg-gray-800/80 text-gray-200 px-4 py-3 rounded-xl hover:bg-gray-700/80 transition-all border border-gray-700/50 shadow-lg"
              >
                <Globe2 className="w-5 h-5" />
                <span>{language === 'cs' ? 'Čeština' : 'English'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                <Upload className="w-5 h-5" />
                <span>Load Route</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-6 bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-8">
            {currentStop ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Stop Information */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold mb-8 flex items-center text-white">
                      <MapPin className="w-8 h-8 mr-4 text-blue-400" />
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                        {language === 'cs' ? 'Aktuální zastávka:' : 'Current Stop:'} {currentStop.name}
                      </span>
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm flex items-center space-x-4">
                        <Clock className="w-8 h-8 text-emerald-400" />
                        <div>
                          <p className="text-sm text-gray-400">{language === 'cs' ? 'Příjezd' : 'Arrival'}</p>
                          <p className="text-2xl font-mono text-white mt-1">{currentStop.arrival}</p>
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm flex items-center space-x-4">
                        <Clock className="w-8 h-8 text-rose-400" />
                        <div>
                          <p className="text-sm text-gray-400">{language === 'cs' ? 'Odjezd' : 'Departure'}</p>
                          <p className="text-2xl font-mono text-white mt-1">{currentStop.departure}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={playAnnouncement}
                      className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-3 shadow-lg"
                    >
                      <PlayCircle className="w-6 h-6" />
                      <span>{language === 'cs' ? 'Přehrát hlášení' : 'Play Announcement'}</span>
                    </button>
                    <button
                      onClick={announceNextStop}
                      className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center space-x-3 shadow-lg"
                    >
                      <DoorClosed className="w-6 h-6" />
                      <span>{language === 'cs' ? 'Příští zastávka' : 'Next Stop'}</span>
                    </button>
                    <button
                      onClick={previousStop}
                      disabled={route.currentStopIndex <= 0}
                      className="bg-gradient-to-br from-gray-600 to-gray-700 text-white p-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                    >
                      <RotateCcw className="w-6 h-6" />
                      <span>{language === 'cs' ? 'Předchozí' : 'Previous'}</span>
                    </button>
                    <button
                      onClick={nextStop}
                      disabled={route.currentStopIndex === route.stops.length - 1}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                    >
                      <Bus className="w-6 h-6" />
                      <span>{language === 'cs' ? 'Další' : 'Next'}</span>
                    </button>
                  </div>
                </div>

                {/* Stop List */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 text-white border-b border-gray-600/50 pb-3">
                      {language === 'cs' ? 'Seznam zastávek' : 'Stop List'}
                    </h3>
                    <div className="space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                      {route.stops.map((stop, index) => (
                        <button
                          key={index}
                          onClick={() => selectStop(index)}
                          className={`w-full text-left p-4 rounded-xl transition-all border ${
                            index === route.currentStopIndex
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/50'
                              : 'bg-gray-900/50 text-gray-300 hover:bg-gray-800/50 border-gray-700/50'
                          }`}
                        >
                          <div className="font-medium text-lg">{stop.name}</div>
                          <div className="text-sm opacity-75 font-mono mt-1">
                            {stop.arrival} - {stop.departure}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <Bus className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                <p className="text-gray-300 text-xl">
                  {language === 'cs' 
                    ? 'Nahrajte prosím soubor s trasou pro začátek' 
                    : 'Please upload a route file to begin'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;