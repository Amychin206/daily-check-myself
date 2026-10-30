import { useId } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { Anim, Sparkle, Twinkle } from './SectionArt';

// Banner illustrations for the cards on the 成长 tab, drawn on a 400x150
// canvas. Each has a soft dark fade along the bottom so a title can sit on it.

export type GrowthArtKind = 'morning' | 'levers' | 'day' | 'score' | 'evening' | 'board' | 'deep' | 'read';

type Props = { kind: GrowthArtKind; style?: StyleProp<ViewStyle> };

export function GrowthArt({ kind, style }: Props) {
  const Scene = SCENES[kind];
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
        <Scene u={u} />
        <Defs>
          <LinearGradient id={`${u}fade`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.35" />
          </LinearGradient>
        </Defs>
        <Rect y="80" width="400" height="70" fill={`url(#${u}fade)`} />
      </Svg>
    </View>
  );
}

type SceneProps = { u: string };

function Sky({ u, id, stops }: { u: string; id: string; stops: [string, string][] }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${u}${id}`} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([offset, color]) => (
            <Stop key={offset} offset={offset} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="400" height="150" fill={`url(#${u}${id})`} />
    </>
  );
}

const bird = (x: number, y: number, s: number, color: string) => (
  <Path
    d={`M${x} ${y} q${s} ${-s} ${2 * s} 0 q${s} ${-s} ${2 * s} 0`}
    stroke={color}
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
  />
);

function Morning({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#FFB3A7'],
          ['0.6', '#FFD8B0'],
          ['1', '#FFF0D9'],
        ]}
      />
      <Anim period={6} dy={-6}>
        <Anim period={3} scale={0.12} origin={[290, 100]}>
          <Circle cx="290" cy="100" r="52" fill="#FFF4E0" opacity="0.7" />
        </Anim>
        <Circle cx="290" cy="100" r="30" fill="#FF8A5B" />
      </Anim>
      <Path d="M0 110 C70 80 140 100 210 92 C280 84 340 100 400 90 L400 150 L0 150 Z" fill="#F7A07A" />
      <Path d="M0 128 C80 108 170 132 260 118 C320 110 360 120 400 114 L400 150 L0 150 Z" fill="#E77A5E" />
      <Anim period={5} dx={12} dy={4}>
        {bird(80, 44, 7, '#C4664E')}
      </Anim>
      <Anim period={5} dx={10} dy={5} phase={0.4}>
        {bird(116, 30, 5, '#C4664E')}
      </Anim>
      <Twinkle x={180} y={40} r={7} />
      <Twinkle x={360} y={30} r={5} phase={0.5} />
    </G>
  );
}

function Levers({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#BFE6FF'],
          ['1', '#E7FAF1'],
        ]}
      />
      <Anim period={8} dx={14}>
        <Ellipse cx="70" cy="36" rx="30" ry="10" fill="#FFFFFF" opacity="0.9" />
        <Ellipse cx="92" cy="30" rx="20" ry="9" fill="#FFFFFF" opacity="0.9" />
      </Anim>
      <G transform="translate(0 14)">
        <Polygon points="120,150 250,30 380,150" fill="#6BC6A0" />
        <Polygon points="250,30 228,52 240,48 250,58 262,48 272,52" fill="#FFFFFF" />
        <Polygon points="0,150 90,80 190,150" fill="#8FD7B4" />
        {/* Winding path up the mountain */}
        <Path
          d="M210 150 C240 130 200 116 236 102 C268 90 232 74 250 58"
          stroke="#FFF6DD"
          strokeWidth="5"
          strokeDasharray="8 7"
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M250 30 L250 6" stroke="#2F6B55" strokeWidth="3" strokeLinecap="round" />
        <Anim period={1.6} rotate={6} origin={[250, 8]}>
          <Polygon points="250,6 276,13 250,20" fill="#FF7A59" />
        </Anim>
      </G>
      <Twinkle x={330} y={40} r={7} color="#FFE08A" />
    </G>
  );
}

function Day({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#5DB2FF'],
          ['1', '#CDEBFF'],
        ]}
      />
      <Anim period={10} rotate={12} origin={[320, 50]}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Rect key={a} x="317" y="2" width="6" height="20" rx="3" fill="#FFE27A" rotation={a} origin="320, 50" />
        ))}
      </Anim>
      <Anim period={3} scale={0.06} origin={[320, 50]}>
        <Circle cx="320" cy="50" r="24" fill="#FFC93C" />
      </Anim>
      <Anim period={9} dx={18}>
        <G fill="#FFFFFF">
          <Ellipse cx="90" cy="70" rx="44" ry="16" />
          <Circle cx="76" cy="60" r="16" />
          <Circle cx="102" cy="56" r="20" />
        </G>
      </Anim>
      <Anim period={11} dx={-14} phase={0.3}>
        <G fill="#FFFFFF" opacity="0.85">
          <Ellipse cx="220" cy="100" rx="40" ry="13" />
          <Circle cx="210" cy="92" r="13" />
          <Circle cx="232" cy="88" r="16" />
        </G>
      </Anim>
      <Path d="M0 136 C100 124 300 128 400 120 L400 150 L0 150 Z" fill="#7FD08F" />
    </G>
  );
}

function Score({ u }: SceneProps) {
  const star = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(' ');
    return <Polygon points={pts} fill="#FFD66B" />;
  };
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#5B3FB5'],
          ['1', '#A98BF0'],
        ]}
      />
      <Circle cx="40" cy="30" r="2" fill="#FFF" />
      <Circle cx="140" cy="20" r="1.6" fill="#FFF" />
      <Circle cx="370" cy="26" r="2" fill="#FFF" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Anim key={i} period={2.5} phase={i * 0.12} scale={0.15} dy={-4} origin={[90 + i * 55, 68]}>
          {star(90 + i * 55, 68, 20)}
        </Anim>
      ))}
      <Twinkle x={30} y={110} r={6} color="#FFF4CC" />
      <Twinkle x={380} y={100} r={7} color="#FFF4CC" phase={0.5} />
    </G>
  );
}

function Evening({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#2E2A6E'],
          ['0.6', '#8A5AA8'],
          ['1', '#F2A07B'],
        ]}
      />
      <Anim period={6} scale={0.1} origin={[300, 50]} fade={[0.5, 0.9]}>
        <Circle cx="300" cy="50" r="40" fill="#FFF3C4" opacity="0.35" />
      </Anim>
      <Circle cx="300" cy="50" r="20" fill="#FFF3C4" />
      <Circle cx="311" cy="43" r="18" fill="#4A3A86" />
      <Twinkle x={60} y={30} r={6} color="#FFF3C4" />
      <Twinkle x={150} y={50} r={4} color="#FFF3C4" phase={0.4} />
      <Twinkle x={220} y={22} r={5} color="#FFF3C4" phase={0.7} />
      <Rect y="104" width="400" height="46" fill="#4C3B7E" />
      <Anim period={5} dx={10}>
        <Path
          d="M270 114 h60 M250 124 h36 M300 132 h50 M60 120 h50 M120 136 h40"
          stroke="#FFF3C4"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
      </Anim>
    </G>
  );
}

function Board({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="paper"
        stops={[
          ['0', '#FBEFD5'],
          ['1', '#F1D9A8'],
        ]}
      />
      {/* Compass */}
      <Anim period={12} rotate={20} origin={[56, 50]}>
        <Circle cx="56" cy="50" r="26" fill="none" stroke="#B58A4A" strokeWidth="2" />
        <Polygon points="56,26 62,50 56,74 50,50" fill="#C9603F" />
        <Polygon points="32,50 56,44 80,50 56,56" fill="#B58A4A" />
      </Anim>
      {/* Islands and trees */}
      <Ellipse cx="200" cy="112" rx="70" ry="18" fill="#BFD99A" />
      <Ellipse cx="330" cy="80" rx="50" ry="16" fill="#BFD99A" />
      <Polygon points="180,104 190,82 200,104" fill="#5E9E5A" />
      <Polygon points="200,104 212,76 224,104" fill="#4E8C4A" />
      <Polygon points="320,74 330,54 340,74" fill="#5E9E5A" />
      {/* Dashed route to the X */}
      <Path
        d="M100 130 C140 100 170 140 220 116 C270 92 280 70 330 74"
        stroke="#8B5E34"
        strokeWidth="3"
        strokeDasharray="7 7"
        fill="none"
        strokeLinecap="round"
      />
      <Anim period={2} scale={0.15} origin={[340, 70]}>
        <Path d="M332 62 L348 78 M348 62 L332 78" stroke="#D9472B" strokeWidth="5" strokeLinecap="round" />
      </Anim>
      <Twinkle x={370} y={40} r={7} color="#FFD66B" />
    </G>
  );
}

function Deep({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sea"
        stops={[
          ['0', '#3CC2C8'],
          ['1', '#123B73'],
        ]}
      />
      <Anim period={6} fade={[0.15, 0.4]}>
        <Polygon points="120,0 160,0 230,150 150,150" fill="#FFFFFF" />
        <Polygon points="240,0 266,0 320,150 270,150" fill="#FFFFFF" />
      </Anim>
      {[
        [80, 120, 5, 0],
        [96, 100, 3, 0.3],
        [300, 110, 4, 0.5],
        [316, 86, 2.5, 0.7],
        [200, 130, 3.5, 0.2],
      ].map(([x, y, r, ph]) => (
        <Anim key={`${x}-${y}`} period={4} dy={-14} phase={ph} fade={[0.3, 0.9]}>
          <Circle cx={x} cy={y} r={r} fill="none" stroke="#E6FBFF" strokeWidth="1.5" />
        </Anim>
      ))}
      <Path d="M0 140 C60 128 120 146 200 136 C280 126 340 144 400 134 L400 150 L0 150 Z" fill="#0D2B55" />
      <Anim period={3} rotate={8} origin={[40, 140]}>
        <Path d="M40 140 C30 120 50 110 40 92" stroke="#2FA37A" strokeWidth="4" fill="none" strokeLinecap="round" />
      </Anim>
      <Anim period={3.4} rotate={8} origin={[360, 138]} phase={0.5}>
        <Path d="M360 138 C350 118 370 106 360 90" stroke="#2FA37A" strokeWidth="4" fill="none" strokeLinecap="round" />
      </Anim>
    </G>
  );
}

function Read({ u }: SceneProps) {
  return (
    <G>
      <Sky
        u={u}
        id="sky"
        stops={[
          ['0', '#FFE2B8'],
          ['1', '#F7B98B'],
        ]}
      />
      <Anim period={5} scale={0.08} origin={[280, 90]} fade={[0.4, 0.8]}>
        <Ellipse cx="280" cy="90" rx="150" ry="60" fill="#FFF6DE" />
      </Anim>
      <G transform="translate(80 0)">
        <Path d="M200 128 C170 116 130 114 100 120 L100 66 C130 60 170 62 200 76 Z" fill="#FFFFFF" />
        <Path d="M200 128 C230 116 270 114 300 120 L300 66 C270 60 230 62 200 76 Z" fill="#FFF4E6" />
        <Path d="M200 76 L200 128" stroke="#E2B48A" strokeWidth="2" />
        <Path
          d="M114 82 C140 76 170 78 188 86 M114 96 C140 90 170 92 188 100 M212 86 C230 78 260 76 286 82 M212 100 C230 92 260 90 286 96"
          stroke="#F0CFA8"
          strokeWidth="2.5"
          fill="none"
        />
      </G>
      <Anim period={4} dy={-8}>
        <Sparkle x={320} y={46} r={6} color="#FF9F5A" />
      </Anim>
      <Anim period={4} dy={-8} phase={0.4}>
        <Sparkle x={250} y={40} r={4} color="#FF9F5A" />
      </Anim>
      <Twinkle x={330} y={30} r={7} />
    </G>
  );
}

const SCENES: Record<GrowthArtKind, (props: SceneProps) => React.JSX.Element> = {
  morning: Morning,
  levers: Levers,
  day: Day,
  score: Score,
  evening: Evening,
  board: Board,
  deep: Deep,
  read: Read,
};
