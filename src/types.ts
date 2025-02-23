export interface BusStop {
  name: string;
  arrival: string;
  departure: string;
  announcement: string;
}

export interface BusRoute {
  stops: BusStop[];
  currentStopIndex: number;
}