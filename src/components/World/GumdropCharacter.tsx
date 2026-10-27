import React, { useState, useEffect } from 'react';
import type { CharacterDef, CharacterLiveState } from '../../types';
import { getGroundY, getGroundSlope } from '../../utils/math';
import { soundEngine } from '../../audio/soundEngine';

interface GumdropCharacterProps {
  def: CharacterDef;
  live: CharacterLiveState;
  cursorWorldX: number | null;
  cursorWorldY: number | null;
  onCharacterClick: (id: string) => void;
}

export const GumdropCharacter: React.FC<GumdropCharacterProps> = ({
  def,
  live,
  cursorWorldX,
  cursorWorldY,
  onCharacterClick,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic organic blinking
  useEffect(() => {
    let blinkTimer: number;
    let cancel = false;

    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 3500;
      blinkTimer = window.setTimeout(() => {
        if (cancel) return;
        setIsBlinking(true);
        setTimeout(() => {
          if (cancel) return;
          setIsBlinking(false);
          scheduleBlink();
        }, 180);
      }, delay);
    };

    scheduleBlink();
    return () => {
      cancel = true;
      clearTimeout(blinkTimer);
    };
  }, []);

  const groundY = getGroundY(live.x);
  const slopeAngleRad = getGroundSlope(live.x);
  const slopeDeg = (slopeAngleRad * 180) / Math.PI;

  // Authentic Gumdrop Waddle & Hop Mechanics
  const isMoving =
    live.action === 'walking' || live.action === 'starting' || live.action === 'slowing';
  const speedRatio = Math.min(1, Math.abs(live.vx) / Math.max(1, def.baseSpeed));

  // Coordinated step cycle (7.0 rad/s scaled by speed)
  const hopCycle = (live.walkTimer * 6.5) % Math.PI;
  // Hop height scales with current velocity so landing is always 100% grounded
  const hopY = isMoving ? -Math.sin(hopCycle) * 7.5 * speedRatio : 0;
  const stepTilt = isMoving ? Math.cos(live.walkTimer * 6.5) * 3.0 * speedRatio : 0;

  // Subtle dynamic squash-and-stretch coordinated with steps
  const dynamicSquashX = isMoving ? 1 + Math.sin(hopCycle) * 0.04 * speedRatio : 1;
  const dynamicSquashY = isMoving ? 1 - Math.sin(hopCycle) * 0.06 * speedRatio : 1;

  // Facing orientation: 1 for right, -1 for left
  const facingDir = live.facing === 'left' ? -1 : 1;

  // Calm, natural gaze tracking: cursor tracking when close, subtle looking around when idle
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  if (cursorWorldX !== null && cursorWorldY !== null) {
    const dx = cursorWorldX - live.x;
    const dy = cursorWorldY - (groundY - 20);
    const dist = Math.hypot(dx, dy);
    if (dist < 400 && dist > 15) {
      pupilOffsetX = (dx / dist) * 2.0 * facingDir;
      pupilOffsetY = Math.max(-1.5, Math.min(1.8, (dy / dist) * 1.8));
    }
  } else if (!isMoving && live.idleLookOffset !== 0) {
    // Calm, subtle look around while resting in the grass
    pupilOffsetX = live.idleLookOffset * 1.5 * facingDir;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playGumdropPop(def.signaturePitch);
    onCharacterClick(def.id);
  };

  const { palette } = def;
  const gradientId = `gummy-grad-${def.id}`;
  const shadowId = `gummy-sh-${def.id}`;

  return (
    <g
      transform={`translate(${live.x}, ${groundY + hopY})`}
      className="cursor-pointer select-none group"
      onClick={handleClick}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* 1. Dynamic Contact Shadow (Puffs and shrinks as gumdrop hops) */}
      <ellipse
        cx="0"
        cy="2"
        rx={34 * (1 - Math.abs(hopY) * 0.03)}
        ry={4.2 * (1 - Math.abs(hopY) * 0.04)}
        fill="#593d3b"
        opacity={Math.max(0.12, 0.32 - Math.abs(hopY) * 0.015)}
      />

      {/* 2. Character Body Container with slope tilt, hop tilt, and facing flip */}
      <g
        transform={`
          rotate(${slopeDeg * 0.35 + stepTilt})
          scale(${facingDir * (2 - live.squashStretch) * dynamicSquashX}, ${live.squashStretch * dynamicSquashY})
        `}
        style={{ transformOrigin: '0px 0px' }}
      >
        {/* Render EXACT canonical Pickle Corp 110x52 Gumdrop Geometry */}
        <g transform="translate(-55, -44)">
          <defs>
            <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#593d3b" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#593d3b" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#593d3b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={palette.bodyTop} />
              <stop offset="100%" stopColor={palette.bodyBottom} />
            </linearGradient>
          </defs>

          {/* Authentic Pickle Corp Low-Profile Mound Path */}
          <path
            d="
              M 15,44
              C 9,44 6.5,39.5 9,34
              C 13.5,23.5 26,12 44,8.5
              C 50,7.2 60,7.2 66,8.5
              C 84,12 96.5,23.5 101,34
              C 103.5,39.5 101,44 95,44
              Z
            "
            fill={`url(#${gradientId})`}
            stroke={palette.outline}
            strokeWidth="3.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Rosy Cheeks */}
          <ellipse cx="36" cy="30" rx="4.6" ry="2.3" fill={palette.blush} opacity="0.9" />
          <ellipse cx="74" cy="30" rx="4.6" ry="2.3" fill={palette.blush} opacity="0.9" />

          {/* Eyes (Blinking vs Open with Gaze) */}
          {isBlinking ? (
            <g>
              <path
                d="M 42.5,27 Q 46,24 49.5,27"
                fill="none"
                stroke={palette.outline}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 60.5,27 Q 64,24 67.5,27"
                fill="none"
                stroke={palette.outline}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <circle cx={46 + pupilOffsetX} cy={26 + pupilOffsetY} r="3.3" fill={palette.outline} />
              <circle cx={44.8 + pupilOffsetX} cy={24.8 + pupilOffsetY} r="1.1" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx={64 + pupilOffsetX} cy={26 + pupilOffsetY} r="3.3" fill={palette.outline} />
              <circle cx={62.8 + pupilOffsetX} cy={24.8 + pupilOffsetY} r="1.1" fill="#ffffff" />
            </g>
          )}

          {/* Sweet Smile */}
          <path
            d="M 52.4,27.8 Q 55,30.2 57.6,27.8"
            fill="none"
            stroke={palette.outline}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* ════════════════════════════════════════════════════════
              ROLE ACCESSORIES (Carefully Fitted to the 110x52 Shape)
          ════════════════════════════════════════════════════════ */}

          {/* Student: Round Glasses on Eyes + Tiny Book */}
          {def.id === 'student' && (
            <g>
              <circle cx="46" cy="26" r="6" fill="none" stroke={palette.accessoryPrimary} strokeWidth="1.6" />
              <circle cx="64" cy="26" r="6" fill="none" stroke={palette.accessoryPrimary} strokeWidth="1.6" />
              <line x1="52" y1="26" x2="58" y2="26" stroke={palette.accessoryPrimary} strokeWidth="1.6" />
              {/* Book */}
              <rect x="76" y="26" width="16" height="18" rx="2" fill="#543c2c" stroke={palette.outline} strokeWidth="1.5" />
              <line x1="79" y1="31" x2="88" y2="31" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="79" y1="35" x2="86" y2="35" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="79" y1="39" x2="87" y2="39" stroke="#ffffff" strokeWidth="1.2" />
            </g>
          )}

          {/* Listener: Knitted Scarf draped along the neck curve */}
          {def.id === 'listener' && (
            <g>
              <path
                d="M 24,37 Q 55,45 86,37 L 88,42 Q 55,50 22,42 Z"
                fill={palette.accessoryPrimary}
                stroke={palette.outline}
                strokeWidth="1.6"
              />
              {/* Fringed scarf tail */}
              <rect x="68" y="38" width="10" height="16" rx="2" fill={palette.accessoryPrimary} stroke={palette.outline} strokeWidth="1.4" />
              <line x1="70" y1="54" x2="70" y2="58" stroke={palette.outline} strokeWidth="1.2" />
              <line x1="73" y1="54" x2="73" y2="58" stroke={palette.outline} strokeWidth="1.2" />
              <line x1="76" y1="54" x2="76" y2="58" stroke={palette.outline} strokeWidth="1.2" />
            </g>
          )}

          {/* Ideas: Sparkling Epiphany Star hovering above dome */}
          {def.id === 'ideas' && (
            <g transform="translate(55, -2)" className="animate-pulse">
              <path
                d="M 0,-8 L 2.5,-2.5 L 8,0 L 2.5,2.5 L 0,8 L -2.5,2.5 L -8,0 L -2.5,-2.5 Z"
                fill={palette.accessoryPrimary}
                stroke="#d48b28"
                strokeWidth="1.2"
              />
              <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Explorer: Acorn Cap on head dome */}
          {def.id === 'explorer' && (
            <g transform="translate(55, 6)">
              {/* Acorn cup */}
              <path
                d="M -16,4 Q 0,-6 16,4 Q 18,10 0,9 Q -18,10 -16,4 Z"
                fill={palette.accessoryPrimary}
                stroke={palette.outline}
                strokeWidth="1.8"
              />
              <circle cx="0" cy="-2.5" r="2.2" fill="#3b2416" />
              {/* Tiny feather */}
              <path d="M 6,0 Q 14,-10 18,-6 Q 14,-2 8,2" fill="#81c784" stroke={palette.outline} strokeWidth="1" />
            </g>
          )}

          {/* Gardener: Sweet Little Sprout seedling emerging from dome */}
          {def.id === 'gardener' && (
            <g transform="translate(55, 7)">
              <path d="M 0,0 Q 4,-10 0,-16" fill="none" stroke="#2e7d32" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse cx="-4" cy="-15" rx="5" ry="3" transform="rotate(-30, -4, -15)" fill="#4caf50" stroke="#2e7d32" strokeWidth="1" />
              <ellipse cx="4" cy="-17" rx="5" ry="3" transform="rotate(30, 4, -17)" fill="#66bb6a" stroke="#2e7d32" strokeWidth="1" />
            </g>
          )}

          {/* Inventor: Brass Tinkering Goggles on forehead */}
          {def.id === 'inventor' && (
            <g transform="translate(55, 12)">
              {/* Leather strap */}
              <line x1="-28" y1="5" x2="28" y2="5" stroke="#4e342e" strokeWidth="2.5" />
              {/* Brass goggle rims */}
              <circle cx="-10" cy="4" r="6" fill="#ffd54f" stroke="#8d6e63" strokeWidth="1.8" />
              <circle cx="10" cy="4" r="6" fill="#ffd54f" stroke="#8d6e63" strokeWidth="1.8" />
              <circle cx="-10" cy="4" r="4" fill="#80deea" opacity="0.8" />
              <circle cx="10" cy="4" r="4" fill="#80deea" opacity="0.8" />
              <line x1="-4" y1="4" x2="4" y2="4" stroke="#8d6e63" strokeWidth="1.8" />
            </g>
          )}

          {/* Comedian: Dapper Polka-Dot Bowtie */}
          {def.id === 'comedian' && (
            <g transform="translate(55, 43)">
              <polygon points="0,0 -10,-6 -10,6" fill={palette.bodyBottom} stroke={palette.outline} strokeWidth="1.5" />
              <polygon points="0,0 10,-6 10,6" fill={palette.bodyBottom} stroke={palette.outline} strokeWidth="1.5" />
              <circle cx="-5" cy="-2" r="1" fill="#ffffff" />
              <circle cx="-5" cy="2" r="1" fill="#ffffff" />
              <circle cx="5" cy="-2" r="1" fill="#ffffff" />
              <circle cx="5" cy="2" r="1" fill="#ffffff" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" stroke={palette.outline} strokeWidth="1.2" />
            </g>
          )}
        </g>
      </g>

      {/* Floating Name Label on Hover */}
      <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <rect
          x="-35"
          y="-58"
          width="70"
          height="18"
          rx="9"
          fill="#593d3b"
          opacity="0.95"
        />
        <text
          x="0"
          y="-45"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="10"
          fontWeight="bold"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {def.name}
        </text>
      </g>
    </g>
  );
};
