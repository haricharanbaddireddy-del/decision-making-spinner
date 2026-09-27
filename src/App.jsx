import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_OPTIONS = ['Pizza', 'Sushi', 'Tacos', 'Burgers'];
const COLORS = ['#cf674a', '#777e56', '#bd8b50', '#805d49', '#a4a779', '#d68b69', '#53664f', '#ad7950'];
const SPIN_DURATION = 5200;

function polarPoint(cx, cy, radius, angleDegrees) {
  const angle = (angleDegrees * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function Wheel({ options, rotation, spinning }) {
  const sliceAngle = 360 / options.length;
  const slices = options.map((option, index) => {
    const startAngle = -90 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const start = polarPoint(200, 200, 190, startAngle);
    const end = polarPoint(200, 200, 190, endAngle);
    const largeArc = sliceAngle > 180 ? 1 : 0;
    const label = polarPoint(200, 200, 119, startAngle + sliceAngle / 2);
    const compact = option.length > 13 ? `${option.slice(0, 12)}…` : option;

    return (
      <g key={`${option}-${index}`}>
        <path
          d={`M 200 200 L ${start.x} ${start.y} A 190 190 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
          fill={COLORS[index % COLORS.length]}
          stroke="#f8f2e9"
          strokeWidth="2"
        />
        <text
          x={label.x}
          y={label.y}
          fill="#fffaf2"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={options.length > 8 ? '11' : options.length > 6 ? '13' : '15'}
          fontWeight="700"
          letterSpacing="0.15"
        >
          {compact}
        </text>
      </g>
    );
  });

  return (
    <div className={`wheel-stage${spinning ? ' is-spinning' : ''}`}>
      <div className="pointer" aria-hidden="true"><span /></div>
      <div
        className="wheel-shadow"
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-label={`Decision wheel with ${options.length} options: ${options.join(', ')}`}
        role="img"
      >
        <svg className="wheel-svg" viewBox="0 0 400 400" aria-hidden="true">
          <circle cx="200" cy="200" r="196" fill="#f7eee0" />
          {slices}
          <circle cx="200" cy="200" r="190" fill="none" stroke="#f7eee0" strokeWidth="5" />
          <circle cx="200" cy="200" r="177" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1" />
        </svg>
      </div>
      <div className="wheel-hub" aria-hidden="true">
        <span className="hub-spark">✳</span>
        <span>DECIDE</span>
      </div>
    </div>
  );
}

function OptionsPanel({ options, onAdd, onRemove, onReset }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  function submitOption(event) {
    event.preventDefault();
    if (onAdd(draft)) {
      setDraft('');
      inputRef.current?.focus();
    }
  }

  return (
    <aside className="options-card" aria-labelledby="options-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2 id="options-title">Your options</h2>
        </div>
        <span className="option-count" aria-label={`${options.length} options`}>{String(options.length).padStart(2, '0')}</span>
      </div>
      <p className="panel-copy">Add the possibilities. We’ll take it from here.</p>

      <form className="add-form" onSubmit={submitOption}>
        <label className="sr-only" htmlFor="new-option">Add an option</label>
        <input
          ref={inputRef}
          id="new-option"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. Something delicious"
          maxLength={36}
          autoComplete="off"
        />
        <button className="add-button" type="submit" aria-label="Add option" disabled={!draft.trim()}>
          <span aria-hidden="true">+</span> Add Option
        </button>
      </form>

      <ul className="option-list" aria-label="Current options">
        {options.map((option, index) => (
          <li className="option-row" key={`${option}-${index}`}>
            <span className="option-dot" style={{ '--option-color': COLORS[index % COLORS.length] }} aria-hidden="true" />
            <span className="option-name">{option}</span>
            <button
              type="button"
              className="remove-button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${option}`}
              title={`Remove ${option}`}
            >
              <span aria-hidden="true">×</span><span className="remove-label">Remove</span>
            </button>
          </li>
        ))}
      </ul>

      {options.length < 2 && <p className="helper-message" role="status">Add at least one more option to spin.</p>}

      <div className="panel-footer">
        <span className="footer-mark" aria-hidden="true">✳</span>
        <span>Every choice has a little magic.</span>
        <button type="button" className="reset-button" onClick={onReset}>Reset</button>
      </div>
    </aside>
  );
}

export default function App() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState('');
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef(null);
  const countLabel = useMemo(() => `${options.length} ${options.length === 1 ? 'choice' : 'choices'}`, [options.length]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function addOption(value) {
    const option = value.trim();
    if (!option || spinning) return false;
    setOptions((current) => [...current, option]);
    setWinner('');
    return true;
  }

  function removeOption(index) {
    if (spinning) return;
    setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setWinner('');
  }

  function resetOptions() {
    if (spinning) return;
    setOptions([...DEFAULT_OPTIONS]);
    setWinner('');
    setRotation(0);
  }

  function spin() {
    if (spinning || options.length < 2) return;

    const winnerIndex = Math.floor(Math.random() * options.length);
    const sliceAngle = 360 / options.length;
    const targetAngle = (360 - (((winnerIndex + 0.5) * sliceAngle) % 360)) % 360;
    const currentAngle = ((rotation % 360) + 360) % 360;
    const alignmentDelta = (targetAngle - currentAngle + 360) % 360;
    const extraTurns = 5 + Math.floor(Math.random() * 3);

    setWinner('');
    setSpinning(true);
    setRotation(rotation + extraTurns * 360 + alignmentDelta);
    timerRef.current = window.setTimeout(() => {
      setWinner(options[winnerIndex]);
      setSpinning(false);
    }, SPIN_DURATION + 100);
  }

  return (
    <main className="app-shell">
      <div className="page-wrap">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="Decision Spinner home">
            <span className="brand-icon" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>Decision <em>Spinner</em></span>
          </a>
          <div className="top-note"><span className="tiny-spark" aria-hidden="true">✳</span> A small nudge from the universe</div>
        </header>

        <section className="intro" id="home" aria-labelledby="page-title">
          <p className="eyebrow intro-eyebrow">FOR THE BEAUTIFUL IN-BETWEEN</p>
          <h1 id="page-title">Decision Spinner<span className="title-period">.</span></h1>
          <p className="subtitle">Let the wheel decide<span className="subtitle-period">.</span></p>
        </section>

        <section className="main-grid" aria-label="Decision spinner">
          <div className="spinner-column">
            <div className="wheel-caption"><span className="caption-line" /> TODAY’S BIG QUESTION <span className="caption-line" /></div>
            <Wheel options={options} rotation={rotation} spinning={spinning} />
            <div className="spin-controls">
              <button className="spin-button" type="button" onClick={spin} disabled={spinning || options.length < 2}>
                <span className="spin-icon" aria-hidden="true">↻</span>{spinning ? 'SPINNING…' : 'SPIN'}
              </button>
              <p className="spin-hint" aria-live="polite">{spinning ? 'The universe is thinking…' : `${countLabel} on the wheel`}</p>
            </div>
            <div className={`result-card${winner ? ' has-winner' : ''}`} aria-live="polite" aria-atomic="true">
              {winner ? (
                <>
                  <span className="result-spark" aria-hidden="true">✳</span>
                  <div className="result-copy"><span>Your decision:</span><strong key={winner}>{winner}</strong></div>
                  <span className="result-spark" aria-hidden="true">✳</span>
                </>
              ) : (
                <span className="result-placeholder">{spinning ? 'Almost there…' : 'Your answer is just a spin away.'}</span>
              )}
            </div>
          </div>

          <OptionsPanel options={options} onAdd={addOption} onRemove={removeOption} onReset={resetOptions} />
        </section>

        <footer className="page-footer"><span>LESS OVERTHINKING, MORE LIVING.</span><span>MADE FOR THE MOMENTS THAT MATTER.</span></footer>
      </div>
    </main>
  );
}
