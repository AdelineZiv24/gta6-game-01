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
