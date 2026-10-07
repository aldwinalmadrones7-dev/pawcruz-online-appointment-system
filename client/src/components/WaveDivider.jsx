/**
 * WaveDivider — Decorative SVG wave placed between two landing sections.
 * `from` = background of the section above, `to` = background of the section below.
 */

const WAVES = {
  gentle: 'M0,64 C180,104 360,112 540,88 C720,64 900,8 1080,16 C1260,24 1380,64 1440,80 L1440,120 L0,120 Z',
  swell: 'M0,96 C240,24 480,24 720,64 C960,104 1200,104 1440,40 L1440,120 L0,120 Z',
};

export default function WaveDivider({ from = 'var(--bg)', to = 'var(--surface-alt)', variant = 'gentle', flip = false }) {
  return (
    <div className={`wave-divider${flip ? ' is-flipped' : ''}`} style={{ backgroundColor: from, color: to }} aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
        <path d={WAVES[variant]} fill="currentColor" opacity="0.45" transform="translate(0 -14)" />
        <path d={WAVES[variant]} fill="currentColor" />
      </svg>
    </div>
  );
}
