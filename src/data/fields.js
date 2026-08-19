/**
 * Field taxonomy — the single source of truth for:
 *   1. the interview's focal-type entry point (which field a student starts from)
 *   2. the dynamic follow-up question ("what part of that field pulls you in?")
 *   3. the `focus[]` tags on every opportunity record, which drive matching
 *
 * `tier` controls rollout, NOT display order. Only tier 1 is live in the UI
 * (see ACTIVE_FIELDS below) because a field with a thin dataset is worse than a
 * field that isn't offered yet — a student who picks "Law" and gets two results
 * concludes the product is broken.
 *
 * Tiering rationale (research opportunities specifically, not general extracurriculars):
 *   tier 1 — life-sciences cluster + CS. Highest student demand AND highest density of
 *            real HS/undergrad research programs. Critically, the four life-science
 *            fields share heavily overlapping program pools (one hospital or NIH program
 *            legitimately tags biology + pre-med + neuroscience + chemistry), so
 *            curation effort compounds instead of splitting.
 *   tier 2 — real research pipelines exist (REUs, university labs) but the program pool
 *            is smaller or less centralized.
 *   tier 3 — for HS/undergrad these are mostly internships, shadowing, or policy
 *            fellowships rather than *research*. Offering them early would over-promise.
 *            Revisit once the core is solid and we can honestly populate them.
 */

export const FIELDS = [
  // ---------- tier 1 ----------
  {
    id: 'biology',
    label: 'Biology',
    tier: 1,
    blurb: 'Wet-lab, field, and computational life science.',
    subfocus: [
      { id: 'molecular-cell', label: 'Molecular & cell', desc: 'How cells work, at the level of proteins and pathways' },
      { id: 'genetics', label: 'Genetics & genomics', desc: 'Sequencing, heredity, and gene function' },
      { id: 'ecology', label: 'Ecology & evolution', desc: 'Field work, organisms, and populations' },
      { id: 'micro-immuno', label: 'Microbiology & immunology', desc: 'Pathogens, the immune system, and infection' },
      { id: 'comp-bio', label: 'Computational biology', desc: 'Code and statistics applied to biological data' },
    ],
  },
  {
    id: 'pre-med',
    label: 'Pre-Med & Health',
    tier: 1,
    // Not a major — a track. Students self-identify with it strongly enough that it has
    // to be selectable, and it maps onto a largely shared program pool with biology.
    blurb: 'Clinical exposure, medical research, and public health.',
    subfocus: [
      { id: 'clinical', label: 'Clinical & patient-facing', desc: 'Hospital programs and shadowing with a research component' },
      { id: 'bench-medical', label: 'Medical research', desc: 'Bench work in a lab attached to a medical school or hospital' },
      { id: 'public-health', label: 'Public & global health', desc: 'Epidemiology, health equity, and population studies' },
      { id: 'health-policy', label: 'Health policy', desc: 'How care gets funded, regulated, and delivered' },
      { id: 'biomed-eng', label: 'Biomedical devices', desc: 'Instruments, imaging, and medical hardware' },
    ],
  },
  {
    id: 'neuroscience',
    label: 'Neuroscience',
    tier: 1,
    blurb: 'The brain, from single neurons to behavior.',
    subfocus: [
      { id: 'cognitive', label: 'Cognitive & behavioral', desc: 'Memory, perception, decision-making, and human studies' },
      { id: 'molecular-neuro', label: 'Molecular & cellular', desc: 'Neurons, synapses, and circuits at the bench' },
      { id: 'comp-neuro', label: 'Computational neuroscience', desc: 'Modeling, neural data, and brain-inspired computing' },
      { id: 'clinical-neuro', label: 'Clinical neuroscience', desc: 'Neurological and psychiatric conditions' },
    ],
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    tier: 1,
    blurb: 'Synthesis, materials, and the chemistry of living systems.',
    subfocus: [
      { id: 'organic', label: 'Organic & synthesis', desc: 'Building molecules and reaction design' },
      { id: 'biochem', label: 'Biochemistry', desc: 'Chemistry inside living systems' },
      { id: 'materials', label: 'Materials & polymers', desc: 'Designing substances with useful properties' },
      { id: 'analytical', label: 'Analytical & environmental', desc: 'Measurement, detection, and chemistry in the environment' },
      { id: 'comp-chem', label: 'Computational chemistry', desc: 'Simulating molecules instead of synthesizing them' },
    ],
  },
  {
    id: 'computer-science',
    label: 'Computer Science',
    tier: 1,
    blurb: 'Research computing, from ML labs to systems work.',
    subfocus: [
      { id: 'ai-ml', label: 'AI & machine learning', desc: 'Models, training, and applied ML research' },
      { id: 'software', label: 'Software & applications', desc: 'Building tools people actually use' },
      { id: 'systems-security', label: 'Systems & security', desc: 'Networks, operating systems, and cybersecurity' },
      { id: 'computational-science', label: 'Computational science', desc: 'Code applied to physics, biology, or climate' },
      { id: 'theory', label: 'Theory & algorithms', desc: 'Proofs, complexity, and problem solving' },
      { id: 'robotics', label: 'Robotics', desc: 'Hardware, control, and autonomous systems' },
    ],
  },

  // ---------- tier 2 ----------
  { id: 'physics', label: 'Physics', tier: 2, blurb: 'Experimental and theoretical physics, astronomy.' },
  { id: 'engineering', label: 'Engineering', tier: 2, blurb: 'Mechanical, electrical, civil, and materials.' },
  { id: 'mathematics', label: 'Mathematics', tier: 2, blurb: 'Pure and applied math, statistics.' },
  { id: 'psychology', label: 'Psychology', tier: 2, blurb: 'Human behavior and cognition.' },
  { id: 'environmental-science', label: 'Environmental Science', tier: 2, blurb: 'Climate, conservation, and sustainability.' },

  // ---------- tier 3 ----------
  { id: 'economics', label: 'Economics', tier: 3, blurb: 'Empirical economics and data work.' },
  { id: 'political-science', label: 'Political Science', tier: 3, blurb: 'Government, policy, and international relations.' },
  { id: 'humanitarian', label: 'Humanitarian & Social Impact', tier: 3, blurb: 'Nonprofit, development, and community research.' },
  { id: 'business', label: 'Business', tier: 3, blurb: 'Markets, entrepreneurship, and management.' },
  { id: 'law', label: 'Law', tier: 3, blurb: 'Legal research and policy.' },
]

/** Fields currently offered in the interview. Widen only when the dataset can support it. */
export const ACTIVE_FIELDS = FIELDS.filter((f) => f.tier === 1)

export const FIELD_BY_ID = Object.fromEntries(FIELDS.map((f) => [f.id, f]))

/** Every valid focus tag, for validating opportunity records against typos. */
export const VALID_FOCUS_IDS = FIELDS.map((f) => f.id)
