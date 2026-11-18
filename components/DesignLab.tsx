'use client';
/**
 * Design Lab: a floating panel for trying colours, shapes and artwork live, without editing CSS.
 * Every control writes a CSS variable on <html> (inline style, so it beats the mood and theme),
 * saved in localStorage ('ial-lab') and re-applied before first paint by the script in layout.tsx.
 * Hidden on production (showExperiments in lib/themes.ts). "Copy CSS" gives the overrides as a
 * :root block, ready to paste into globals.css once a tweak is worth keeping.
 */
import { useCallback, useEffect, useState } from 'react';
import { MOODS } from '@/lib/moods';
import { useApp } from '@/lib/store';

const KEY = 'ial-lab';
const METAL = '_metal';

/** [CSS variable, label] for every colour you can change. */
const COLOURS: [string, string][] = [
  ['--bg', 'Background'], ['--sf', 'Cards and bars'], ['--ink', 'Text'], ['--i2', 'Secondary text'],
  ['--ac', 'Button fill'], ['--onac', 'Button text'], ['--btn-bd', 'Button border'],
  ['--ln', 'Card border'], ['--ctl', 'Control border'], ['--mk', 'Highlight'],
  ['--calm', 'Calm chip'], ['--sun', 'Reward chip'],
];
/** [CSS variable, label, min, max, step, unit] for every slider. */
const RANGES: [string, string, number, number, number, string][] = [
  ['--r-card', 'Card corners', 0, 32, 1, 'px'], ['--r-ctl', 'Button corners', 0, 28, 1, 'px'],
  ['--bw', 'Border width', 0, 4, 0.5, 'px'], ['--glass', 'Card opacity', 30, 100, 1, '%'],
  ['--blur', 'Glass blur', 0, 30, 1, 'px'], ['--sculpt-op', 'Sculpture strength', 0, 1, 0.05, ''],
  ['--hero-op', 'Photo strength', 0, 1, 0.05, ''],
];

type Saved = Record<string, string>;
const root = () => document.documentElement;
const readSaved = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

/** Turn any CSS colour into #rrggbb for the colour input. */
function toHex(c: string): string {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#000000';
  ctx.fillStyle = '#000000'; ctx.fillStyle = c.trim();
  const v = ctx.fillStyle;
  return v.startsWith('#') ? v : '#000000';
}
const cssVar = (k: string) => getComputedStyle(root()).getPropertyValue(k).trim();

export default function DesignLab() {
  const { s, set } = useApp();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved>({});
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setSaved(readSaved()); }, []);
  // Re-read the live values whenever the mood or mode changes, or the panel opens.
  useEffect(() => { const t = setTimeout(() => setTick((n) => n + 1), 50); return () => clearTimeout(t); }, [s.mood, s.theme, s.lightPick, s.darkPick, open]);

  const write = useCallback((k: string, v: string | null) => {
    const next = { ...readSaved() };
    if (v === null) delete next[k]; else next[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (k === METAL) { if (v) root().dataset.metal = v; else delete root().dataset.metal; }
    else if (v === null) root().style.removeProperty(k); else root().style.setProperty(k, v);
    setSaved(next); setTick((n) => n + 1);
  }, []);

  const resetAll = () => {
    Object.keys(readSaved()).forEach((k) => { if (k === METAL) delete root().dataset.metal; else root().style.removeProperty(k); });
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setSaved({}); setTick((n) => n + 1);
  };

  const copy = async () => {
    const lines = Object.entries(saved).filter(([k]) => k !== METAL).map(([k, v]) => `  ${k}: ${v};`);
    const css = `/* Design Lab overrides (mood: ${s.mood}) */\n:root {\n${lines.join('\n')}\n}${saved[METAL] ? `\n/* sculpture: ${saved[METAL]} */` : ''}\n`;
    try { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { window.prompt('Copy this CSS', css); }
  };

  const mode = s.theme === 'light' || s.theme === 'dark' || s.theme === 'system' ? s.theme : 'system';
  void tick; // value re-read happens during render below

  return (
    <>
      <button className="lab-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Design Lab">{open ? 'Close' : 'Lab'}</button>
      {open && (
        <div className="lab" role="dialog" aria-label="Design Lab">
          <div className="lab-sec">
            <b>Look</b>
            <select value={s.mood} onChange={(e) => set({ mood: e.target.value as typeof s.mood })} aria-label="Mood">
              {MOODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="lab-seg">
              {(['system', 'light', 'dark'] as const).map((m) => (
                <button key={m} className={mode === m ? 'on' : ''} onClick={() => set({ theme: m })}>{m === 'system' ? 'Phone' : m === 'light' ? 'Light' : 'Dark'}</button>
              ))}
            </div>
          </div>
          <div className="lab-sec">
            <b>Colours</b>
            {COLOURS.map(([k, label]) => {
              const v = typeof window === 'undefined' ? '#000000' : toHex(saved[k] ?? cssVar(k));
              return (
                <label className="lab-row" key={k}>
                  <span>{label}{saved[k] ? ' •' : ''}</span>
                  <input type="color" value={v} onChange={(e) => write(k, e.target.value)} />
                  <code>{v}</code>
                </label>
              );
            })}
          </div>
          <div className="lab-sec">
            <b>Shape and artwork</b>
            {RANGES.map(([k, label, min, max, step, unit]) => {
              const raw = typeof window === 'undefined' ? '0' : (saved[k] ?? cssVar(k));
              const n = parseFloat(raw) || 0;
              return (
                <label className="lab-row" key={k}>
                  <span>{label}{saved[k] ? ' •' : ''}</span>
                  <input type="range" min={min} max={max} step={step} value={n} onChange={(e) => write(k, `${e.target.value}${unit}`)} />
                  <code>{n}{unit}</code>
                </label>
              );
            })}
            <label className="lab-row">
              <span>Sculpture{saved[METAL] ? ' •' : ''}</span>
              <select value={saved[METAL] ?? ''} onChange={(e) => write(METAL, e.target.value || null)}>
                <option value="">Mood default</option><option value="gold">Gold</option><option value="silver">Silver</option>
              </select>
              <span />
            </label>
          </div>
          <div className="lab-act">
            <button onClick={copy}>{copied ? 'Copied' : 'Copy CSS'}</button>
            <button onClick={resetAll}>Reset all</button>
          </div>
          <p className="lab-note">A dot marks a value you changed. Changes apply to every mood until you reset.</p>
        </div>
      )}
    </>
  );
}
