import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ICONS: Record<string, string> = {
  dashboard:   'M3 3h7v8H3zM14 3h7v5h-7zM14 11h7v10h-7zM3 14h7v7H3z',
  inventory:   'M3 7.5 12 3l9 4.5M3 7.5 12 12m-9-4.5V16l9 5m0-9 9-4.5M12 12v9m9-13.5V16l-9 5',
  truck:       'M1 3h13v11H1zM14 7h4l3 3v4h-7zM5.5 17.5a2 2 0 1 0 0 .01M17.5 17.5a2 2 0 1 0 0 .01',
  invoice:     'M5 2h10l4 4v16H5zM14 2v5h5M8 12h8M8 16h8M8 8h3',
  dollar:      'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  users:       'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 20v-2a4 4 0 0 0-3-3.8M16 3.2A4 4 0 0 1 16 11',
  wallet:      'M3 6h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-1-1.7V6zM3 6l13-3v3M17 13h1',
  reports:     'M3 3v18h18M8 16v-5M13 16V7M18 16v-9',
  search:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  bell:        'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  plus:        'M12 5v14M5 12h14',
  chevR:       'M9 6l6 6-6 6',
  chevL:       'M15 6l-6 6 6 6',
  chevD:       'M6 9l6 6 6-6',
  chevU:       'M18 15l-6-6-6 6',
  arrowUp:     'M12 19V5M5 12l7-7 7 7',
  arrowDown:   'M12 5v14M5 12l7 7 7-7',
  arrowR:      'M5 12h14M13 6l6 6-6 6',
  check:       'M20 6 9 17l-5-5',
  checkCircle: 'M22 11.5V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3',
  x:           'M18 6 6 18M6 6l12 12',
  xCircle:     'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M15 9l-6 6M9 9l6 6',
  more:        'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  filter:      'M22 3H2l8 9.5V19l4 2v-8.5z',
  download:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  edit:        'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
  trash:       'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  pkg:         'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  scan:        'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10',
  clock:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  alert:       'M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0M12 9v4M12 17h.01',
  settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  box:         'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5',
  send:        'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  trendUp:     'M22 7 13.5 15.5l-5-5L2 17M16 7h6v6',
  grid:        'M3 3h8v8H3zM13 3h8v8h-8zM13 13h8v8h-8zM3 13h8v8H3z',
  list:        'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  receipt:     'M5 2h14v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6M9 16h3',
  tag:         'M20.6 8.3 11.7 17.3a2 2 0 0 1-2.8 0L3 11.4a2 2 0 0 1 0-2.8L12 3.4a2 2 0 0 1 1.4-.4h5.4a2 2 0 0 1 2 2v5.4a2 2 0 0 1-.2.9zM16.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1',
  home:        'M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10',
  inbox:       'M3 12h5l2 3h4l2-3h5M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  cart:        'M2 3h2.5l2.2 12.4a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6M9.5 21a1 1 0 1 0 0-.01M17.5 21a1 1 0 1 0 0-.01',
  history:     'M3 3v6h6M3.5 9a9 9 0 1 1-1 5M12 7v5l4 2',
  refresh:     'M21 12a9 9 0 1 1-3-6.7M21 4v4h-4',
  user:        'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1',
  swap:        'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  const d = ICONS[name] || '';
  if (!d) return null;
  const segments = d.split('M').filter(Boolean);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {segments.map((seg, i) => (
        <Path
          key={i}
          d={'M' + seg}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
