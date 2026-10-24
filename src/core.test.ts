import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { backup, duplicateProject, exampleProject, listKeys, newItem, newProject, parseImport, projectSchema } from './model'
import { documents, implementationPrompt, literal, safeName, zipProject } from './documents'
import { checks } from './checks'
import { BlueprintDB, SaveQueue } from './storage'

describe('schema and backup restoration', () => {
  it('accepts blank and example projects', () => { expect(projectSchema.safeParse(newProject()).success).toBe(true); expect(projectSchema.safeParse(exampleProject()).success).toBe(true) })
  it('round trips every field without loss', () => { const p = exampleProject(); expect(parseImport(backup([p]))).toEqual([p]) })
  it('round trips multiple projects', () => { const ps = [exampleProject(), newProject('A & B')]; expect(parseImport(backup(ps))).toEqual(ps) })
  it('rejects broken JSON with readable message', () => expect(() => parseImport('{')).toThrow('JSON yang valid'))
  it('rejects unsupported schemaVersion', () => { const raw = JSON.parse(backup([newProject()])); raw.schemaVersion = 99; expect(() => parseImport(JSON.stringify(raw))).toThrow('schemaVersion') })
  it('rejects unsupported project schemaVersion', () => { const raw = JSON.parse(backup([newProject()])); raw.projects[0].schemaVersion = 99; expect(() => parseImport(JSON.stringify(raw))).toThrow('schemaVersion') })
  it('rejects missing collections', () => { const raw = JSON.parse(backup([newProject()])); delete raw.projects[0].lists; expect(() => parseImport(JSON.stringify(raw))).toThrow('Struktur backup') })
  it('rejects data with incorrect field types', () => { const raw = JSON.parse(backup([newProject()])); raw.projects[0].summary.goal = ['bad']; expect(() => parseImport(JSON.stringify(raw))).toThrow() })
  it('rejects duplicate IDs and invalid dates', () => { const p = exampleProject(); p.lists.features[1].id = p.lists.features[0].id; expect(() => parseImport(backup([p]))).toThrow('ID item'); p.updatedAt = 'bad'; expect(projectSchema.safeParse(p).success).toBe(false) })
  it('rejects duplicate project IDs and oversized input', () => { const p = newProject(); expect(() => parseImport(backup([p, p]))).toThrow('ID proyek ganda'); expect(() => parseImport(' '.repeat(20 * 1024 * 1024 + 1))).toThrow('20 MB') })
  it('treats imported HTML as inert data', () => { const p = newProject('<script>alert(1)</script>'); expect(parseImport(backup([p]))[0].name).toBe(p.name) })
})
describe('project transformations', () => {
  it('duplicates all IDs and rewrites feature, screen and stage references', () => {
    const source = exampleProject(), copy = duplicateProject(source)
    expect(copy.id).not.toBe(source.id); expect(copy.name).toBe('Quiet Focus (salinan)'); expect(copy.example).toBe(false)
    const oldIds = listKeys.flatMap(k => source.lists[k].flatMap(i => [i.id, ...i.children.map(c => c.id)]))
    const ids = listKeys.flatMap(k => copy.lists[k].flatMap(i => [i.id, ...i.children.map(c => c.id)]))
    expect(ids.every(id => !oldIds.includes(id))).toBe(true)
    expect(copy.lists.features[1].links.dependencies).toEqual([copy.lists.features[0].id])
    expect(copy.lists.screens[0].links.features).toEqual([copy.lists.features[0].id])
    expect(copy.lists.plan[1].links.dependencies).toEqual([copy.lists.plan[0].id])
    expect(source.name).toBe('Quiet Focus')
  })
  it('preserves orphan references for explicit repair', () => { const p = exampleProject(); p.lists.features[0].links.dependencies = ['deleted']; const copy = duplicateProject(p); expect(copy.lists.features[0].links.dependencies).toEqual(['deleted']); expect(checks(copy).findings.some(f => /Referensi|dependensi/.test(f.message))).toBe(true) })
  it('does not approve sections or acceptance checks based on filled fields', () => { const p = exampleProject(); expect(p.lists.acceptance.every(i => !i.checked)).toBe(true); expect(p.sectionStatus.summary).toBe('Draf') })
})
describe('local completeness rules', () => {
  it('uses exactly ten rules and reports missing locations', () => { const result = checks(newProject()); expect(result.total).toBe(10); expect(result.percent).toBe(result.passed * 10); expect(result.findings.map(f => f.section)).toContain('summary') })
  it('detects self dependencies and orphan feature references', () => { const p = exampleProject(); p.lists.features[0].links.dependencies = [p.lists.features[0].id]; expect(checks(p).findings.some(f => f.message.includes('diri sendiri'))).toBe(true); p.lists.screens[0].links.features = ['deleted']; expect(checks(p).findings.some(f => f.section === 'screens' && f.message.includes('Referensi'))).toBe(true) })
  it('detects absent acceptance, screen actions and reduced motion', () => { const p = exampleProject(); p.lists.features[0].data.criteria = ''; p.lists.screens[0].data.actions = ''; p.lists.motion[0].data.reduced = ''; const messages = checks(p).findings.map(f => f.message).join(' '); expect(messages).toMatch(/kriteria penerimaan/); expect(messages).toMatch(/tindakan utama/); expect(messages).toMatch(/reduced motion/) })
  it('offers heuristic advice without changing score', () => { const p = exampleProject(); const score = checks(p).percent; p.summary.description = 'modern dan smooth'; expect(checks(p).findings.some(f => f.hint)).toBe(true); expect(checks(p).percent).toBe(score) })
  it('resolves only when open question status changes', () => { const p = exampleProject(); expect(checks(p).percent).toBe(90); p.lists.questions[0].data.status = 'Terselesaikan'; expect(checks(p).percent).toBe(100) })
})
describe('document generation', () => {
  it('exports latest content, all fields and manual statuses', () => { const p = exampleProject(); p.summary.goal = 'LATEST_EDIT'; p.version = '2.3'; const doc = documents(p)['APP_SPEC.md']; expect(doc).toContain('LATEST_EDIT'); expect(doc).toContain('2.3'); expect(doc).toContain('Belum diverifikasi'); expect(doc).toContain('Pertanyaan terbuka'); expect(doc).toContain('Ringkasan perubahan'); for (const key of listKeys) for (const item of p.lists[key]) for (const value of Object.values(item.data)) if (value) expect(doc).toContain(value) })
  it('exports blank sections without invented decisions', () => { const doc = documents(newProject())['APP_SPEC.md']; expect(doc).toContain('Belum ditentukan'); expect(doc).not.toContain('Quiet Focus'); expect(doc).not.toContain('#167867') })
  it('preserves special characters, newlines, tables, code fences and HTML', () => { const value = '# T\n| A | B |\n```js\nalert(1)\n```\n````\n<script>x</script> & \\'; const text = literal(value); expect(text).toContain(value); expect(text.startsWith('`````text')).toBe(true); expect(text.endsWith('`````\n')).toBe(true) })
  it('uses filenames safe for Windows and preserves useful Unicode', () => { expect(safeName('../Foo:<bar>?*')).not.toMatch(/[<>:"/\\|?*]/); expect(safeName('...')).toBe('proyek'); expect(safeName('Ide Indonesia')).toBe('Ide Indonesia') })
  it('generates exactly nine ZIP entries from the same source', async () => {
    const p = exampleProject(), blob = await zipProject(p), zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(Object.keys(zip.files).sort()).toEqual(['README.md', 'APP_SPEC.md', 'PRD.md', 'UI_SPEC.md', 'MOTION_SPEC.md', 'DATA_MODEL.md', 'IMPLEMENTATION_PLAN.md', 'ACCEPTANCE_CRITERIA.md', 'PROJECT_BACKUP.json'].sort())
    expect(await zip.file('APP_SPEC.md')!.async('string')).toBe(documents(p)['APP_SPEC.md'])
    expect(parseImport(await zip.file('PROJECT_BACKUP.json')!.async('string'))).toEqual([p]); expect(zip.file('AGENTS.md')).toBeNull()
  })
  it('limits implementation prompts to MVP or selected phase', () => { const p = exampleProject(); expect(implementationPrompt(p)).toContain('Bangun ruang lingkup MVP'); const phase = p.lists.plan[0]; const prompt = implementationPrompt(p, phase.id); expect(prompt).toContain(phase.id); expect(prompt).toContain(phase.data.tasks); expect(prompt).not.toContain('API key') })
})
describe('IndexedDB and serialized autosave', () => {
  let db: BlueprintDB | undefined
  afterEach(async () => { if (db) { await db.delete(); db = undefined } })
  it('persists edits across database reload, duplicates and deletes projects', async () => {
    const name = 'test-' + crypto.randomUUID(); db = new BlueprintDB(name); const p = exampleProject(); await db.projects.add(p)
    p.summary.goal = 'After edit'; const queue = new SaveQueue(project => db!.projects.put(project)); await queue.save(p); db.close(); db = new BlueprintDB(name)
    expect((await db.projects.get(p.id))!.summary.goal).toBe('After edit'); const copy = duplicateProject(p); await db.projects.add(copy); expect(await db.projects.count()).toBe(2); await db.projects.delete(copy.id); expect(await db.projects.count()).toBe(1)
  })
  it('serializes snapshots so an older write cannot overwrite a new one', async () => {
    const writes: string[] = []; let release: (() => void) | undefined
    const queue = new SaveQueue(async p => { if (p.name === 'first') await new Promise<void>(r => { release = r }); writes.push(p.name) })
    const first = queue.save(newProject('first')); await Promise.resolve(); await Promise.resolve(); const last = queue.save(newProject('last')); release!(); await Promise.all([first, last]); expect(writes).toEqual(['first', 'last'])
  })
  it('isolates snapshots and recovers after a failed write', async () => { let fail = true; const writes: string[] = []; const queue = new SaveQueue(async p => { if (fail) { fail = false; throw new Error('quota') } writes.push(p.name) }); await expect(queue.save(newProject())).rejects.toThrow('quota'); const p = newProject('snapshot'); const saving = queue.save(p); p.name = 'mutated'; await saving; expect(writes).toEqual(['snapshot']) })
  it('rejects invalid imports without altering existing data', async () => { db = new BlueprintDB('test-' + crypto.randomUUID()); const p = newProject('Keep me'); await db.projects.add(p); try { const data = parseImport('{bad}'); await db.projects.bulkPut(data) } catch { /* expected */ } expect(await db.projects.toArray()).toEqual([p]) })
  it('restores backups atomically as independent copies', async () => { db = new BlueprintDB('test-' + crypto.randomUUID()); const p = exampleProject(); await db.projects.add(p); const copies = parseImport(backup([p])).map(x => duplicateProject(x)); await db.transaction('rw', db.projects, () => db!.projects.bulkPut(copies)); expect(await db.projects.count()).toBe(2); expect((await db.projects.get(copies[0].id))!.lists.features[1].links.dependencies).toEqual([copies[0].lists.features[0].id]) })
  it('creates stable unique item IDs', () => { expect(newItem('features').id).not.toBe(newItem('features').id) })
})
