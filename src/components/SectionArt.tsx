import { useId } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { SectionKey } from '../sections';

// Hand-drawn illustration shown for a section until a photo is added. Each
// scene is drawn on a 400x300 canvas and cropped to fill its container.

type Props = { section: SectionKey; style?: StyleProp<ViewStyle> };

export function SectionArt({ section, style }: Props) {
  const Scene = SCENES[section];
  // Gradient ids must be unique per drawing: on the web every SVG shares one
  // document, and a reference to a gradient in a hidden screen renders nothing.
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <Scene u={u} />
      </Svg>
    </View>
  );
}

function Sparkle({
  x,
  y,
  r,
  color = '#FFFFFF',
  opacity = 0.9,
}: {
  x: number;
  y: number;
  r: number;
  color?: string;
  opacity?: number;
}) {
  const s = r * 0.28;
  return (
    <Path
      d={`M${x} ${y - r} Q${x + s} ${y - s} ${x + r} ${y} Q${x + s} ${y + s} ${x} ${y + r} Q${x - s} ${y + s} ${x - r} ${y} Q${x - s} ${y - s} ${x} ${y - r}Z`}
      fill={color}
      opacity={opacity}
    />
  );
}

function Study({ u }: SceneProps) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}studySky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFE0FF" />
          <Stop offset="1" stopColor="#5B86F5" />
        </LinearGradient>
        <RadialGradient id={`${u}studyGlow`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFF6C9" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#FFF6C9" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}studySky)`} />
      <Circle cx="300" cy="90" r="90" fill={`url(#${u}studyGlow)`} />
      {/* Desk */}
      <Rect x="0" y="232" width="400" height="68" fill="#2F4BA8" />
      <Rect x="0" y="226" width="400" height="10" fill="#3D5CC4" />
      {/* Lamp */}
      <Path d="M300 226 L300 150 L262 112" stroke="#22356E" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M240 96 L292 120 L276 140 L232 116 Z" fill="#22356E" />
      <Ellipse cx="300" cy="228" rx="28" ry="6" fill="#22356E" />
      <Polygon points="236,124 270,138 200,226 120,226" fill="#FFF3B0" opacity="0.35" />
      {/* Book stack */}
      <Rect x="96" y="200" width="130" height="26" rx="5" fill="#FF8A65" />
      <Rect x="104" y="206" width="114" height="4" rx="2" fill="#FFD8C9" />
      <Rect x="108" y="176" width="112" height="24" rx="5" fill="#FFD166" />
      <Rect x="116" y="182" width="96" height="4" rx="2" fill="#FFF2C6" />
      <Rect x="100" y="154" width="120" height="22" rx="5" fill="#FFFFFF" />
      <Rect x="108" y="160" width="104" height="3" rx="1.5" fill="#C9D6FF" />
      {/* Pencil */}
      <G rotation={-30} origin="70, 190">
        <Rect x="30" y="184" width="80" height="12" rx="2" fill="#FFB703" />
        <Polygon points="110,184 126,190 110,196" fill="#F8E1B5" />
        <Rect x="24" y="184" width="8" height="12" rx="2" fill="#FF6F91" />
      </G>
      <Sparkle x={70} y={70} r={12} />
      <Sparkle x={120} y={40} r={7} opacity={0.7} />
      <Sparkle x={180} y={86} r={9} opacity={0.8} />
    </G>
  );
}

function Reading({ u }: SceneProps) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}readSky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2A7A" />
          <Stop offset="0.6" stopColor="#7B5CE0" />
          <Stop offset="1" stopColor="#D8B9FF" />
        </LinearGradient>
        <RadialGradient id={`${u}readGlow`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFE9A8" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}readSky)`} />
      {/* Moon */}
      <Circle cx="320" cy="70" r="30" fill="#FFF4CC" />
      <Circle cx="334" cy="60" r="28" fill="#4A3590" opacity="0.9" />
      {/* Stars */}
      <Sparkle x={60} y={50} r={8} color="#FFF4CC" />
      <Sparkle x={150} y={30} r={5} color="#FFF4CC" opacity={0.7} />
      <Sparkle x={250} y={46} r={6} color="#FFF4CC" opacity={0.8} />
      <Circle cx="100" cy="90" r="2" fill="#FFF4CC" />
      <Circle cx="210" cy="80" r="2.5" fill="#FFF4CC" />
      <Circle cx="370" cy="130" r="2" fill="#FFF4CC" />
      {/* Glow from the book */}
      <Ellipse cx="200" cy="200" rx="170" ry="90" fill={`url(#${u}readGlow)`} />
      {/* Open book */}
      <Path d="M200 250 C160 230 110 228 70 238 L70 160 C110 150 160 152 200 172 Z" fill="#FFFFFF" />
      <Path d="M200 250 C240 230 290 228 330 238 L330 160 C290 150 240 152 200 172 Z" fill="#F5EEFF" />
      <Path d="M200 172 L200 250" stroke="#B9A2F0" strokeWidth="3" />
      <Path d="M90 180 C120 172 160 174 186 186" stroke="#D3C4F7" strokeWidth="3" fill="none" />
      <Path d="M90 198 C120 190 160 192 186 204" stroke="#D3C4F7" strokeWidth="3" fill="none" />
      <Path d="M90 216 C120 208 160 210 186 222" stroke="#D3C4F7" strokeWidth="3" fill="none" />
      <Path d="M214 186 C240 174 280 172 310 180" stroke="#D3C4F7" strokeWidth="3" fill="none" />
      <Path d="M214 204 C240 192 280 190 310 198" stroke="#D3C4F7" strokeWidth="3" fill="none" />
      {/* Words drifting up as sparkles */}
      <Sparkle x={240} y={130} r={7} color="#FFE9A8" />
      <Sparkle x={180} y={118} r={5} color="#FFE9A8" opacity={0.8} />
      <Sparkle x={270} y={104} r={4} color="#FFE9A8" opacity={0.7} />
    </G>
  );
}

function Exercise({ u }: SceneProps) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}exSky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB86B" />
          <Stop offset="0.55" stopColor="#FFD9A0" />
          <Stop offset="1" stopColor="#FFF1D6" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}exSky)`} />
      {/* Sun */}
      <Circle cx="300" cy="160" r="70" fill="#FFF3DC" opacity="0.7" />
      <Circle cx="300" cy="160" r="44" fill="#FF8C42" />
      {/* Far mountains */}
      <Polygon
        points="0,200 70,120 140,190 220,110 300,190 360,140 400,175 400,300 0,300"
        fill="#F27D52"
        opacity="0.75"
      />
      {/* Near hills */}
      <Path d="M0 230 C80 200 160 250 240 220 C300 198 360 214 400 206 L400 300 L0 300 Z" fill="#E4573D" />
      {/* Winding path */}
      <Path
        d="M210 300 C200 280 260 262 236 248 C214 236 250 226 244 220"
        stroke="#FFE1C2"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      {/* Snow caps */}
      <Polygon points="220,110 205,128 214,124 222,132 230,124 236,128" fill="#FFF1D6" />
      <Polygon points="70,120 58,136 66,133 72,140 78,133 84,136" fill="#FFF1D6" />
      {/* Birds */}
      <Path d="M290 70 q8 -8 16 0 q8 -8 16 0" stroke="#B5482F" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M330 96 q6 -6 12 0 q6 -6 12 0" stroke="#B5482F" strokeWidth="3" fill="none" strokeLinecap="round" />
    </G>
  );
}

function Diet({ u }: SceneProps) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}dietBg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8FBD9" />
          <Stop offset="1" stopColor="#7ED492" />
        </LinearGradient>
        <LinearGradient id={`${u}bowl`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#DDEFE2" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}dietBg)`} />
      <Circle cx="70" cy="60" r="60" fill="#FFFFFF" opacity="0.35" />
      <Circle cx="350" cy="250" r="80" fill="#FFFFFF" opacity="0.25" />
      {/* Leaves in the bowl */}
      <Ellipse cx="150" cy="160" rx="46" ry="22" fill="#3DBB61" rotation={-25} origin="150, 160" />
      <Ellipse cx="250" cy="156" rx="46" ry="22" fill="#2E9E50" rotation={25} origin="250, 156" />
      <Ellipse cx="200" cy="148" rx="40" ry="20" fill="#5ED17A" />
      {/* Avocado */}
      <Ellipse cx="240" cy="168" rx="30" ry="24" fill="#B8E07A" />
      <Circle cx="240" cy="172" r="11" fill="#8B5A2B" />
      {/* Tomatoes */}
      <Circle cx="160" cy="172" r="16" fill="#FF5A4E" />
      <Circle cx="186" cy="180" r="14" fill="#FF7A5C" />
      <Circle cx="155" cy="166" r="4" fill="#FFFFFF" opacity="0.6" />
      {/* Egg */}
      <Ellipse cx="210" cy="176" rx="18" ry="14" fill="#FFFFFF" />
      <Circle cx="210" cy="176" r="7" fill="#FFC93C" />
      {/* Bowl */}
      <Path d="M100 180 L300 180 C296 240 250 262 200 262 C150 262 104 240 100 180 Z" fill={`url(#${u}bowl)`} />
      <Rect x="96" y="176" width="208" height="10" rx="5" fill="#FFFFFF" />
      <Path d="M130 214 C160 228 240 228 270 214" stroke="#B7E1C2" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Floating leaves */}
      <Ellipse cx="320" cy="70" rx="18" ry="8" fill="#3DBB61" rotation={30} origin="320, 70" />
      <Ellipse cx="60" cy="230" rx="16" ry="7" fill="#2E9E50" rotation={-20} origin="60, 230" />
      <Sparkle x={340} y={130} r={8} />
      <Sparkle x={80} y={130} r={6} opacity={0.8} />
    </G>
  );
}

function Rest({ u }: SceneProps) {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}restSky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#141E4A" />
          <Stop offset="0.7" stopColor="#2B4C9A" />
          <Stop offset="1" stopColor="#4F8BD6" />
        </LinearGradient>
        <RadialGradient id={`${u}moonGlow`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFF7D6" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#FFF7D6" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}restSky)`} />
      <Circle cx="270" cy="110" r="90" fill={`url(#${u}moonGlow)`} />
      {/* Crescent moon */}
      <Circle cx="270" cy="110" r="44" fill="#FFF3C4" />
      <Circle cx="292" cy="96" r="40" fill="#1E2C66" />
      {/* Stars */}
      <Sparkle x={70} y={60} r={9} color="#FFF3C4" />
      <Sparkle x={150} y={110} r={6} color="#FFF3C4" opacity={0.8} />
      <Sparkle x={360} y={50} r={7} color="#FFF3C4" opacity={0.9} />
      <Circle cx="120" cy="40" r="2" fill="#FFF3C4" />
      <Circle cx="200" cy="60" r="2.5" fill="#FFF3C4" />
      <Circle cx="40" cy="140" r="2" fill="#FFF3C4" />
      <Circle cx="350" cy="160" r="2" fill="#FFF3C4" />
      {/* Clouds */}
      <G opacity="0.95">
        <Circle cx="20" cy="258" r="44" fill="#F4F7FF" />
        <Circle cx="90" cy="250" r="40" fill="#E9EEFF" />
        <Circle cx="140" cy="236" r="48" fill="#F4F7FF" />
        <Circle cx="200" cy="254" r="40" fill="#E9EEFF" />
        <Circle cx="260" cy="244" r="46" fill="#F4F7FF" />
        <Circle cx="320" cy="258" r="40" fill="#E9EEFF" />
        <Circle cx="386" cy="246" r="46" fill="#F4F7FF" />
        <Rect x="0" y="262" width="400" height="40" fill="#F4F7FF" />
      </G>
      {/* Zzz */}
      <Path
        d="M150 160 h16 l-16 18 h16"
        stroke="#FFFFFF"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <Path
        d="M178 136 h12 l-12 13 h12"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <Path
        d="M200 116 h9 l-9 10 h9"
        stroke="#FFFFFF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </G>
  );
}

function Meditation({ u }: SceneProps) {
  const petal = (angle: number, color: string, len = 62) => (
    <Path
      key={`${angle}-${color}`}
      d={`M200 214 C${200 - 22} ${214 - len * 0.5} ${200 - 10} ${214 - len} 200 ${214 - len} C${200 + 10} ${214 - len} ${200 + 22} ${214 - len * 0.5} 200 214 Z`}
      fill={color}
      rotation={angle}
      origin="200, 214"
    />
  );
  return (
    <G>
      <Defs>
        <LinearGradient id={`${u}medSky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB3C7" />
          <Stop offset="0.55" stopColor="#FFD6C2" />
          <Stop offset="1" stopColor="#FFE9D6" />
        </LinearGradient>
        <LinearGradient id={`${u}medWater`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F3A6C4" />
          <Stop offset="1" stopColor="#B57BD6" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="300" fill={`url(#${u}medSky)`} />
      {/* Setting sun */}
      <Circle cx="200" cy="150" r="78" fill="#FFF0E0" opacity="0.6" />
      <Circle cx="200" cy="150" r="54" fill="#FF9A8B" />
      {/* Water */}
      <Rect x="0" y="196" width="400" height="104" fill={`url(#${u}medWater)`} />
      <Path
        d="M60 236 h70 M250 230 h90 M120 262 h60 M230 270 h80"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <Path d="M170 206 h60" stroke="#FFD1C7" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      {/* Lotus */}
      <Ellipse cx="200" cy="222" rx="70" ry="12" fill="#5FA96E" />
      {petal(-70, '#F48FB1', 50)}
      {petal(70, '#F48FB1', 50)}
      {petal(-40, '#F06292', 60)}
      {petal(40, '#F06292', 60)}
      {petal(-14, '#FCE4EC', 70)}
      {petal(14, '#FCE4EC', 70)}
      {petal(0, '#FFFFFF', 76)}
      <Sparkle x={80} y={70} r={8} />
      <Sparkle x={320} y={60} r={10} />
      <Sparkle x={350} y={120} r={5} opacity={0.7} />
    </G>
  );
}

type SceneProps = { u: string };

const SCENES: Record<SectionKey, (props: SceneProps) => React.JSX.Element> = {
  study: Study,
  reading: Reading,
  exercise: Exercise,
  diet: Diet,
  rest: Rest,
  meditation: Meditation,
};
