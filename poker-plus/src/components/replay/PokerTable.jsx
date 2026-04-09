import React, { useRef, useEffect, useState } from 'react';
import PlayerSeat from './PlayerSeat';
import CommunityCardArea from './CommunityCardArea';

// ── Seat angle tables (degrees: 0=right, 90=bottom=Hero, 180=left, 270=top)
const SEAT_ANGLES = {
  2:  [90, 270],
  3:  [90, 210, 330],
  4:  [90, 30, 330, 270],
  5:  [90, 30, 350, 190, 150],
  6:  [90, 30, 330, 270, 210, 150],
  7:  [90, 40, 340, 300, 250, 200, 140],
  8:  [90, 40, 340, 290, 270, 250, 200, 140],
  9:  [90, 40, 10, 340, 290, 270, 220, 170, 140],
  10: [90, 50, 20, 340, 305, 270, 235, 200, 160, 130],
};

// ── Virtual coordinate space (portrait phone proportions) ──
export const VW = 390;
export const VH = 680;
const CX = VW / 2;       // 195
const CY = VH / 2 - 25;  // 315 — slightly above center

// Felt ellipse radii (portrait oval: taller than wide)
const ERX = 142;
const ERY = 225;

// Seat placement radii — panels overlap the table rail edge
const SRX = 158;
const SRY = 240;

// Panel centering constants (visual size estimate)
const PANEL_W = 112;
const PANEL_H = 70;

function seatCoords(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + SRX * Math.cos(rad),
    y: CY + SRY * Math.sin(rad),
  };
}

function chipColor(amount, bbAmount) {
  if (!bbAmount) return '#6b7280';
  const bb = amount / bbAmount;
  if (bb >= 50) return '#7c3aed';
  if (bb >= 10) return '#a16207';
  return '#6b7280';
}

function ChipFly({ fromX, fromY, toX, toY, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'absolute',
      left: `${(fromX / VW) * 100}%`,
      top:  `${(fromY / VH) * 100}%`,
      width: 13, height: 13,
      borderRadius: '50%',
      background: color,
      border: '2px solid rgba(255,255,255,0.55)',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
      zIndex: 20,
      animation: 'chipSlide 0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
      '--dx': `${((toX - fromX) / VW) * 100}vw`,
      '--dy': `${((toY - fromY) / VH) * 100}vh`,
    }} />
  );
}

export default function PokerTable({ savedGame, frame }) {
  const { sbAmount = 1, bbAmount = 2 } = savedGame;
  const playerCount = Math.min(frame.playerStates.length, 10);
  const angles = SEAT_ANGLES[playerCount] || SEAT_ANGLES[2];

  // Hero always at angle 90 (bottom)
  const heroIdx = frame.playerStates.findIndex(ps => ps.isHero);
  const orderedPlayers = [...frame.playerStates];
  if (heroIdx > 0) {
    const hero = orderedPlayers.splice(heroIdx, 1)[0];
    orderedPlayers.unshift(hero);
  }

  // Chip animations
  const [chips, setChips] = useState([]);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!frame || frame === frameRef.current) return;
    frameRef.current = frame;
    if (frame.type !== 'action') return;
    const actor = frame.playerStates.find(ps => ps.chipsToAnimate > 0);
    if (!actor) return;
    const actorIdx = orderedPlayers.findIndex(ps => ps.name === actor.name);
    if (actorIdx < 0 || actorIdx >= angles.length) return;
    const { x: fx, y: fy } = seatCoords(angles[actorIdx]);
    const id = Date.now();
    setChips(prev => [...prev, { id, fx, fy, color: chipColor(actor.chipsToAnimate, bbAmount) }]);
  }, [frame]);

  const removeChip = id => setChips(prev => prev.filter(c => c.id !== id));

  const potX = CX;
  const potY = CY - 40;   // above community cards

  return (
    <div style={{
      width: '100%',
      aspectRatio: `${VW} / ${VH}`,
      position: 'relative',
      overflow: 'visible',
      /* ── Dark atmospheric background ── */
      background: 'radial-gradient(ellipse 80% 70% at 50% 48%, #3b1040 0%, #1d0828 50%, #0b0313 100%)',
      borderRadius: 12,
    }}>

      {/* ── Ambient glow ── */}
      <div style={{ position:'absolute', inset:0, borderRadius:12, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'10%', left:'15%', width:'70%', height:'55%',
          background:'radial-gradient(ellipse, rgba(155,25,25,0.16) 0%, transparent 70%)',
        }}/>
      </div>

      {/* ── Table SVG (stadium / capsule shape) ── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Felt: radial from bright-center to dark-edge */}
          <radialGradient id="feltGrad" cx="50%" cy="44%" r="56%">
            <stop offset="0%"   stopColor="#d42424"/>
            <stop offset="55%"  stopColor="#b51818"/>
            <stop offset="100%" stopColor="#800d0d"/>
          </radialGradient>
          {/* Subtle top-light sheen on felt */}
          <linearGradient id="feltSheen" x1="35%" y1="0%" x2="65%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.07)"/>
            <stop offset="45%"  stopColor="rgba(255,255,255,0.02)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </linearGradient>
          {/* Felt edge vignette */}
          <radialGradient id="feltVig" cx="50%" cy="50%" r="50%">
            <stop offset="72%"  stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.40)"/>
          </radialGradient>
          {/* Rail: warm wood gradient */}
          <linearGradient id="railGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stopColor="#6b4220"/>
            <stop offset="45%"  stopColor="#3e2309"/>
            <stop offset="100%" stopColor="#1a0d02"/>
          </linearGradient>
          {/* Rail top-highlight (simulates overhead light on curved edge) */}
          <linearGradient id="railHL" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stopColor="rgba(200,150,80,0.35)"/>
            <stop offset="30%"  stopColor="rgba(200,150,80,0)"/>
          </linearGradient>
        </defs>

        {/*
          All shapes use <rect rx={ERX}> to create the stadium/capsule look:
          straight sides + perfect semicircle caps — just like a real poker table.
        */}

        {/* Outer soft glow */}
        <rect
          x={CX-ERX-52} y={CY-ERY-52}
          width={(ERX+52)*2} height={(ERY+52)*2}
          rx={ERX+52} ry={ERX+52}
          fill="none" stroke="rgba(180,35,35,0.09)" strokeWidth="28"/>

        {/* Drop-shadow base for the table */}
        <rect
          x={CX-ERX-26} y={CY-ERY-22}
          width={(ERX+26)*2} height={(ERY+22)*2}
          rx={ERX+26} ry={ERX+26}
          fill="rgba(0,0,0,0.45)"/>

        {/* Wooden rail body */}
        <rect
          x={CX-ERX-22} y={CY-ERY-22}
          width={(ERX+22)*2} height={(ERY+22)*2}
          rx={ERX+22} ry={ERX+22}
          fill="url(#railGrad)"/>
        {/* Rail highlight stripe */}
        <rect
          x={CX-ERX-22} y={CY-ERY-22}
          width={(ERX+22)*2} height={(ERY+22)*2}
          rx={ERX+22} ry={ERX+22}
          fill="url(#railHL)"/>
        {/* Rail outer gold bead */}
        <rect
          x={CX-ERX-22} y={CY-ERY-22}
          width={(ERX+22)*2} height={(ERY+22)*2}
          rx={ERX+22} ry={ERX+22}
          fill="none" stroke="rgba(190,148,55,0.65)" strokeWidth="1.5"/>
        {/* Rail outer dark edge */}
        <rect
          x={CX-ERX-23} y={CY-ERY-23}
          width={(ERX+23)*2} height={(ERY+23)*2}
          rx={ERX+23} ry={ERX+23}
          fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>

        {/* Rail inner lip / channel shadow */}
        <rect
          x={CX-ERX-10} y={CY-ERY-10}
          width={(ERX+10)*2} height={(ERY+10)*2}
          rx={ERX+10} ry={ERX+10}
          fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="14"/>

        {/* ── Red felt surface ── */}
        <rect
          x={CX-ERX} y={CY-ERY}
          width={ERX*2} height={ERY*2}
          rx={ERX} ry={ERX}
          fill="url(#feltGrad)"/>
        {/* Felt light sheen */}
        <rect
          x={CX-ERX} y={CY-ERY}
          width={ERX*2} height={ERY*2}
          rx={ERX} ry={ERX}
          fill="url(#feltSheen)"/>
        {/* Felt edge vignette */}
        <rect
          x={CX-ERX} y={CY-ERY}
          width={ERX*2} height={ERY*2}
          rx={ERX} ry={ERX}
          fill="url(#feltVig)"/>
        {/* Felt edge bright bead */}
        <rect
          x={CX-ERX} y={CY-ERY}
          width={ERX*2} height={ERY*2}
          rx={ERX} ry={ERX}
          fill="none" stroke="rgba(255,80,80,0.20)" strokeWidth="1.5"/>

        {/* Inner decorative line */}
        <rect
          x={CX-ERX+16} y={CY-ERY+16}
          width={(ERX-16)*2} height={(ERY-16)*2}
          rx={ERX-16} ry={ERX-16}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>
      </svg>

      {/* ── Player panels ── */}
      {orderedPlayers.map((ps, i) => {
        if (i >= angles.length) return null;
        const { x, y } = seatCoords(angles[i]);
        const isActive = frame.activeEntry?.player === ps.name;
        return (
          <div
            key={ps.id ?? ps.name}
            style={{
              position: 'absolute',
              left: `${((x - PANEL_W / 2) / VW) * 100}%`,
              top:  `${((y - PANEL_H / 2) / VH) * 100}%`,
              zIndex: 5,
            }}
          >
            <PlayerSeat
              playerState={ps}
              isActive={isActive}
              actionEntry={isActive ? frame.activeEntry : null}
            />
          </div>
        );
      })}

      {/* ── Pot display ── */}
      <div style={{
        position: 'absolute',
        left: `${(potX / VW) * 100}%`,
        top:  `${(potY / VH) * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 6,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          border: '1px solid rgba(251,191,36,0.5)',
          borderRadius: 8,
          padding: '3px 10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>底池</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', letterSpacing: 0.5 }}>
            ${frame.pot}
          </span>
        </div>
      </div>

      {/* ── Community cards + win label ── */}
      <div style={{
        position: 'absolute',
        left: `${(CX / VW) * 100}%`,
        top:  `${((CY + 15) / VH) * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <CommunityCardArea boardCards={frame.boardCards} newCards={frame.newCards} />
        {frame.type === 'win' && frame.label && (
          <div style={{
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid #fbbf24',
            borderRadius: 8,
            padding: '4px 14px',
            color: '#fbbf24',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            🏆 {frame.label}
          </div>
        )}
      </div>

      {/* ── Chip animations ── */}
      {chips.map(c => (
        <ChipFly
          key={c.id}
          fromX={c.fx} fromY={c.fy}
          toX={potX}   toY={potY}
          color={c.color}
          onDone={() => removeChip(c.id)}
        />
      ))}
    </div>
  );
}
