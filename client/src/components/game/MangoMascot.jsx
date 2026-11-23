import React from 'react'

const MOOD_LABELS = {
  idle: 'ready to learn',
  happy: 'happy',
  sad: 'thinking it through',
  thinking: 'thinking',
  celebrate: 'celebrating',
}

export function MangoMascot({ mood = 'idle', message, compact = false }) {
  const safeMood = MOOD_LABELS[mood] ? mood : 'idle'
  return (
    <div className={'mango-mascot-row' + (compact ? ' mango-mascot-row-compact' : '')}>
      <div className="mango-mascot-stage" role="img" aria-label={'Mango mascot, ' + MOOD_LABELS[safeMood]}>
        <svg className="mango-mascot-svg" viewBox="0 0 150 150" aria-hidden="true">
          <defs>
            <linearGradient id="mangoFruit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD66E" />
              <stop offset="58%" stopColor="#F9AC32" />
              <stop offset="100%" stopColor="#E77A24" />
            </linearGradient>
            <linearGradient id="mangoLeaf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6DBB75" />
              <stop offset="100%" stopColor="#287A51" />
            </linearGradient>
          </defs>
          <ellipse className="mango-shadow" cx="75" cy="133" rx="39" ry="7" fill="#18201C" opacity=".10" />
          <path className="mango-arm mango-arm-left" d="M34 85 C17 82 12 91 18 103 C22 110 30 109 37 102" fill="none" stroke="#D97A2D" strokeWidth="8" strokeLinecap="round" />
          <path className="mango-arm mango-arm-right" d="M116 85 C133 82 138 91 132 103 C128 110 120 109 113 102" fill="none" stroke="#D97A2D" strokeWidth="8" strokeLinecap="round" />
          <path className="mango-stem" d="M75 27 C74 19 77 16 82 13" fill="none" stroke="#7D512B" strokeWidth="6" strokeLinecap="round" />
          <path className="mango-leaf" d="M80 18 C86 3 107 4 117 12 C107 27 91 29 80 18Z" fill="url(#mangoLeaf)" />
          <path className="mango-leaf-vein" d="M84 19 C96 15 104 13 113 12" fill="none" stroke="#D8F0C6" strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
          <path className="mango-body" d="M76 24 C54 18 34 34 27 58 C18 87 31 119 57 128 C84 138 113 117 120 88 C128 57 112 29 88 24 C84 23 80 23 76 24Z" fill="url(#mangoFruit)" stroke="#D97927" strokeWidth="2.5" />
          <path d="M45 53 C40 65 40 81 46 91" fill="none" stroke="#FFF1C8" strokeWidth="5" strokeLinecap="round" opacity=".58" />
          <g className="mango-face">
            {safeMood === 'happy' || safeMood === 'celebrate'
              ? <><path d="M53 72 Q59 64 65 72" fill="none" stroke="#402C24" strokeWidth="4" strokeLinecap="round" /><path d="M85 72 Q91 64 97 72" fill="none" stroke="#402C24" strokeWidth="4" strokeLinecap="round" /></>
              : safeMood === 'sad'
                ? <><path d="M53 71 Q59 77 65 72" fill="none" stroke="#402C24" strokeWidth="3.5" strokeLinecap="round" /><path d="M85 72 Q91 77 97 71" fill="none" stroke="#402C24" strokeWidth="3.5" strokeLinecap="round" /></>
                : <><ellipse cx="59" cy="72" rx="3.8" ry="5.6" fill="#402C24" /><ellipse cx="91" cy="72" rx="3.8" ry="5.6" fill="#402C24" /><circle cx="60" cy="70" r="1.2" fill="#FFF" /><circle cx="92" cy="70" r="1.2" fill="#FFF" /></>}
            <ellipse className="mango-cheek mango-cheek-left" cx="47" cy="85" rx="7" ry="4" fill="#E97768" opacity=".4" />
            <ellipse className="mango-cheek mango-cheek-right" cx="103" cy="85" rx="7" ry="4" fill="#E97768" opacity=".4" />
            {safeMood === 'sad'
              ? <path d="M64 98 Q75 87 86 98" fill="none" stroke="#6A342A" strokeWidth="3.6" strokeLinecap="round" />
              : safeMood === 'celebrate'
                ? <path d="M62 89 Q75 111 88 89" fill="none" stroke="#6A342A" strokeWidth="4.2" strokeLinecap="round" />
                : safeMood === 'happy'
                  ? <path d="M62 89 Q75 105 88 89" fill="none" stroke="#6A342A" strokeWidth="4.2" strokeLinecap="round" />
                  : <path d="M65 92 Q75 99 85 92" fill="none" stroke="#6A342A" strokeWidth="3.5" strokeLinecap="round" />}
          </g>
          {safeMood === 'celebrate' && <g className="mango-sparkles" fill="#F5A623"><path d="M28 36 L31 44 L39 47 L31 50 L28 58 L25 50 L17 47 L25 44Z"/><path d="M120 42 L122 48 L128 50 L122 52 L120 58 L118 52 L112 50 L118 48Z"/></g>}
          {safeMood === 'sad' && <path d="M104 94 C108 100 108 105 104 108 C100 105 100 100 104 94Z" fill="#75B8D4" opacity=".9" />}
          {safeMood === 'thinking' && <circle cx="111" cy="45" r="5" fill="#FFF4D6" stroke="#D97927" strokeWidth="2" />}
        </svg>
      </div>
      {message && <div className="mango-speech-bubble"><span className="mango-speech-tail" />{message}</div>}
    </div>
  )
}
