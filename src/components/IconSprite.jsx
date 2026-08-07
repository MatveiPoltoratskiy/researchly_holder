export default function IconSprite() {
  return (
    <svg className="visually-hidden" aria-hidden="true">
      <defs>
        {/* brand mascot */}
        <symbol id="mascot-tiny" viewBox="0 0 60 60">
          <polygon points="14,10 40,10 48,18 48,46 40,54 14,54 8,46 8,18" fill="var(--cover)" />
          <polygon points="8,18 40,18 46,12 16,12" fill="var(--pages)" />
          <polygon points="26,12 32,12 34,28 29,22 24,28" fill="var(--ribbon)" />
          <circle cx="21" cy="30" r="2.3" fill="var(--face)" />
          <circle cx="33" cy="30" r="2.3" fill="var(--face)" />
          <path d="M19,37 Q27,43 35,37" stroke="var(--face)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </symbol>

        {/* simple line icons */}
        <symbol id="icon-home" viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></symbol>
        <symbol id="icon-list" viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>
        <symbol id="icon-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M15 9l-2 6-4 2 2-6z" fill="currentColor" /></symbol>
        <symbol id="icon-bookmark" viewBox="0 0 24 24"><path d="M7 4h10v16l-5-4-5 4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></symbol>
        <symbol id="icon-user" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></symbol>
        <symbol id="icon-avatar" viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" fill="#fff" /><path d="M4 21c1.4-4.4 4.6-6.6 8-6.6s6.6 2.2 8 6.6" fill="#fff" /></symbol>
        <symbol id="icon-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M8 12.5l2.6 2.6L16 9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        {/* decorative sketches */}
        <symbol id="deco-hex" viewBox="0 0 140 110">
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <line x1="20" y1="55" x2="55" y2="30" /><line x1="55" y1="30" x2="95" y2="35" />
            <line x1="95" y1="35" x2="120" y2="65" /><line x1="55" y1="30" x2="60" y2="75" />
            <line x1="60" y1="75" x2="20" y2="55" /><line x1="60" y1="75" x2="95" y2="90" />
          </g>
          <g fill="currentColor">
            <circle cx="20" cy="55" r="4" /><circle cx="55" cy="30" r="4" /><circle cx="95" cy="35" r="4" />
            <circle cx="120" cy="65" r="4" /><circle cx="60" cy="75" r="4" /><circle cx="95" cy="90" r="4" />
          </g>
        </symbol>
        {/* scene pieces */}
        <symbol id="scene-pin" viewBox="0 0 24 32">
          <path d="M12 1c6 0 10 4.6 10 10.2C22 18.6 12 31 12 31S2 18.6 2 11.2C2 5.6 6 1 12 1Z" fill="var(--pin-fill,#fff)" stroke="var(--pin-stroke,#A94F1E)" strokeWidth="1.8" />
          <circle cx="12" cy="11.5" r="4" fill="var(--pin-stroke,#A94F1E)" />
        </symbol>
        <symbol id="scene-trees" viewBox="0 0 44 62">
          <rect x="20" y="48" width="4" height="12" fill="#5B4327" />
          <polygon points="22,4 34,30 10,30" fill="var(--pine)" />
          <polygon points="22,16 36,40 8,40" fill="var(--sage-front)" />
          <polygon points="22,28 38,52 6,52" fill="var(--sage-mid)" />
        </symbol>
        <symbol id="prop-microscope" viewBox="0 0 140 180">
          <ellipse cx="70" cy="168" rx="46" ry="8" fill="#000" opacity=".08" />
          <polygon points="34,160 106,160 96,146 44,146" fill="#B9AF98" />
          <rect x="60" y="118" width="20" height="30" rx="3" fill="#CFC6AE" />
          <path d="M70 40 C40 40 32 78 44 118 L86 118 C94 84 100 40 70 40Z" fill="#DED4BA" />
          <path d="M70 40 C50 40 42 70 48 100 L70 100 Z" fill="#EEE6D2" opacity=".7" />
          <rect x="30" y="100" width="80" height="14" rx="4" fill="#B9AF98" />
          <circle cx="70" cy="107" r="5" fill="#3B2A1E" />
          <rect x="60" y="10" width="20" height="34" rx="6" fill="#8C4A22" />
          <rect x="64" y="4" width="12" height="12" rx="3" fill="#3B2A1E" />
          <rect x="76" y="60" width="34" height="8" rx="4" fill="#8C4A22" />
          <circle cx="112" cy="64" r="7" fill="#3B2A1E" />
        </symbol>
        <symbol id="prop-books" viewBox="0 0 210 150">
          <ellipse cx="105" cy="144" rx="95" ry="8" fill="#000" opacity=".08" />
          <g fontFamily="Segoe UI, sans-serif" fontSize="13" fontWeight="700" fill="#F6EFDD">
            <rect x="10" y="108" width="190" height="30" rx="5" fill="#4C6B3E" />
            <text x="24" y="127">Biology</text>
            <rect x="16" y="80" width="178" height="30" rx="5" fill="#2A3A5C" />
            <text x="30" y="99">Chemistry</text>
            <rect x="10" y="52" width="190" height="30" rx="5" fill="#7A2E2E" />
            <text x="24" y="71">Neuroscience</text>
            <rect x="20" y="24" width="170" height="30" rx="5" fill="#8C5A24" />
            <text x="34" y="43">Data Science</text>
          </g>
        </symbol>
        <symbol id="prop-flasks" viewBox="0 0 180 200">
          <ellipse cx="90" cy="192" rx="80" ry="8" fill="#000" opacity=".08" />
          <rect x="10" y="30" width="6" height="150" fill="#8C7A56" />
          <rect x="128" y="30" width="6" height="150" fill="#8C7A56" />
          <rect x="10" y="30" width="124" height="6" fill="#8C7A56" />
          <g>
            <rect x="24" y="70" width="16" height="90" rx="7" fill="#EDE6D3" stroke="#C9BE9E" strokeWidth="1.5" />
            <rect x="24" y="118" width="16" height="42" rx="6" fill="var(--cover)" />
            <rect x="58" y="55" width="16" height="105" rx="7" fill="#EDE6D3" stroke="#C9BE9E" strokeWidth="1.5" />
            <rect x="58" y="100" width="16" height="60" rx="6" fill="var(--sage-front)" />
            <rect x="92" y="65" width="16" height="95" rx="7" fill="#EDE6D3" stroke="#C9BE9E" strokeWidth="1.5" />
            <rect x="92" y="112" width="16" height="48" rx="6" fill="#3F6B7A" />
          </g>
          <path d="M150 40 h14 l4 22 16 60 a10 10 0 0 1-10 14 h-30 a10 10 0 0 1-10-14 l16-60Z" fill="#EDE6D3" stroke="#C9BE9E" strokeWidth="1.5" />
          <path d="M143 96 a10 10 0 0 0-2 8 l-2 8 a10 10 0 0 0 10 14 h30 a10 10 0 0 0 10-14 l-2-8a10 10 0 0 0-2-8Z" fill="#3F6B7A" opacity=".85" />
        </symbol>
        <symbol id="prop-plant" viewBox="0 0 130 160">
          <ellipse cx="65" cy="152" rx="55" ry="8" fill="#000" opacity=".08" />
          <polygon points="30,110 100,110 90,150 40,150" fill="#B9622F" />
          <polygon points="30,110 100,110 95,122 35,122" fill="#D97C3F" />
          <polygon points="40,150 90,150 86,158 44,158" fill="#8C4A22" />
          <g className="plant-leaves">
            <path d="M65 112 C40 90 30 55 45 20 C60 55 62 90 65 112Z" fill="var(--pine)" />
            <path d="M65 112 C90 88 100 55 88 18 C70 52 66 88 65 112Z" fill="var(--sage-front)" />
            <path d="M65 112 C55 80 55 45 65 15 C78 45 76 80 65 112Z" fill="var(--sage-mid)" />
          </g>
        </symbol>
      </defs>
    </svg>
  )
}
