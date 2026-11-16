import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { iconTone } from '@/src/theme/tokens';
import type { ColorHarmonyType } from '@/src/utils/colorUtils';

export interface IconProps {
  size?: number;
  color?: string;
}

type StrokeIconProps = IconProps & { children: React.ReactNode; strokeWidth?: number };

// 24×24 stroke icons, same paths as the design file
function StrokeIcon({
  size = 24,
  color = iconTone.secondary,
  strokeWidth = 2,
  children,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const ExportIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M12 3v12" />
    <Path d="M7 8l5-5 5 5" />
    <Path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </StrokeIcon>
);

export const ImageIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <Path d="M3 16l5-5 4 4 3-3 6 6" />
    <Path d="M16 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
  </StrokeIcon>
);

export const CameraIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <Path d="M15.5 13.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
  </StrokeIcon>
);

export const CloseIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M6 6l12 12" />
    <Path d="M18 6L6 18" />
  </StrokeIcon>
);

export const ExpandIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M15 3h6v6" />
    <Path d="M9 21H3v-6" />
    <Path d="M21 3l-7 7" />
    <Path d="M3 21l7-7" />
  </StrokeIcon>
);

export const CopyIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Rect x={9} y={9} width={11} height={11} rx={2} />
    <Path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </StrokeIcon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M6 9l6 6 6-6" />
  </StrokeIcon>
);

export const ColorIcon = ({ color = iconTone.secondary, ...p }: IconProps) => (
  <StrokeIcon color={color} {...p}>
    <Circle cx={12} cy={12} r={8.5} />
    <Circle cx={12} cy={12} r={2.5} fill={color} />
  </StrokeIcon>
);

export const PalettesIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Rect x={3} y={4} width={18} height={6} rx={2} />
    <Rect x={3} y={14} width={18} height={6} rx={2} />
  </StrokeIcon>
);

export const SaveIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M6 3h12v18l-6-4-6 4z" />
    <Path d="M12 7v6M9 10h6" />
  </StrokeIcon>
);

export const CheckIcon = (p: IconProps) => (
  <StrokeIcon strokeWidth={2.4} {...p}>
    <Path d="M5 12l5 5 9-10" />
  </StrokeIcon>
);

export const TrashIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M4 7h16" />
    <Path d="M9 7V4h6v3" />
    <Path d="M6 7l1 13h10l1-13" />
  </StrokeIcon>
);

export const FileIcon = (p: IconProps) => (
  <StrokeIcon {...p}>
    <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <Path d="M14 3v5h5" />
  </StrokeIcon>
);

export const MoreIcon = ({ size = 24, color = iconTone.secondary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx={5} cy={12} r={2} />
    <Circle cx={12} cy={12} r={2} />
    <Circle cx={19} cy={12} r={2} />
  </Svg>
);

/** Point on the 32×32 harmony icon circle, 0° at the top, clockwise */
function point(deg: number, r = 11): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [16 + r * Math.sin(a), 16 - r * Math.cos(a)];
}

const HARMONY_SHAPES: Record<
  ColorHarmonyType,
  {
    dots: [number, number][];
    base: number;
    shape?: 'polygon' | 'line' | 'radius';
    /** Dots fade one after the other, for shades of one color */
    fade?: boolean;
  }
> = {
  analogous: { dots: [-60, -30, 0, 30, 60].map((a) => point(a)), base: 2 },
  complementary: { dots: [0, 180].map((a) => point(a)), base: 0, shape: 'line' },
  // The spread is wider than the real one, so the two dots stay apart at icon size
  splitComplementary: { dots: [0, 150, 210].map((a) => point(a)), base: 0, shape: 'polygon' },
  triadic: { dots: [0, 120, 240].map((a) => point(a)), base: 0, shape: 'polygon' },
  square: { dots: [0, 90, 180, 270].map((a) => point(a)), base: 0, shape: 'polygon' },
  compound: { dots: [0, -30, -150, 180].map((a) => point(a)), base: 0, shape: 'polygon' },
  shades: { dots: [6.5, 12, 16.5, 21, 25.5].map((x) => [x, 16]), base: 0, fade: true },
  monochromatic: { dots: [2.5, 5.3, 8.1, 11].map((r) => point(0, r)), base: 3, shape: 'radius' },
};

/** Diagram of a harmony: dots on a circle, the base color drawn larger */
export function HarmonyIcon({
  harmony,
  size = 26,
  color = iconTone.secondary,
}: IconProps & { harmony: ColorHarmonyType }) {
  const { dots, base, shape, fade } = HARMONY_SHAPES[harmony];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
    >
      <Circle cx={16} cy={16} r={11} strokeOpacity={0.3} />
      {shape === 'polygon' && (
        <Polygon points={dots.map(([x, y]) => `${x},${y}`).join(' ')} strokeLinejoin="round" />
      )}
      {shape === 'line' && <Line x1={dots[0][0]} y1={dots[0][1]} x2={dots[1][0]} y2={dots[1][1]} />}
      {shape === 'radius' && <Line x1={16} y1={16} x2={16} y2={5} />}
      {dots.map(([x, y], i) => (
        <Circle
          key={i}
          cx={x}
          cy={y}
          r={i === base ? 3.2 : fade ? 2.1 : 2.3}
          fill={color}
          fillOpacity={fade ? 1 - i * 0.18 : 1}
          stroke="none"
        />
      ))}
    </Svg>
  );
}
