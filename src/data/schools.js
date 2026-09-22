/**
 * Schools covered by the Professor Directory. Starting with the Ivy League; more
 * schools (Canadian/US public/private) get added here as the dataset grows — nothing
 * about ProfessorDirectory.jsx or professors.json is Ivy-specific.
 */
export const SCHOOLS = [
  { id: 'harvard', name: 'Harvard University', domain: 'harvard.edu' },
  { id: 'yale', name: 'Yale University', domain: 'yale.edu' },
  { id: 'princeton', name: 'Princeton University', domain: 'princeton.edu' },
  { id: 'columbia', name: 'Columbia University', domain: 'columbia.edu' },
  { id: 'penn', name: 'University of Pennsylvania', domain: 'upenn.edu' },
  { id: 'brown', name: 'Brown University', domain: 'brown.edu' },
  { id: 'cornell', name: 'Cornell University', domain: 'cornell.edu' },
  { id: 'dartmouth', name: 'Dartmouth College', domain: 'dartmouth.edu' },
]

export const SCHOOL_BY_ID = Object.fromEntries(SCHOOLS.map((s) => [s.id, s]))
