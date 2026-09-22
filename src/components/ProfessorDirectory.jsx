import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '../lib/router'
import { FIELD_BY_ID } from '../data/fields'
import { SCHOOLS, SCHOOL_BY_ID } from '../data/schools'
import { OrgLogo } from './OrgLogo'
import { peekProfessorFieldHandoff, clearProfessorFieldHandoff } from '../lib/professorFinderHandoff'
import PROFESSORS from '../data/professors.json'

// A handful of the taxonomy's fields get their own color + icon so the most common
// disciplines in this dataset read at a glance; anything else falls back to a plain
// grad-cap glyph and a neutral pill rather than growing a bespoke class per field.
const FIELD_STYLE = {
  biology: { icon: 'icon-dna', cls: 'pdir-tag--bio' },
  'pre-med': { icon: 'icon-stethoscope', cls: 'pdir-tag--premed' },
  neuroscience: { icon: 'icon-brain', cls: 'pdir-tag--neuro' },
  chemistry: { icon: 'icon-flask', cls: 'pdir-tag--chem' },
  'computer-science': { icon: 'icon-code', cls: 'pdir-tag--cs' },
  physics: { icon: 'icon-grad-cap', cls: 'pdir-tag--physics' },
  engineering: { icon: 'icon-grad-cap', cls: 'pdir-tag--engineering' },
  mathematics: { icon: 'icon-grad-cap', cls: 'pdir-tag--math' },
  psychology: { icon: 'icon-grad-cap', cls: 'pdir-tag--psych' },
  'environmental-science': { icon: 'icon-grad-cap', cls: 'pdir-tag--envsci' },
  economics: { icon: 'icon-grad-cap', cls: 'pdir-tag--economics' },
  'political-science': { icon: 'icon-grad-cap', cls: 'pdir-tag--polisci' },
}
const DEFAULT_FIELD_STYLE = { icon: 'icon-grad-cap', cls: 'pdir-tag--muted' }

function fieldMeta(fieldId) {
  return { label: FIELD_BY_ID[fieldId]?.label || fieldId, ...(FIELD_STYLE[fieldId] || DEFAULT_FIELD_STYLE) }
}

function ProfessorCard({ prof }) {
  const school = SCHOOL_BY_ID[prof.schoolId]
  const field = fieldMeta(prof.field)

  return (
    <article className="pdir-card">
      <div className="pdir-card-head">
        <div className="pdir-card-logo">
          <OrgLogo org={school?.name} url={`https://${school?.domain}`} iconId="icon-grad-cap" />
        </div>
        <div className="pdir-card-heading">
          <h3 className="pdir-name">{prof.name}</h3>
          <div className="pdir-school">{school?.name}</div>
        </div>
        <span className={`pdir-tag ${field.cls}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <use href={`#${field.icon}`} />
          </svg>
          {field.label}
        </span>
      </div>

      <div className="pdir-department">{prof.department}</div>
      <p className="pdir-research">{prof.researchArea}</p>

      <a className="pdir-work-link" href={prof.workUrl} target="_blank" rel="noopener noreferrer">
        {prof.workTitle || 'View recent work'}
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#icon-arrow" />
        </svg>
      </a>
    </article>
  )
}

export default function ProfessorDirectory() {
  const { navigate } = useRouter()
  const [query, setQuery] = useState('')
  const [schoolId, setSchoolId] = useState('all')
  // pre-filtered when arriving via the Professor Finder's field-picker popup (see
  // lib/professorFinderHandoff.js); a direct visit (navbar, back button, bookmark)
  // finds nothing to peek and just falls back to 'all', same as before this existed.
  const [fieldId, setFieldId] = useState(() => peekProfessorFieldHandoff() || 'all')

  useEffect(() => {
    clearProfessorFieldHandoff()
  }, [])

  const fieldsInData = useMemo(
    () => Array.from(new Set(PROFESSORS.map((p) => p.field))).sort((a, b) => (FIELD_BY_ID[a]?.label || a).localeCompare(FIELD_BY_ID[b]?.label || b)),
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PROFESSORS.filter((p) => {
      if (schoolId !== 'all' && p.schoolId !== schoolId) return false
      if (fieldId !== 'all' && p.field !== fieldId) return false
      if (!q) return true
      const haystack = `${p.name} ${p.department} ${p.researchArea} ${SCHOOL_BY_ID[p.schoolId]?.name || ''}`.toLowerCase()
      return haystack.includes(q)
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [query, schoolId, fieldId])

  return (
    <section className="pdir-page">
      <button type="button" className="interview-back-float" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-home" /></svg>
        Home
      </button>

      <div className="container pdir-container">
        <div className="pdir-head">
          <span className="pf-privacy-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-grad-cap" /></svg>
            Ivy League, verified faculty — more schools coming
          </span>
          <h1 className="interview-question">Find a professor</h1>
          <p className="interview-subtext">
            Real faculty doing research near your interests, with a link to their most recent work. Starting with the
            Ivy League.
          </p>
        </div>

        <div className="pdir-controls">
          <div className="pdir-search">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-search" /></svg>
            <input
              type="text"
              className="pdir-search-input"
              placeholder="Search by name, department, or topic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="pdir-select" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} aria-label="Filter by school">
            <option value="all">All schools</option>
            {SCHOOLS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="pdir-select" value={fieldId} onChange={(e) => setFieldId(e.target.value)} aria-label="Filter by field">
            <option value="all">All fields</option>
            {fieldsInData.map((f) => (
              <option key={f} value={f}>{FIELD_BY_ID[f]?.label || f}</option>
            ))}
          </select>
        </div>

        <div className="pdir-count">
          {filtered.length} professor{filtered.length === 1 ? '' : 's'}
        </div>

        {filtered.length > 0 ? (
          <div className="pdir-grid">
            {filtered.map((p) => (
              <ProfessorCard key={p.id} prof={p} />
            ))}
          </div>
        ) : (
          <div className="pdir-empty">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-search" /></svg>
            <p>No professors match those filters yet — try widening your search.</p>
          </div>
        )}
      </div>
    </section>
  )
}
