import { useState } from 'react'
import { useRouter } from '../lib/router'

// Deliberately plain useState, not localStorage/sessionStorage/a lib/*.js persistence
// helper, and no network call anywhere in this file. A student's name, school, and
// research background is sensitive enough that the only safe promise is "it never left
// this tab" — that's only true if nothing here ever writes it anywhere but this
// component's own memory. Closing the tab or navigating away wipes it for good; that's
// the point, not a bug to fix later.
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

const REQUIRED_FIELDS = ['name', 'schoolGrade', 'interests', 'experience']

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

export default function ProfessorFinder() {
  const { navigate } = useRouter()
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function update(key) {
    return (e) => {
      setProfile((p) => ({ ...p, [key]: e.target.value }))
      if (error) setError('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const missing = REQUIRED_FIELDS.some((k) => !profile[k].trim())
    if (missing) {
      setError('Fill in the starred fields — a professor needs at least this much to take an email seriously.')
      return
    }
    setSubmitted(true)
  }

  function startOver() {
    setProfile(EMPTY_PROFILE)
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
                drafted from what you just told us. Nothing you typed has left this browser tab.
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
                  This is the background a professor needs to see why you're worth a reply. We'll use it to draft a
                  cold email once you pick someone from the directory — nothing here is uploaded or stored anywhere.
                </p>
              </div>

              <div className="interview-card-scroll">
                <form className="pf-form" onSubmit={handleSubmit} noValidate>
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
