import { z } from 'zod'
import { dataFields, designFields, itemFields, listKeys, newItem, summaryFields, uid } from './model'
import type { ListKey, Project } from './model'
import { aiTargets, guideSteps } from './guided-schema'
import type { AiTarget, GuidedState } from './guided-schema'

export const guidedFields = [
  { key: 'firstAction', label: 'Tindakan pertama pengguna' }, { key: 'technology', label: 'Preferensi teknologi' },
  { key: 'budget', label: 'Batas biaya' }, { key: 'time', label: 'Target waktu' },
]
export const targetFields = { summary: summaryFields, design: designFields, dataSettings: dataFields, guided: guidedFields }
export function emptyGuide(): GuidedState { return { step: 0, modes: Array.from({ length: 6 }, () => 'manual'), answers: {}, questions: [] } }
export function ensureGuide(p: Project) { return p.guided ??= emptyGuide() }
export function targetValue(p: Project, target: AiTarget, field: string) {
  return target === 'guided' ? p.guided?.answers[field] || '' : p[target][field] || ''
}
export function isAllowedField(target: AiTarget, field: string) { return targetFields[target].some(f => f.key === field) }
export function setTarget(p: Project, target: AiTarget, field: string, value: string) {
  if (!isAllowedField(target, field)) throw new Error('Field usulan tidak didukung.')
  const limit = field === 'name' ? 200 : 200000
  if (value.length > limit) throw new Error('Isian terlalu panjang.')
  if (target === 'guided') ensureGuide(p).answers[field] = value
  else p[target][field] = value
  if (target === 'summary' && field === 'name') p.name = value.trim() || 'Proyek tanpa judul'
  if (target === 'summary' && field === 'description') p.description = value
}
export function saveAnchor(p: Project) {
  ensureGuide(p).anchor = {
    description: p.summary.description || '', goal: p.summary.goal || '', audience: p.summary.audience || '',
    outOfScope: p.summary.outOfScope || '', constraints: p.summary.constraints || '',
    features: p.lists.features.filter(f => f.data.phase === 'MVP').map(f => f.data.name || ''), savedAt: new Date().toISOString(),
  }
}
export function projectFingerprint(p: Project) {
  return JSON.stringify({ id: p.id, name: p.name, summary: p.summary, design: p.design, dataSettings: p.dataSettings, lists: p.lists,
    sectionStatus: p.sectionStatus, answers: p.guided?.answers, anchor: p.guided?.anchor, questions: p.guided?.questions })
}
const shortText = z.string().max(4000)
export const proposalSchema = z.object({
  summary: shortText,
  changes: z.array(z.object({ target: z.enum(aiTargets), field: z.string().max(100), value: shortText, reason: z.string().max(1000) }).strict()).max(12),
  additions: z.array(z.object({ kind: z.enum(listKeys), fields: z.array(z.object({ field: z.string().max(100), value: shortText }).strict()).max(20), reason: z.string().max(1000) }).strict()).max(6),
  questions: z.array(z.object({ question: z.string().min(1).max(2000), reason: z.string().max(1000), options: z.array(z.string().max(300)).max(6), target: z.enum(aiTargets), field: z.string().max(100) }).strict()).max(3),
  conflicts: z.array(z.string().max(2000)).max(8),
}).strict()
export type AiProposal = z.infer<typeof proposalSchema>
export function validateProposal(raw: unknown): AiProposal {
  const proposal = proposalSchema.parse(raw)
  const seen = new Set<string>()
  for (const change of proposal.changes) {
    const key = `${change.target}.${change.field}`
    if (!isAllowedField(change.target, change.field) || seen.has(key) || change.field === 'name' && change.value.length > 200) throw new Error('Field usulan tidak valid atau berulang.')
    seen.add(key)
  }
  for (const question of proposal.questions) if (!isAllowedField(question.target, question.field)) throw new Error('Tujuan pertanyaan AI tidak valid.')
  for (const item of proposal.additions) {
    if (!item.fields.some(f => f.field === 'name' && f.value.trim())) throw new Error('Item AI harus mempunyai nama.')
    const fields = new Set<string>()
    for (const value of item.fields) {
      const definition = itemFields[item.kind].find(f => f.key === value.field)
      if (!definition || definition.ref || fields.has(value.field) || definition.options && value.value && !definition.options.includes(value.value) || value.field === 'name' && value.value.length > 200) throw new Error('Isian item AI tidak valid.')
      fields.add(value.field)
    }
  }
  return proposal
}
const protectedFields = ['description', 'goal', 'audience', 'outOfScope', 'constraints']
export function requiresAnchorReview(p: Project, proposal: AiProposal, selectedChanges: number[], selectedAdditions: number[]) {
  return proposal.conflicts.length > 0 || !!p.guided?.anchor && (
    selectedChanges.some(i => proposal.changes[i]?.target === 'summary' && protectedFields.includes(proposal.changes[i].field)) ||
    selectedAdditions.some(i => proposal.additions[i]?.kind === 'features'))
}
export function applyProposal(p: Project, proposal: AiProposal, selectedChanges: number[], selectedAdditions: number[], step: number, reviewedAnchor: boolean) {
  validateProposal(proposal)
  if (requiresAnchorReview(p, proposal, selectedChanges, selectedAdditions) && !reviewedAnchor) throw new Error('Tinjau perubahan acuan atau konflik terlebih dahulu.')
  for (const index of new Set(selectedChanges)) {
    const change = proposal.changes[index]; if (!change) continue
    setTarget(p, change.target, change.field, change.value)
    const section = change.target === 'dataSettings' ? 'data' : change.target === 'guided' ? null : change.target
    if (section) p.sectionStatus[section] = 'Draf'
  }
  for (const index of new Set(selectedAdditions)) {
    const addition = proposal.additions[index]; if (!addition) continue
    const item = newItem(addition.kind)
    // AI can propose values, never verification, approval, IDs or internal links.
    item.data = Object.fromEntries(addition.fields.map(f => [f.field, f.value])); item.checked = false
    p.lists[addition.kind].push(item)
    const section = addition.kind === 'entities' ? 'data' : addition.kind === 'questions' ? 'decisions' : addition.kind
    p.sectionStatus[section] = 'Draf'
  }
  const guide = ensureGuide(p)
  for (const question of proposal.questions) {
    if (guide.questions.length >= 300) break
    if (guide.questions.some(q => q.question.trim().toLowerCase() === question.question.trim().toLowerCase())) continue
    guide.questions.push({ ...question, id: uid(), step, answer: '', resolved: false })
  }
}
export function guideLabels(target: AiTarget, key: string) { return targetFields[target].find(f => f.key === key)?.label || key }
export function simpleFeature(p: Project, name: string) { const item = newItem('features'); item.data.name = name.slice(0, 200); p.lists.features.push(item) }
export function listLabel(key: ListKey) { return ({ features: 'Fitur', flows: 'Alur pengguna', screens: 'Layar', motion: 'Aturan animasi', entities: 'Entitas', plan: 'Tahap implementasi', acceptance: 'Kriteria penerimaan', decisions: 'Keputusan', questions: 'Pertanyaan terbuka' })[key] }

export function aiContext(p: Project, step: number) {
  let truncated = false
  const clip = (value: string, max = 1600) => { if (value.length > max) { truncated = true; return value.slice(0, max) + ' [dipotong untuk batas konteks]' } return value }
  const data = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, clip(v)]))
  const relevant: ListKey[][] = [['features'], ['features', 'flows'], ['features', 'acceptance'], ['features', 'screens', 'motion'], ['features', 'entities', 'plan'], [...listKeys]]
  const lists = Object.fromEntries(relevant[step].map(k => {
    if (p.lists[k].length > 12) truncated = true
    return [k, p.lists[k].slice(0, 12).map(i => ({ id: i.id, data: data(i.data), links: i.links }))]
  }))
  const context = { name: p.name, stage: guideSteps[step], summary: data(p.summary), design: data(p.design), dataSettings: data(p.dataSettings),
    guidedAnswers: data(p.guided?.answers || {}), anchor: p.guided?.anchor ? { ...p.guided.anchor, features: p.guided.anchor.features.slice(0, 20) } : null,
    questions: (p.guided?.questions || []).slice(-12).map(q => ({ question: q.question, answer: q.answer, resolved: q.resolved })), lists, truncated }
  // Keep accidental pasted credentials out of model context, independent of the session key store.
  const text = JSON.stringify(context).replace(/sk-or-[a-z0-9_-]+/gi, '[KREDENSIAL DISAMARKAN]')
  if (text.length > 60000) throw new Error('Konteks proyek terlalu besar. Ringkas acuan atau isian terlebih dahulu sebelum memakai AI.')
  return text
}
