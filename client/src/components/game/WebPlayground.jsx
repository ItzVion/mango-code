import { useMemo, useState } from 'react'
import { CheckCircle2, Code2, Eye, Play, RotateCcw, Sparkles, XCircle } from 'lucide-react'

export function WebPlayground({ task, onResult }) {
  const [html, setHtml] = useState(task.starterHtml || '')
  const [css, setCss] = useState(task.starterCss || '')
  const [checked, setChecked] = useState(false)
  const [passed, setPassed] = useState(false)

  const preview = useMemo(() => (
    '<!doctype html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<style>body{font-family:system-ui,sans-serif;margin:0;padding:20px;color:#18201c}' +
    css + '</style></head><body>' + html + '</body></html>'
  ), [html, css])

  const results = useMemo(() => task.checks.map(check => ({
    ...check,
    passed: new RegExp(check.pattern, 'i').test(html + '\n' + css),
  })), [task.checks, html, css])

  function checkMission() {
    setChecked(true)
    const success = results.every(item => item.passed)
    if (success) setPassed(true)
    onResult?.({ pass: success })
  }

  function reset() {
    setHtml(task.starterHtml || '')
    setCss(task.starterCss || '')
    setChecked(false)
    setPassed(false)
    onResult?.({ pass: false, reset: true })
  }

  return (
    <section className="mango-web-mission">
      <div className="mango-web-mission-head">
        <div className="mango-web-mission-title">
          <span className="mango-challenge-icon"><Code2 size={19} /></span>
          <div>
            <p className="mango-eyebrow">WEB BUILDER MISSION</p>
            <h3>{task.title}</h3>
          </div>
        </div>
        <p>{task.prompt}</p>
      </div>

      <div className="mango-web-editor-grid">
        <div className="mango-web-editors">
          <label className="mango-code-label" htmlFor="mango-html-editor">HTML <span>Structure</span></label>
          <textarea id="mango-html-editor" value={html} onChange={event => { setHtml(event.target.value); setChecked(false) }} spellCheck={false} aria-label="Edit HTML" />
          <label className="mango-code-label" htmlFor="mango-css-editor">CSS <span>Style</span></label>
          <textarea id="mango-css-editor" value={css} onChange={event => { setCss(event.target.value); setChecked(false) }} spellCheck={false} aria-label="Edit CSS" />
        </div>
        <div className="mango-web-preview">
          <div className="mango-web-preview-head"><span><Eye size={14} /> Live preview</span><span className="mango-preview-dots"><i /><i /><i /></span></div>
          <iframe title="Your HTML and CSS preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview} />
        </div>
      </div>

      <div className="mango-web-requirements">
        <div className="mango-web-requirements-title"><Sparkles size={15} /> Mission checklist</div>
        {results.map((item, index) => (
          <div key={item.label} className="mango-web-requirement">
            {item.passed ? <CheckCircle2 size={16} className="text-leaf" /> : checked ? <XCircle size={16} className="text-rose" /> : <span className="mango-requirement-number">{index + 1}</span>}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {checked && (
        <div className={'mango-web-feedback' + (passed ? ' is-passed' : ' is-incomplete')} role="status" aria-live="polite">
          <strong>{passed ? 'Mission complete! Mango is celebrating.' : 'A few pieces are still missing.'}</strong>
          <p>{passed ? 'You built the page structure. Keep experimenting with the preview.' : task.hint}</p>
        </div>
      )}

      <div className="mango-web-actions">
        <button type="button" className="mango-game-primary" onClick={checkMission}><Play size={15} /> Check mission</button>
        <button type="button" className="mango-game-secondary" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>
    </section>
  )
}
