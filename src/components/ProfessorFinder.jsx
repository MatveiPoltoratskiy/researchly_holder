import { useRef, useState } from 'react'
import { useRouter } from '../lib/router'

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
          <span className="pf-resume-done-sub">Read in your browser — never uploaded.</span>
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
          <p className="pf-dropzone-hint">PDF only, up to 8MB. Read locally in your browser — never uploaded.</p>
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
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

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
  }

  async function handleResumeFile(file) {
    setError('')
    const looksLikePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!looksLikePdf) {
      setResumeStatus('error')
      setResumeError('Only PDF files work right now — try exporting your resume as a PDF.')
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeStatus('error')
      setResumeError('That file is too large — try a PDF under 8MB.')
      return
    }
    setResumeFile(file)
    setResumeStatus('parsing')
    setResumeError('')
    try {
      const text = await extractPdfText(file)
      if (!text) {
        setResumeStatus('error')
        setResumeError("Couldn't find any text in that PDF — it might be a scanned image. Try typing your background instead.")
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
    const missingCore = REQUIRED_FIELDS.some((k) => !profile[k].trim())
    const missingBackground = mode === 'upload' ? resumeStatus !== 'ready' : !profile.experience.trim()
    if (missingCore || missingBackground) {
      setError(
        mode === 'upload'
          ? 'Fill in the starred fields and upload a resume — a professor needs this much to take an email seriously.'
          : 'Fill in the starred fields — a professor needs at least this much to take an email seriously.'
      )
      return
    }
    setSubmitted(true)
  }

  function startOver() {
    setProfile(EMPTY_PROFILE)
    resetResume()
    setMode('type')
    setSubmitted(false)
  }

  return (
    <section className="interview-page pf-page">
      <button type="button" className="interview-back-float" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-home" /></svg>
        Home
      </button>

      <div className="container interview-container">
        <div className="interview-card pf-card" key={submitted ? 'done' : 'form'}>
          {submitted ? (
            <div className="pf-done">
              <div className="pf-done-badge">
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
              </div>
              <h1 className="interview-question">Your background is ready</h1>
              <p className="interview-subtext">
                Next, we're building the professor directory: search by school and field, then generate a cold email
                drafted from what you just told us. Nothing you typed or uploaded has left this browser tab.
              </p>
              <div className="pf-summary">
                <div className="pf-summary-row">
                  <span className="pf-summary-label">Name</span>
                  <span className="pf-summary-value">{profile.name}</span>
                </div>
                <div className="pf-summary-row">
                  <span className="pf-summary-label">School &amp; grade</span>
                  <span className="pf-summary-value">{profile.schoolGrade}</span>
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
                <button type="button" className="interview-continue-btn" onClick={() => navigate('/')}>
                  Back home
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
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
                  Never saved, never sent — this stays on your device
                </span>
                <h1 className="interview-question">Tell us about you</h1>
                <p className="interview-subtext">
                  Upload a resume, or just tell us about yourself. Either one powers your personalized emails —
                  nothing here is uploaded to a server or stored anywhere.
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
                      label="Full name"
                      required
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
                    label="School & grade"
                    required
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
