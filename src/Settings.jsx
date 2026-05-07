// Settings.jsx — Modal de configuración con cookies 🍪⚙️
import { useState } from 'react';

const DEFAULTS = {
  fancyBg: true,
  blur: 35,
  collisions: true,
  glow: true,
  reducedMotion: false,
  compactCards: false,
  monoColor: false,
};

export function loadSettings() {
  try {
    const raw = document.cookie.split('; ').find(r => r.startsWith('ithymag_settings='));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(decodeURIComponent(raw.split('=')[1])) };
  } catch { return { ...DEFAULTS }; }
}

export function saveSettings(settings) {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `ithymag_settings=${encodeURIComponent(JSON.stringify(settings))}; expires=${expires}; path=/`;
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

function Slider({ label, desc, value, min, max, step, onChange }) {
  return (
    <div className="setting-row setting-row-col">
      <div className="setting-info">
        <span className="setting-label">{label} <span style={{color:'var(--accent)',fontWeight:700}}>{value}</span></span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="settings-slider"
      />
    </div>
  );
}

export default function SettingsModal({ settings, onChange, onClose }) {
  const set = (key, val) => {
    const next = { ...settings, [key]: val };
    onChange(next);
    saveSettings(next);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div className="modal-logo" style={{ textAlign: 'left', fontSize: '1.4rem', marginBottom: 2 }}>⚙️ Settings</div>
            <div className="modal-sub" style={{ textAlign: 'left', marginBottom: 0 }}>Configuración de iThyMag</div>
          </div>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section-title">🎨 Fondo Visual</div>

        <Toggle
          label="Fondo animado de plasma"
          desc="Blobs de colores que se mueven, chocan y emiten luz"
          checked={settings.fancyBg}
          onChange={v => set('fancyBg', v)}
        />

        {settings.fancyBg && <>
          <Slider
            label="Desenfoque"
            desc="Qué tan borrosos se ven los blobs"
            value={settings.blur}
            min={0} max={80} step={5}
            onChange={v => set('blur', v)}
          />
          <Toggle
            label="Colisiones físicas"
            desc="Los blobs rebotan entre sí"
            checked={settings.collisions}
            onChange={v => set('collisions', v)}
          />
          <Toggle
            label="Emisión de luz"
            desc="Flash de luz cuando los blobs chocan"
            checked={settings.glow}
            onChange={v => set('glow', v)}
          />
        </>}

        <div className="settings-section-title" style={{ marginTop: 20 }}>🖥️ Interfaz</div>

        <Toggle
          label="Movimiento reducido"
          desc="Desactiva animaciones y transiciones"
          checked={settings.reducedMotion}
          onChange={v => set('reducedMotion', v)}
        />
        <Toggle
          label="Tarjetas compactas"
          desc="Menos padding, más posts visibles"
          checked={settings.compactCards}
          onChange={v => set('compactCards', v)}
        />

        <div className="settings-section-title" style={{ marginTop: 20 }}>🎨 ASCII</div>
        <Toggle
          label="Color mono para ASCII"
          desc="Usa solo blanco en lugar del color de acento"
          checked={settings.monoColor}
          onChange={v => set('monoColor', v)}
        />

        <button
          className="btn-save-profile"
          style={{ marginTop: 20, width: '100%' }}
          onClick={() => { saveSettings(DEFAULTS); onChange(DEFAULTS); }}
        >
          Restablecer valores por defecto
        </button>
      </div>
    </div>
  );
}