import React from 'react';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: any;
}

/**
 * Göbeklitepe — ünlü T-biçimli dikilitaş (T-pillar). Üstteki yatay kol ve
 * gövdedeki hayvan kabartması siluetiyle tanınabilir hâle getirildi.
 */
export const UrfaIcon_Gobeklitepe = ({ size = 24, color = "white", opacity = 1, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style} opacity={opacity}>
    {/* T-taşının yatay kolu */}
    <Path d="M16 14C16 12.3431 17.3431 11 19 11H45C46.6569 11 48 12.3431 48 14V20H16V14Z" stroke={color} strokeWidth="3" strokeLinejoin="round"/>
    {/* T-taşının gövdesi */}
    <Path d="M25 20V50C25 51.6569 26.3431 53 28 53H36C37.6569 53 39 51.6569 39 50V20" stroke={color} strokeWidth="3" strokeLinejoin="round"/>
    {/* Kabartma deseni (kolların ucundaki oyma) */}
    <Circle cx="22" cy="15.5" r="1.6" fill={color} />
    <Circle cx="42" cy="15.5" r="1.6" fill={color} />
    <Path d="M29 32C31 30 33 30 35 32" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
  </Svg>
);

/**
 * Harran — ikonik koni/kovan şeklindeki kerpiç evler.
 */
export const UrfaIcon_Harran = ({ size = 24, color = "white", opacity = 1, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style} opacity={opacity}>
    {/* Zemin çizgisi */}
    <Path d="M8 54H56" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    {/* Ana koni ev */}
    <Path d="M18 54V42C18 30.9543 26.9543 22 38 22C40 22 40 24 40 26V54" stroke={color} strokeWidth="3" strokeLinejoin="round"/>
    <Path d="M18 54H40" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    {/* Kubbe tepe noktası */}
    <Circle cx="38" cy="22" r="2" fill={color} />
    {/* Kapı */}
    <Path d="M27 54V46C27 44.8954 27.8954 44 29 44H31C32.1046 44 33 44.8954 33 46V54" stroke={color} strokeWidth="2.4" strokeLinejoin="round"/>
    {/* İkinci küçük koni (arka plan) */}
    <Path d="M42 54V48C42 41.3726 47.3726 36 54 36" stroke={color} strokeWidth="2.4" strokeLinejoin="round" opacity={0.7}/>
  </Svg>
);

/**
 * Balıklıgöl — kutsal balıklar. Sade, tanınabilir balık silüeti.
 */
export const UrfaIcon_Balik = ({ size = 24, color = "white", opacity = 1, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style} opacity={opacity}>
    <Ellipse cx="26" cy="32" rx="18" ry="10" stroke={color} strokeWidth="3"/>
    <Path d="M44 32L56 24V40L44 32Z" stroke={color} strokeWidth="3" strokeLinejoin="round"/>
    <Circle cx="17" cy="29" r="1.8" fill={color} />
    <Path d="M14 32C14 32 20 38 30 38" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity={0.7}/>
  </Svg>
);

