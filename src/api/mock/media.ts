import { MEDIA_PRESETS } from './settings'

/*
 * Mock of the media variant-regeneration job (D:media §4/§11, C10 queue).
 * The real backend enqueues a RegenerateVariants job with progress; here we
 * fake a time-based progress so the settings screen can show a real progress
 * bar and completion. One in-flight job at a time (idempotent, C10).
 */

interface RegenJob {
  id: number
  total: number
  startedAt: number
}

/** Regenerating all variants takes ~5s of fake work in the demo. */
const REGEN_DURATION_MS = 5000

let job: RegenJob | null = null

export interface RegenStatus {
  processed: number
  total: number
  percent: number
  state: 'running' | 'done'
}

export function startRegenerate(group?: string): { job_id: number; total: number } {
  // Rebuild variants for one owner group, or all presets when no group is given.
  const presets = group ? MEDIA_PRESETS.filter((preset) => preset.owner === group) : MEDIA_PRESETS
  const total = presets.length * 24
  job = { id: Date.now(), total, startedAt: Date.now() }
  return { job_id: job.id, total }
}

export function regenerateStatus(jobId: number): RegenStatus {
  if (!job || job.id !== jobId) {
    // Unknown/expired job → report finished so the client stops polling gracefully.
    return { processed: 0, total: 0, percent: 100, state: 'done' }
  }
  const elapsed = Date.now() - job.startedAt
  const processed = Math.min(job.total, Math.round((elapsed / REGEN_DURATION_MS) * job.total))
  const state: RegenStatus['state'] = processed >= job.total ? 'done' : 'running'
  return {
    processed,
    total: job.total,
    percent: job.total > 0 ? Math.round((processed / job.total) * 100) : 100,
    state,
  }
}
