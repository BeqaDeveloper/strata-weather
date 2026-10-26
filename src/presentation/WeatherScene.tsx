import { memo, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { WeatherCondition } from '../domain/weather';
import { useAppTheme } from '../shared/theme/ThemeProvider';

interface WeatherSceneProps {
  readonly accent: string;
  readonly sceneColor: string;
  readonly condition: WeatherCondition;
  readonly isDay: boolean | null;
}

const ISOBARS = [0, 1, 2, 3, 4, 5, 6] as const;

export const WeatherScene = memo(function WeatherScene({
  accent,
  sceneColor,
  condition,
  isDay,
}: WeatherSceneProps) {
  const { theme } = useAppTheme();
  const background = theme.colors.scene;
  const id = useId().replace(/:/g, '');
  const cloudy =
    condition === 'cloudy' ||
    condition === 'partly-cloudy' ||
    condition === 'rain' ||
    condition === 'snow' ||
    condition === 'thunderstorm';
  const wet = condition === 'rain' || condition === 'thunderstorm';

  return (
    <View
      pointerEvents="none"
      accessible={false}
      aria-hidden={true}
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id={`${id}atmosphere`} cx="79%" cy="28%" rx="75%" ry="70%">
            <Stop offset="0" stopColor={sceneColor} stopOpacity="0.85" />
            <Stop offset="0.6" stopColor={sceneColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={background} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`${id}orb`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F7FFE2" />
            <Stop offset="0.6" stopColor={accent} />
            <Stop offset="1" stopColor={sceneColor} />
          </LinearGradient>
          <LinearGradient id={`${id}cloud`} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor="#F6FAE8" stopOpacity="0.96" />
            <Stop offset="1" stopColor={sceneColor} stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id={`${id}shade`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.3" stopColor={background} stopOpacity="0" />
            <Stop offset="1" stopColor={background} stopOpacity="0.96" />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="360" fill={background} />
        <Rect width="360" height="360" fill={`url(#${id}atmosphere)`} />
        <G transform="translate(265 158) rotate(-28)">
          {ISOBARS.map((index) => (
            <Ellipse
              key={index}
              cx="0"
              cy="0"
              rx={80 + index * 25}
              ry={113 + index * 22}
              fill="none"
              stroke={accent}
              strokeOpacity={0.16 - index * 0.015}
              strokeWidth="0.8"
            />
          ))}
        </G>
        <G opacity={condition === 'fog' ? 0.35 : 1}>
          {condition === 'unknown' || isDay === null ? (
            <Circle
              testID="scene-neutral"
              cx="267"
              cy="114"
              r="48"
              fill="none"
              stroke={accent}
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          ) : isDay ? (
            <Circle testID="scene-sun" cx="267" cy="114" r="48" fill={`url(#${id}orb)`} />
          ) : (
            <Path
              testID="scene-moon"
              d="M285 65a50 50 0 1 0 27 83 54 54 0 0 1-27-83Z"
              fill={`url(#${id}orb)`}
            />
          )}
          <Circle
            cx="267"
            cy="114"
            r="59"
            fill="none"
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <Circle
            cx="267"
            cy="114"
            r="66"
            fill="none"
            stroke={accent}
            strokeOpacity="0.09"
            strokeWidth="1"
          />
        </G>
        {cloudy ? (
          <Path
            testID="scene-cloud"
            d="M186 157c-17 0-28-12-28-26 0-16 13-28 29-28 4-24 23-39 45-35 17 2 30 15 33 32 20-5 38 10 38 29 0 17-13 28-30 28Z"
            fill={`url(#${id}cloud)`}
          />
        ) : null}
        {wet ? (
          <G stroke={accent} strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round">
            <Line x1="201" y1="174" x2="196" y2="188" />
            <Line x1="225" y1="174" x2="220" y2="188" />
            <Line x1="249" y1="174" x2="244" y2="188" />
          </G>
        ) : null}
        {condition === 'snow' ? (
          <G fill="#F6FAE8">
            <Circle cx="202" cy="177" r="2.5" />
            <Circle cx="228" cy="186" r="2.5" />
            <Circle cx="255" cy="174" r="2.5" />
          </G>
        ) : null}
        {condition === 'thunderstorm' ? (
          <Path d="m248 154-13 25h14l-10 26 32-36h-18l9-15Z" fill={accent} />
        ) : null}
        {condition === 'fog' ? (
          <G stroke={accent} strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round">
            <Line x1="185" y1="102" x2="310" y2="102" />
            <Line x1="171" y1="122" x2="296" y2="122" />
            <Line x1="193" y1="142" x2="318" y2="142" />
          </G>
        ) : null}
        <Path
          d="M-40 268C84 187 173 310 400 220M-40 287C84 206 173 329 400 239M-40 306C84 225 173 348 400 258"
          fill="none"
          stroke={accent}
          strokeOpacity="0.13"
          strokeWidth="1"
        />
        <Rect width="360" height="360" fill={`url(#${id}shade)`} />
      </Svg>
    </View>
  );
});
