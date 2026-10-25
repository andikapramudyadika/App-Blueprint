import { afterEach, describe, expect, it, vi } from 'vitest'
import { backup, duplicateProject, newProject, parseImport, projectSchema } from './model'
import { aiContext, applyProposal, ensureGuide, projectFingerprint, requiresAnchorReview, saveAnchor, setTarget, validateProposal } from './guided'
import type { AiProposal } from './guided'
import { OpenRouterSession } from './openrouter'
import { documents } from './documents'
import { checks } from './checks'

const key = 'sk-or-v1-' + 'a'.repeat(40)
const proposal = (): AiProposal => ({ summary: 'Usulan ringkas', changes: [{ target: 'summary', field: 'goal', value: 'Catatan tetap tersedia setelah reload.', reason: 'Tujuan yang dapat diverifikasi.' }], additions: [], questions: [], conflicts: [] })
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const completion = (p = proposal()) => response({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(p) } }], usage: { prompt_tokens: 300, completion_tokens: 100, cost: 0.0001 } })
const connectResponse = () => response({ data: { limit_remaining: 2 } })

describe('guided project data and safety', () => {
  it('keeps old backups compatible and new guided data round trips', () => {
    const p = newProject(); expect(parseImport(backup([p]))).toEqual([p]); expect(p.guided).toBeUndefined()
    const guide = ensureGuide(p); guide.step = 3; guide.answers.technology = 'React'; guide.modes[1] = 'ai'
    expect(projectSchema.safeParse(p).success).toBe(true); expect(parseImport(backup([p]))).toEqual([p])
  })
  it('maps novice fields directly into canonical editor data', () => {
    const p = newProject(); setTarget(p, 'summary', 'name', 'Warung'); setTarget(p, 'summary', 'description', 'Catat utang'); setTarget(p, 'dataSettings', 'storage', 'IndexedDB'); setTarget(p, 'guided', 'firstAction', 'Catat transaksi')
    expect(p.name).toBe('Warung'); expect(p.description).toBe('Catat utang'); expect(p.dataSettings.storage).toBe('IndexedDB'); expect(p.guided!.answers.firstAction).toBe('Catat transaksi')
  })
  it('rejects arbitrary fields, credentials and prototype paths', () => {
    const p = newProject(); for (const field of ['apiKey', '__proto__', 'constructor', 'sectionStatus']) expect(() => setTarget(p, 'summary', field, 'bad')).toThrow()
    const invalid = proposal(); invalid.changes[0].field = '__proto__'; expect(() => validateProposal(invalid)).toThrow()
    expect(() => validateProposal({ ...proposal(), apiKey: key })).toThrow()
  })
  it('pins an explicit anchor and does not overwrite it when AI is applied', () => {
    const p = newProject(); p.summary.goal = 'Awal'; p.summary.description = 'Ide awal'; saveAnchor(p); const anchor = structuredClone(p.guided!.anchor)
    expect(requiresAnchorReview(p, proposal(), [0], [])).toBe(true); expect(() => applyProposal(p, proposal(), [0], [], 0, false)).toThrow('Tinjau')
    applyProposal(p, proposal(), [0], [], 0, true); expect(p.guided!.anchor).toEqual(anchor); expect(p.summary.goal).not.toBe('Awal')
  })
  it('requires explicit conflict review even when no anchor exists', () => { const p = newProject(), draft = proposal(); draft.conflicts = ['Target pengguna bertentangan.']; expect(() => applyProposal(p, draft, [0], [], 0, false)).toThrow() })
  it('applies only selected fields and appends items without replacing existing data', () => {
    const p = newProject(); p.summary.audience = 'Tetap'; p.sectionStatus.summary = 'Disepakati'; const draft = proposal(); draft.changes.push({ target: 'summary', field: 'audience', value: 'Baru', reason: '' }); draft.additions.push({ kind: 'features', reason: '', fields: [{ field: 'name', value: 'Catat' }, { field: 'phase', value: 'MVP' }] })
    applyProposal(p, draft, [0], [0], 2, false); const id = p.lists.features[0].id; applyProposal(p, { ...proposal(), additions: draft.additions }, [], [0], 2, false)
    expect(p.summary.audience).toBe('Tetap'); expect(p.sectionStatus.summary).toBe('Draf'); expect(p.lists.features).toHaveLength(2); expect(p.lists.features[0].id).toBe(id)
  })
  it('rejects AI approval, IDs, reference fields and invalid priority values', () => {
    for (const [field, value] of [['checked', 'true'], ['id', 'fake'], ['dependencies', 'fake'], ['priority', 'Sangat penting']]) {
      const draft = proposal(); draft.additions = [{ kind: 'features', reason: '', fields: [{ field: 'name', value: 'X' }, { field, value }] }]; expect(() => validateProposal(draft)).toThrow()
    }
  })
  it('keeps acceptance criteria unverified', () => { const p = newProject(), draft = proposal(); draft.additions = [{ kind: 'acceptance', reason: '', fields: [{ field: 'name', value: 'Data tersimpan' }, { field: 'category', value: 'Penyimpanan' }] }]; applyProposal(p, draft, [], [0], 5, false); expect(p.lists.acceptance[0].checked).toBe(false) })
  it('rejects duplicate change targets and unnamed additions', () => { const draft = proposal(); draft.changes.push({ ...draft.changes[0] }); expect(() => validateProposal(draft)).toThrow(); draft.changes.pop(); draft.additions = [{ kind: 'features', reason: '', fields: [] }]; expect(() => validateProposal(draft)).toThrow() })
  it('persists follow-up questions, avoids duplicate questions and remaps their IDs on copy', () => {
    const p = newProject(), draft = proposal(); draft.questions = [{ question: 'Siapa penggunanya?', options: ['Saya'], target: 'summary', field: 'audience', reason: 'Belum diketahui' }]
    applyProposal(p, draft, [], [], 1, false); applyProposal(p, draft, [], [], 1, false); expect(p.guided!.questions).toHaveLength(1); expect(p.guided!.questions[0].resolved).toBe(false)
    expect(duplicateProject(p).guided!.questions[0].id).not.toBe(p.guided!.questions[0].id)
    expect(checks(p).findings.some(f => f.message.includes('pertanyaan'))).toBe(true)
  })
  it('exports guided answers, anchor and unresolved questions', () => { const p = newProject(); ensureGuide(p).answers.technology = 'Tidak perlu server'; saveAnchor(p); const draft = proposal(); draft.questions = [{ question: 'Perlu cloud?', options: [], target: 'dataSettings', field: 'sync', reason: '' }]; applyProposal(p, draft, [], [], 4, false); const text = documents(p)['APP_SPEC.md']; expect(text).toContain('Tidak perlu server'); expect(text).toContain('Acuan awal'); expect(text).toContain('Perlu cloud?'); expect(text).toContain('Belum diputuskan') })
  it('detects edits while ignoring navigation and mode-only changes', () => { const p = newProject(); ensureGuide(p); const start = projectFingerprint(p); p.guided!.step = 2; p.guided!.modes[2] = 'ai'; expect(projectFingerprint(p)).toBe(start); p.summary.goal = 'Edit baru'; expect(projectFingerprint(p)).not.toBe(start) })
  it('redacts accidentally pasted keys and marks truncated input in the exact AI context', () => { const p = newProject(); p.summary.constraints = key; p.summary.goal = 'x'.repeat(3000); const context = aiContext(p, 0); expect(context).not.toContain(key); expect(context).toContain('KREDENSIAL DISAMARKAN'); expect(JSON.parse(context).truncated).toBe(true) })
  it('rejects invalid guided stages and modes in imports', () => { const p = newProject(); ensureGuide(p).step = 9; expect(projectSchema.safeParse(p).success).toBe(false); p.guided!.step = 0; p.guided!.modes = ['ai']; expect(projectSchema.safeParse(p).success).toBe(false) })
})

describe('OpenRouter session transport', () => {
  afterEach(() => vi.useRealTimers())
  it('does not contact the network for an invalid key', async () => { const fetcher = vi.fn(); const session = new OpenRouterSession(fetcher); await expect(session.connect('invalid')).rejects.toThrow('Format key'); expect(fetcher).not.toHaveBeenCalled() })
  it('verifies a key without caching and never serializes the credential', async () => {
    const fetcher = vi.fn().mockResolvedValue(connectResponse()); const session = new OpenRouterSession(fetcher); await session.connect(key)
    expect(fetcher.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/key'); expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'GET', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Authorization: `Bearer ${key}` } })
    expect(session.getSnapshot()).toMatchObject({ connected: true, remaining: 2 }); expect(JSON.stringify(session)).not.toContain(key); expect(new OpenRouterSession(fetcher).getSnapshot().connected).toBe(false)
    session.disconnect(); expect(session.getSnapshot().connected).toBe(false)
  })
  it('sends one schema-constrained request to the fixed official endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(completion()); const session = new OpenRouterSession(fetcher); await session.connect(key)
    const p = newProject(); const before = backup([p]); const result = await session.request({ project: p, step: 0, model: 'google/gemini-2.5-flash-lite', instruction: 'Rapikan', zeroRetention: true })
    const [url, init] = fetcher.mock.calls[1]; const body = JSON.parse(init.body)
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions'); expect(init.headers.Authorization).toBe(`Bearer ${key}`); expect(init.body).not.toContain(key)
    expect(body.response_format.json_schema.strict).toBe(true); expect(body.response_format.json_schema.schema.additionalProperties).toBe(false); expect(body.provider).toEqual({ require_parameters: true, data_collection: 'deny', zdr: true }); expect(body.max_tokens).toBe(4096); expect(body.stream).toBe(false)
    expect(result.proposal).toEqual(proposal()); expect(result.usage.cost).toBe(0.0001); expect(JSON.parse(before).projects).toEqual(JSON.parse(backup([p])).projects); expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('includes the planning anchor and answered questions without session credentials', async () => {
    const p = newProject(); p.summary.goal = 'TUJUAN_AWAL'; saveAnchor(p); ensureGuide(p).questions.push({ id: 'q', step: 1, question: 'Siapa?', reason: '', options: [], target: 'summary', field: 'audience', answer: 'Saya saja', resolved: true })
    const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(completion()); const session = new OpenRouterSession(fetcher); await session.connect(key); await session.request({ project: p, step: 1, model: 'deepseek/deepseek-v4-flash-0731', instruction: key, zeroRetention: false })
    const body = JSON.parse(fetcher.mock.calls[1][1].body); const user = JSON.parse(body.messages[1].content)
    expect(user.context.anchor.goal).toBe('TUJUAN_AWAL'); expect(user.context.questions[0].answer).toBe('Saya saja'); expect(body.messages[1].content).not.toContain(key); expect(body.provider.zdr).toBeUndefined()
  })
  it.each([401, 402, 429, 503])('handles HTTP %s without echoing provider response or key', async status => {
    const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(response({ error: { message: key } }, status)); const session = new OpenRouterSession(fetcher); await session.connect(key)
    try { await session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false }); throw new Error('expected failure') } catch (error) { expect((error as Error).message).not.toContain(key); expect((error as Error).message).not.toContain('expected failure') }
    expect(session.getSnapshot().busy).toBe(false)
  })
  it('rejects malformed or unapproved AI output without applying anything', async () => {
    const draft = proposal(); draft.changes[0].field = 'apiKey'; const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(completion(draft)); const session = new OpenRouterSession(fetcher); await session.connect(key)
    const p = newProject(); await expect(session.request({ project: p, step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false })).rejects.toThrow('validasi'); expect(p.summary.goal).toBeUndefined()
  })
  it('clears a revoked credential automatically', async () => { const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(response({}, 401)); const session = new OpenRouterSession(fetcher); await session.connect(key); await expect(session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: true })).rejects.toThrow('API key'); expect(session.getSnapshot().connected).toBe(false) })
  it('reports token truncation rather than applying a partial response', async () => { const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockResolvedValueOnce(response({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] })); const session = new OpenRouterSession(fetcher); await session.connect(key); await expect(session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false })).rejects.toThrow('terpotong') })
  it('rejects arbitrary model URLs and unauthenticated requests', async () => { const fetcher = vi.fn().mockResolvedValue(connectResponse()); const session = new OpenRouterSession(fetcher); const args = { project: newProject(), step: 0, model: 'https://evil.example', instruction: '', zeroRetention: false }; await expect(session.request(args)).rejects.toThrow('Hubungkan'); await session.connect(key); await expect(session.request(args)).rejects.toThrow('ID model'); expect(fetcher).toHaveBeenCalledTimes(1) })
  it('disconnect aborts active requests and clears the session', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))))
    const session = new OpenRouterSession(fetcher); await session.connect(key); const pending = session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false }); const assertion = expect(pending).rejects.toThrow('dibatalkan'); session.disconnect(); await assertion; expect(session.getSnapshot()).toMatchObject({ connected: false, busy: false })
  })
  it('ignores late responses after disconnect even if transport ignores abort', async () => {
    let resolve: (value: Response) => void = () => undefined
    const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockImplementationOnce(() => new Promise<Response>(r => { resolve = r })); const session = new OpenRouterSession(fetcher); await session.connect(key)
    const pending = session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false }); const assertion = expect(pending).rejects.toThrow('Koneksi berubah'); session.disconnect(); resolve(completion()); await assertion; expect(session.getSnapshot().usage).toBeNull()
  })
  it('times out and never retries automatically', async () => {
    vi.useFakeTimers(); const fetcher = vi.fn().mockResolvedValueOnce(connectResponse()).mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))))
    const session = new OpenRouterSession(fetcher); await session.connect(key); const pending = session.request({ project: newProject(), step: 0, model: 'google/gemini-2.5-flash-lite', instruction: '', zeroRetention: false }); const assertion = expect(pending).rejects.toThrow('batas waktu'); await vi.advanceTimersByTimeAsync(90000); await assertion; expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
