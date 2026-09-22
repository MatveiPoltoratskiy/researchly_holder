import { useEffect, useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import ProfessorFinderLoading from './ProfessorFinderLoading'
import ProfessorFieldModal from './ProfessorFieldModal'
import InterviewLoading from './InterviewLoading'
import { setProfessorFieldHandoff } from '../lib/professorFinderHandoff'

// Deliberately plain useState, not localStorage/sessionStorage/a lib/*.js persistence
// helper, and no network call anywhere in this file. A student's name, school, and
// research background is sensitive enough that the only safe promise is "it never left
// this tab" — that's only true if nothing here ever writes it anywhere but this
// component's own memory. Closing the tab or navigating away wipes it for good; that's
// the point, not a bug to fix later. The resume path keeps that promise the same way:
// pdfjs-dist is loaded dynamically (kept out of this already-lazy chunk until a file is
// actually dropped) and reads the PDF's bytes straight out of the File object in memory
// — nothing is ever uploaded anywhere to be parsed.
const EMPTY_PROFILE = {
  name: '',
  email: '',
  schoolGrade: '',
  interests: '',
  skills: '',
  experience: '',
  awards: '',
  extra: '',
}

const REQUIRED_FIELDS = ['name', 'schoolGrade', 'interests']
const MAX_RESUME_BYTES = 8 * 1024 * 1024

// Cached across drops within the same page view so re-uploading a second resume (or
// retrying after an error) doesn't re-fetch/re-init pdfjs — but never persisted beyond
// this tab's lifetime, same as everything else in this file.
let pdfjsLoad = null
function loadPdfjs() {
  if (!pdfjsLoad) {
    pdfjsLoad = Promise.all([
      import('pdfjs-dist'),
      // ?url gives Vite's own bundled copy of the worker file, served from this site's
      // own origin — never a CDN — so extraction stays fully offline/local
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerUrl]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default
      return pdfjsLib
    })
  }
  return pdfjsLoad
}

async function extractPdfText(file) {
  const pdfjsLib = await loadPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => item.str || '').join(' '))
  }
  return pages.join('\n\n').trim()
}

function Field({ id, label, required, textarea, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className="contact-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="pf-required" aria-hidden="true"> *</span>}
      </label>
      <Tag id={id} className={`contact-input ${textarea ? 'contact-textarea' : ''}`} {...rest} />
    </div>
  )
}

function ResumeDropzone({ resumeStatus, resumeFile, resumeError, onFile, onRemove }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }
  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }
  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }
  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  if (resumeStatus === 'ready' && resumeFile) {
    return (
      <div className="pf-resume-done">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
        <div className="pf-resume-done-info">
          <span className="pf-resume-done-name">{resumeFile.name}</span>
          <span className="pf-resume-done-sub">Read in your browser. Never uploaded.</span>
        </div>
        <button type="button" className="pf-resume-remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    )
  }

  return (
    <div
      className={`pf-dropzone ${isDragging ? 'is-dragging' : ''} ${resumeStatus === 'error' ? 'is-error' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="pf-dropzone-input"
        onChange={handleInputChange}
        tabIndex={-1}
      />
      {resumeStatus === 'parsing' ? (
        <>
          <span className="pf-dropzone-spinner" aria-hidden="true" />
          <p className="pf-dropzone-text">Reading your resume…</p>
        </>
      ) : (
        <>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-book" /></svg>
          <p className="pf-dropzone-text">
            <strong>Drag & drop your resume</strong>, or click to browse
          </p>
          <p className="pf-dropzone-hint">PDF only, up to 8MB. Read locally in your browser. Never uploaded.</p>
        </>
      )}
      {resumeStatus === 'error' && <p className="pf-dropzone-error">{resumeError}</p>}
    </div>
  )
}

export default function ProfessorFinder() {
  const { navigate } = useRouter()
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [mode, setMode] = useState('type') // type | upload
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeStatus, setResumeStatus] = useState('idle') // idle | parsing | ready | error
  const [resumeError, setResumeError] = useState('')
  const [phase, setPhase] = useState('form') // form | loading | done
  const [error, setError] = useState('')
  // A separate, lightweight state machine from `phase` above — this one fires the moment
  // a resume finishes parsing, independent of ever clicking "Save my background", so it
  // needs to coexist with `phase` still being 'form' rather than replace it.
  const [fieldFlow, setFieldFlow] = useState('idle') // idle | prompt | shuffling

  // A parsed resume already carries a name and school — asking for them again is friction
  // the upload was supposed to save. Typed mode gets no such shortcut, since there's
  // nothing to have read them off of.
  const hasResume = mode === 'upload' && resumeStatus === 'ready'

  // Fires the field-picker the instant a resume finishes parsing — not gated behind
  // clicking Save, since a resume alone is already enough background to jump straight to
  // the directory. Re-fires on every successful parse (remove + re-upload a different
  // file), since each one is a fresh "you just gave us a resume" moment.
  useEffect(() => {
    if (resumeStatus === 'ready') setFieldFlow('prompt')
  }, [resumeStatus])

  function update(key) {
    return (e) => {
      setProfile((p) => ({ ...p, [key]: e.target.value }))
      if (error) setError('')
    }
  }

  function resetResume() {
    setResumeFile(null)
    setResumeText('')
    setResumeStatus('idle')
    setResumeError('')
    setFieldFlow('idle')
  }

  async function handleResumeFile(file) {
    setError('')
    const looksLikePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!looksLikePdf) {
      setResumeStatus('error')
      setResumeError('Only PDF files work right now. Try exporting your resume as a PDF.')
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeStatus('error')
      setResumeError("That file's too large. Try a PDF under 8MB.")
      return
    }
    setResumeFile(file)
    setResumeStatus('parsing')
    setResumeError('')
    try {
      const text = await extractPdfText(file)
      if (!text) {
        setResumeStatus('error')
        setResumeError("Couldn't find text in that PDF. It might be scanned. Try typing your background instead.")
        return
      }
      setResumeText(text)
      setResumeStatus('ready')
    } catch {
      setResumeStatus('error')
      setResumeError("Couldn't read that file. Try a different PDF, or type your background instead.")
    }
  }

  function switchMode(next) {
    if (next === mode) return
    setMode(next)
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const coreFields = hasResume ? ['interests'] : REQUIRED_FIELDS
    const missingCore = coreFields.some((k) => !profile[k].trim())
    const missingBackground = mode === 'upload' ? resumeStatus !== 'ready' : !profile.experience.trim()
    if (missingCore || missingBackground) {
      setError(
        mode === 'upload'
          ? 'Fill in the starred fields and upload a resume. A professor needs this much to take you seriously.'
          : 'Fill in the starred fields. A professor needs this much to take you seriously.'
      )
      return
    }
    setPhase('loading')
  }

  function startOver() {
    setProfile(EMPTY_PROFILE)
    resetResume()
    setMode('type')
    setPhase('form')
  }

  // Stores the pick right away (not on the shuffle's onDone) so the handoff is
  // committed the instant the student chooses, before the shuffle animation even starts.
  function handleFieldPick(fieldId) {
    setProfessorFieldHandoff(fieldId)
    setFieldFlow('shuffling')
  }

  // The shuffle is a full-viewport takeover straight into the directory — the ask was
  // literally "shuffle cards to the professor database" — so, like Interview.jsx's own
  // loading/matches phases, it bypasses the .pf-page/.interview-card shell entirely
  // rather than rendering inside it. The prompt itself stays a true popup (rendered
  // below, over the still-visible form) instead of an early return, since dismissing it
  // should drop the student right back into the form they were filling out.
  if (fieldFlow === 'shuffling') {
    return (
      <InterviewLoading
        title="Shuffling your matches"
        subtext="Pulling professors from the Ivy League directory"
        onDone={() => navigate('/professor-directory')}
      />
    )
  }

  return (
    <section className="interview-page pf-page">
      {fieldFlow === 'prompt' && (
        <ProfessorFieldModal onPick={handleFieldPick} onClose={() => setFieldFlow('idle')} />
      )}

      <button type="button" className="interview-back-float" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-home" /></svg>
        Home
      </button>

      <div className="container interview-container">
        <div className="interview-card pf-card" key={phase}>
          {phase === 'loading' ? (
            <ProfessorFinderLoading
              interests={profile.interests}
              onDone={() => setPhase('done')}
              onCancel={() => setPhase('form')}
            />
          ) : phase === 'done' ? (
            <div className="pf-done">
              <div className="pf-done-badge">
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
              </div>
              <h1 className="interview-question">Your background is ready</h1>
              <p className="interview-subtext">
                Browse the professor directory next to find someone in your field. Cold-email drafting is coming soon.
                Nothing you typed or uploaded has left this browser tab.
              </p>
              <div className="pf-summary">
                <div className="pf-summary-row">
                  <span className="pf-summary-label">Name</span>
                  <span className="pf-summary-value">{profile.name || 'From your resume'}</span>
                </div>
                <div className="pf-summary-row">
                  <span className="pf-summary-label">School &amp; grade</span>
                  <span className="pf-summary-value">{profile.schoolGrade || 'From your resume'}</span>
                </div>
                <div className="pf-summary-row">
                  <span className="pf-summary-label">Interests</span>
                  <span className="pf-summary-value">{profile.interests}</span>
                </div>
                <div className="pf-summary-row">
                  <span className="pf-summary-label">Background</span>
                  <span className="pf-summary-value">
                    {mode === 'upload' ? resumeFile?.name || 'Uploaded resume' : 'Typed by hand'}
                  </span>
                </div>
              </div>
              <div className="pf-done-actions">
                <button type="button" className="interview-continue-btn" onClick={() => navigate('/professor-directory')}>
                  Browse professors
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                </button>
                <button type="button" className="pf-edit-btn" onClick={() => navigate('/')}>
                  Back home
                </button>
                <button type="button" className="pf-edit-btn" onClick={startOver}>
                  Edit answers
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="interview-card-head">
                <span className="pf-privacy-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-lock" /></svg>
                  Never saved, never sent. It stays on your device.
                </span>
                <h1 className="interview-question">Tell us about you</h1>
                <p className="interview-subtext">
                  Upload a resume, or tell us about yourself. Either one shapes your personalized emails. Nothing here
                  is uploaded or stored anywhere.
                </p>
              </div>

              <div className="interview-card-scroll">
                <form className="pf-form" onSubmit={handleSubmit} noValidate>
                  <div className="pf-mode-toggle" role="tablist" aria-label="How to share your background">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'upload'}
                      className={`pf-mode-btn ${mode === 'upload' ? 'is-active' : ''}`}
                      onClick={() => switchMode('upload')}
                    >
                      Upload a resume
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'type'}
                      className={`pf-mode-btn ${mode === 'type' ? 'is-active' : ''}`}
                      onClick={() => switchMode('type')}
                    >
                      No resume? Type it
                    </button>
                  </div>

                  <div className="contact-grid">
                    <Field
                      id="pf-name"
                      label={hasResume ? 'Full name (optional)' : 'Full name'}
                      required={!hasResume}
                      value={profile.name}
                      onChange={update('name')}
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                    />
                    <Field
                      id="pf-email"
                      label="Your email (optional)"
                      type="email"
                      inputMode="email"
                      value={profile.email}
                      onChange={update('email')}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </div>

                  <Field
                    id="pf-school"
                    label={hasResume ? 'School & grade (optional)' : 'School & grade'}
                    required={!hasResume}
                    value={profile.schoolGrade}
                    onChange={update('schoolGrade')}
                    placeholder="Lincoln High School, 11th grade"
                  />

                  <Field
                    id="pf-interests"
                    label="Research interests"
                    required
                    value={profile.interests}
                    onChange={update('interests')}
                    placeholder="Cancer immunotherapy, machine learning for genomics, coral reef ecology..."
                  />

                  {mode === 'upload' ? (
                    <div className="contact-field">
                      <label>
                        Resume<span className="pf-required" aria-hidden="true"> *</span>
                      </label>
                      <ResumeDropzone
                        resumeStatus={resumeStatus}
                        resumeFile={resumeFile}
                        resumeError={resumeError}
                        onFile={handleResumeFile}
                        onRemove={resetResume}
                      />
                    </div>
                  ) : (
                    <>
                      <Field
                        id="pf-skills"
                        label="Skills"
                        value={profile.skills}
                        onChange={update('skills')}
                        placeholder="Python, wet-lab technique, statistics, a language you're fluent in..."
                      />

                      <Field
                        id="pf-experience"
                        label="Research / project experience"
                        required
                        textarea
                        rows={3}
                        value={profile.experience}
                        onChange={update('experience')}
                        placeholder="A science fair project, an AP research paper, something you built on your own..."
                      />

                      <Field
                        id="pf-awards"
                        label="Awards & achievements"
                        textarea
                        rows={2}
                        value={profile.awards}
                        onChange={update('awards')}
                        placeholder="AP Scholar, 2nd place at a regional science fair..."
                      />
                    </>
                  )}

                  <Field
                    id="pf-extra"
                    label="Anything else"
                    textarea
                    rows={2}
                    value={profile.extra}
                    onChange={update('extra')}
                    placeholder="Why this kind of research, timing, anything that makes your case..."
                  />

                  <div className="pf-submit-row">
                    <button type="submit" className="interview-continue-btn">
                      Save my background
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                    </button>
                    {error && (
                      <p className="waitlist-status is-error" role="alert" aria-live="polite">
                        {error}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
