#!/usr/bin/env node
// Maintainer-run research helper: finds opportunities Researchly still shows as "Not
// confirmed" (or closed with no reopening info) and runs Google searches against them,
// looking for anything about when applications reopen that direct-site scraping missed.
//
// Deliberately does NOT write dates back into canadaOpportunities.js on its own. Deciding
// whether a snippet is about the right program, the right cycle, and whether the source's
// own wording is definitive ("confirmed") or hedged/contingent/unverified ("anticipated")
// is a judgment call — the same one a human (or an LLM research pass, which is how this
// project's existing deadline/next-opening data was actually populated) makes by reading
// the real page, not something a regex should decide. Handing that decision to a script
// is exactly the kind of hardcoded pattern-matching that produces confidently-wrong dates.
// This script's job stops at "here are promising candidates worth a human/LLM look" —
// see src/lib/opportunitySchema.js for the fields a verified finding should fill in, and
// the write-up in this repo's research history for the exact verification bar to apply
// (open the actual source page when possible; never mark "confirmed" from a snippet alone).
//
// Usage:
//   SERPER_API_KEY=... node scripts/enrich-next-opening.mjs [--limit=20] [--id=some-opp-id]
//
// Output: prints a summary to stdout and writes the full candidate set (all snippets, not
// just the ones that look promising) to scripts/.output/next-opening-candidates-<ts>.json
// for review.

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { searchGoogle } from './lib/searchProvider.mjs'
import { CANADA_OPPORTUNITIES } from '../src/data/canadaOpportunities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const args = { limit: 20, id: null }
  for (const arg of argv) {
    if (arg.startsWith('--limit=')) args.limit = Number(arg.slice('--limit='.length))
    if (arg.startsWith('--id=')) args.id = arg.slice('--id='.length)
  }
  return args
}

// same "is this one still missing next-opening info" test the frontend effectively makes
// via deadlineCellLabel — kept in sync with src/lib/deadlineStatus.js's precedence
function needsResearch(o) {
  if (o.deadline) return false // has a real, dated deadline already
  if (o.deadlineStatus === 'rolling') return false // rolling admissions is already a confirmed fact
  if (o.applicationStatus === 'closed' && o.nextOpeningPrecision) return false // already has reopening info
  return true
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function buildQueries(o) {
  const name = o.name
  const now = new Date()
  const thisYear = now.getFullYear()
  const nextYear = thisYear + 1
  const domain = domainFromUrl(o.url)

  const queries = [
    `"${name}" next application opening date`,
    `"${name}" applications reopen`,
    `"${name}" applications resume ${thisYear}`,
    `"${name}" applications resume ${nextYear}`,
    `"${name}" next application cycle`,
    `"${name}" when do applications open again`,
    `"${name}" applications open ${nextYear}`,
  ]
  if (domain) queries.push(`site:${domain} "${name}" reopen OR resume OR "next cycle"`)
  return queries
}

// purely to help a human scanning the output find the promising rows faster — never used
// to decide anything on its own, and never written back to the data file
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
function looksPromising(snippet, year) {
  const s = (snippet || '').toLowerCase()
  const hasYear = s.includes(String(year)) || s.includes(String(year + 1))
  const hasMonth = MONTH_NAMES.some((m) => s.includes(m))
  const hasReopenWord = /(reopen|resume|next cycle|opens? again|opens? in|open on)/.test(s)
  return hasReopenWord && (hasYear || hasMonth)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const thisYear = new Date().getFullYear()

  let targets = CANADA_OPPORTUNITIES.filter(needsResearch)
  if (args.id) targets = targets.filter((o) => o.id === args.id)
  targets = targets.slice(0, args.limit)

  if (targets.length === 0) {
    console.log('Nothing to research — no matching opportunities (check --id, or everything is already confirmed/closed-with-reopening-info).')
    return
  }

  console.log(`Researching ${targets.length} opportunit${targets.length === 1 ? 'y' : 'ies'}...\n`)

  const report = []
  for (const o of targets) {
    const queries = buildQueries(o)
    const perQuery = []
    for (const query of queries) {
      try {
        const { organic } = await searchGoogle(query)
        perQuery.push({ query, organic })
      } catch (err) {
        perQuery.push({ query, error: err.message })
      }
    }

    const promising = perQuery.flatMap((q) =>
      (q.organic || [])
        .filter((r) => looksPromising(r.snippet, thisYear))
        .map((r) => ({ query: q.query, ...r }))
    )

    report.push({ id: o.id, name: o.name, org: o.org, url: o.url, queries: perQuery })

    console.log(`${o.id} — ${o.name}`)
    if (promising.length === 0) {
      console.log('  no promising snippets found')
    } else {
      for (const p of promising) {
        console.log(`  [${p.query}]`)
        console.log(`    ${p.link}`)
        console.log(`    "${p.snippet}"`)
      }
    }
    console.log('')
  }

  const outDir = path.join(__dirname, '.output')
  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, `next-opening-candidates-${Date.now()}.json`)
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`Full results (including non-promising snippets) written to ${outPath}`)
  console.log('Review these by hand (or hand this file to an LLM research pass) before writing anything into canadaOpportunities.js — see the header of this script for why.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
