export const WORLD_WIDTH = 5000;
export const WORLD_HEIGHT = 900;

/**
 * Calculates smooth continuous ground surface Y coordinate (px from top)
 * Lower numbers = higher elevation on hilltops.
 */
export function getGroundY(x: number): number {
  // Clamp input
  const clampedX = Math.max(0, Math.min(WORLD_WIDTH, x));

  // Layered rolling hill sine & cosine waves
  const hillBase = 680;
  const broadHill = Math.sin(clampedX * 0.0014) * 45;
  const secondaryRidge = Math.sin(clampedX * 0.0038 + 1.2) * 25;
  const localKnoll = Math.cos(clampedX * 0.0075) * 12;

  // Specific landmarks topography:
  // - Pond basin dip around x = 1650
  const pondDist = Math.abs(clampedX - 1650);
  const pondDip = pondDist < 350 ? (1 - pondDist / 350) * 28 : 0;

  // - High Western Ridge elevation rise around x = 4300
  const ridgeDist = Math.abs(clampedX - 4300);
  const ridgeRise = ridgeDist < 600 ? (1 - ridgeDist / 600) * -38 : 0;

  return hillBase + broadHill + secondaryRidge + localKnoll + pondDip + ridgeRise;
}

/**
 * Calculates local ground slope angle in radians for subtle character & object tilting
 */
export function getGroundSlope(x: number): number {
  const dx = 10;
  const y1 = getGroundY(x - dx);
  const y2 = getGroundY(x + dx);
  return Math.atan2(y2 - y1, dx * 2);
}

/**
 * Linear interpolation helper
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Interpolates two hex colors
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const clampT = Math.max(0, Math.min(1, t));
  const parse = (c: string) => {
    let clean = c.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(ch => ch + ch).join('');
    }
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);

  const r = Math.round(r1 + (r2 - r1) * clampT);
  const g = Math.round(g1 + (g2 - g1) * clampT);
  const b = Math.round(b1 + (b2 - b1) * clampT);

  return `rgb(${r}, ${g}, ${b})`;
}
