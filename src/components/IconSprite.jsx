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

        {/* mascot poses — same body/face geometry as mascot-tiny (translated +6,+6 for prop bleed),
            only tilt/arms/mouth/prop vary, so they read as one character in different moments */}
        <symbol id="mascot-ask" viewBox="0 0 72 72">
          <g transform="rotate(-6 34 38)">
            <path d="M14,42 L6,50" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M54,40 Q60,28 60,18" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M27,60 L27,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M41,60 L41,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
            <polygon points="20,16 46,16 54,24 54,52 46,60 20,60 14,52 14,24" fill="var(--cover)" />
            <polygon points="14,24 46,24 52,18 22,18" fill="var(--pages)" />
            <polygon points="32,18 38,18 40,34 35,28 30,34" fill="var(--ribbon)" />
            <path d="M24,31 l4,-2" stroke="var(--face)" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M36,29 l4,2" stroke="var(--face)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="27" cy="36" r="2.3" fill="var(--face)" />
            <circle cx="39" cy="36" r="2.3" fill="var(--face)" />
            <ellipse cx="33" cy="45" rx="4" ry="3" fill="var(--face)" />
          </g>
          <polygon points="58,4 70,4 70,14 62,14 58,18" fill="var(--pages)" stroke="var(--card-border)" strokeWidth="1" />
          <circle cx="65" cy="9" r="1.4" fill="var(--cover-dark)" />
        </symbol>

        <symbol id="mascot-scout" viewBox="0 0 72 72">
          <path d="M14,42 L6,50" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M54,40 L65,34" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M27,60 L27,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M41,60 L41,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
          <polygon points="20,16 46,16 54,24 54,52 46,60 20,60 14,52 14,24" fill="var(--cover)" />
          <polygon points="14,24 46,24 52,18 22,18" fill="var(--pages)" />
          <polygon points="32,18 38,18 40,34 35,28 30,34" fill="var(--ribbon)" />
          <path d="M24,36 q3,-2 6,0" stroke="var(--face)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="36" r="2.3" fill="var(--face)" />
          <path d="M25,43 Q33,49 41,43" stroke="var(--face)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="70" cy="30" r="7" fill="var(--glass-lens)" stroke="var(--glass-rim)" strokeWidth="2" />
          <path d="M64.5,35.5 L60,40" stroke="var(--glass-rim-dark)" strokeWidth="2.6" strokeLinecap="round" />
        </symbol>

        <symbol id="mascot-map" viewBox="0 0 72 72">
          <path d="M14,42 L20,50" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M54,42 L48,50" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M25,60 L23,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M43,60 L45,68" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" />
          <polygon points="20,16 46,16 54,24 54,52 46,60 20,60 14,52 14,24" fill="var(--cover)" />
          <polygon points="14,24 46,24 52,18 22,18" fill="var(--pages)" />
          <polygon points="32,18 38,18 46,36 35,28 30,34" fill="var(--ribbon)" />
          <circle cx="27" cy="36" r="2.3" fill="var(--face)" />
          <circle cx="39" cy="36" r="2.3" fill="var(--face)" />
          <path d="M25,43 Q33,49 41,43" stroke="var(--face)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <polygon points="18,48 50,46 52,64 16,66" fill="var(--pages)" stroke="var(--card-border)" strokeWidth="1" />
          <path d="M24,54 L34,52" stroke="var(--ribbon)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M28,58 L40,56" stroke="var(--ribbon)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="40" cy="60" r="1.8" fill="var(--cover-dark)" />
        </symbol>

        <symbol id="mascot-cheer" viewBox="0 0 72 72">
          <path d="M14,40 L4,22" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M54,40 L64,22" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M27,60 q-2,4 -6,6" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M41,60 q2,4 6,6" stroke="var(--cover-dark)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <polygon points="20,16 46,16 54,24 54,52 46,60 20,60 14,52 14,24" fill="var(--cover)" />
          <polygon points="14,24 46,24 52,18 22,18" fill="var(--pages)" />
          <polygon points="32,18 38,18 40,34 35,28 30,34" fill="var(--ribbon)" />
          <circle cx="27" cy="36" r="2.3" fill="var(--face)" />
          <circle cx="39" cy="36" r="2.3" fill="var(--face)" />
          <path d="M22,43 Q33,52 44,43" stroke="var(--face)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M16,68 Q34,78 52,68" stroke="var(--cover-light)" strokeWidth="2" fill="none" strokeDasharray="3 4" strokeLinecap="round" />
          <polygon points="60,4 62,10 68,12 62,14 60,20 58,14 52,12 58,10" fill="var(--gold)" />
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
        <symbol id="icon-book" viewBox="0 0 24 24"><path d="M12 6.5C10.3 5.3 7.8 4.7 5 4.7v13c2.8 0 5.3.6 7 1.8M12 6.5c1.7-1.2 4.2-1.8 7-1.8v13c-2.8 0-5.3.6-7 1.8M12 6.5v13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-grad-cap" viewBox="0 0 24 24"><path d="M12 5 3 9.5 12 14l9-4.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7 11.6V16c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M20.5 9.9v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></symbol>
        <symbol id="icon-dollar" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 6.5v11M15 9c0-1.4-1.3-2.2-3-2.2s-3 .8-3 2.1c0 3 6 1.5 6 4.4 0 1.4-1.3 2.2-3 2.2s-3-.8-3-2.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-rocket" viewBox="0 0 24 24"><path d="M12 3c2.8 1.6 4.5 4.7 4.5 9 0 2-.6 3.7-1.4 5H8.9c-.8-1.3-1.4-3-1.4-5 0-4.3 1.7-7.4 4.5-9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="10" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8.5 15.5 6 18.5M15.5 15.5l2.5 3M9.5 19.5h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></symbol>
        <symbol id="icon-badge-check" viewBox="0 0 24 24"><path d="M12 3.5 14 5l2.7-.4 1 2.5 2.3 1.4-.7 2.6.7 2.6-2.3 1.4-1 2.5L14 17l-2 1.5-2-1.5-2.7.4-1-2.5-2.3-1.4.7-2.6-.7-2.6 2.3-1.4 1-2.5L10 5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8.7 12.3l2.2 2.2 4.4-4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-stethoscope" viewBox="0 0 24 24"><path d="M7 4v5.2a3.8 3.8 0 0 0 7.6 0V4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M14.6 9.2v2a4.4 4.4 0 0 0 8.8 0v-.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="18.6" cy="9.2" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="7" cy="4" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="14.6" cy="4" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.3" /></symbol>
        <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M19.5 19.5 15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>
        <symbol id="icon-chat" viewBox="0 0 24 24"><path d="M4 5.5h16v11H10l-4 3.5v-3.5H4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></symbol>
        <symbol id="icon-map" viewBox="0 0 24 24"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></symbol>
        <symbol id="icon-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4 10h16M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="9" cy="14.5" r="1" fill="currentColor" /><circle cx="14" cy="14.5" r="1" fill="currentColor" /></symbol>
        <symbol id="icon-replay" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 2.5 5.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4 17v-5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-plusminus" viewBox="0 0 24 24">
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line className="faq-vline" x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
        <symbol id="icon-mail" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4 7l8 6.2L20 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></symbol>
        <symbol id="icon-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="15.2" r="1.3" fill="currentColor" /></symbol>
        <symbol id="icon-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="7" r="1.1" fill="currentColor" /></symbol>
        <symbol id="icon-linkedin" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="8" cy="8.3" r="1.15" fill="currentColor" /><path d="M8 11.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M12.2 17.5v-3.6c0-1.5 1-2.3 2.2-2.3s2.1.8 2.1 2.3v3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M12.2 11.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></symbol>

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
        <symbol id="deco-magnifier" viewBox="0 0 80 80">
          <circle cx="33" cy="33" r="24" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <line x1="50" y1="50" x2="72" y2="72" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </symbol>
        <symbol id="deco-sparkle" viewBox="0 0 32 32">
          <path d="M16 2 L19 13 30 16 19 19 16 30 13 19 2 16 13 13Z" fill="currentColor" />
        </symbol>
        <symbol id="deco-notebook" viewBox="0 0 130 100">
          <path d="M65 12 L14 20 20 88 65 82Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M65 12 L116 20 110 88 65 82Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M65 12 L65 82" stroke="currentColor" strokeWidth="1.6" />
          <path d="M26 34 L57 30M27 46 L58 42M28 58 L56 54" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M73 30 L104 34M72 42 L103 46M74 54 L102 58" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
