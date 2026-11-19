export const RADIO_STATION = 'CORAL FM 98.1';
export const RADIO_TRACKS = [
  { title: 'Neon Tide', artist: 'The Marlin Club' },
  { title: 'Salt on the Dashboard', artist: 'The Causeway Keys' },
  { title: 'Sunset on Channel Nine', artist: 'Papaya Static' },
  { title: 'Low Tide Lullaby', artist: 'The Motel Palms' },
  { title: 'Last Ferry to Daybreak', artist: 'Bayside Relay' },
];

export function radioNow(seconds) {
  const index = Math.floor(seconds / 24) % RADIO_TRACKS.length;
  const { title, artist } = RADIO_TRACKS[index];
  return { station: RADIO_STATION, title, artist, index };
}

export const BAY_STATION = 'BAY FM 101.3';
export const BAY_TRACKS = [
  { title: 'Harbour Moon', artist: 'The Dockside Three' },
  { title: 'Midnight Channel', artist: 'Ferry Widow' },
  { title: 'Salt and Static', artist: 'Vela Norte' },
  { title: 'Night Swim', artist: 'Paloma Drive' },
  { title: 'Low Beam Serenade', artist: 'The Breakwater Club' },
];
export const TALK_STATION = 'BAY TALK 90.7';
export const TALK_TRACKS = [
  { title: 'The Morning Tide Report', artist: 'Dana Reyes' },
  { title: 'Harbour Traffic and Ferry Times', artist: 'The Bay Newsroom' },
  { title: 'Night Line — Callers After Dark', artist: 'Marco Vale' },
  { title: 'Regatta Weather Watch', artist: 'Ines Duarte' },
  { title: 'Pier Pressure — The Fishing Phone-In', artist: 'Old Man Herrera' },
];
export const RADIO_STATIONS = [{name:RADIO_STATION,freq:'98.1',tracks:RADIO_TRACKS},{name:BAY_STATION,freq:'101.3',tracks:BAY_TRACKS},{name:TALK_STATION,freq:'90.7',tracks:TALK_TRACKS}];
export function stationNow(seconds, stationIndex){
  const station=RADIO_STATIONS[stationIndex]||RADIO_STATIONS[0];
  const index=Math.floor(seconds/24)%station.tracks.length;const {title,artist}=station.tracks[index];
  return {station:station.name,title,artist,index};
}
export function createRadio(){return {station:0};}
export function cycleRadio(radio){radio.station=(radio.station+1)%4;return radio.station;}
