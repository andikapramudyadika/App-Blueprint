import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ExternalLink, KeyRound, Link2Off, LoaderCircle, ShieldCheck } from 'lucide-react'
import { aiModels, aiTokenLimits, OpenRouterSession } from './openrouter'

export type AiPreferences = { model: string; zeroRetention: boolean; maxTokens: number }
export function AiSettings({ session, preferences, setPreferences }: { session: OpenRouterSession; preferences: AiPreferences; setPreferences: (value: AiPreferences) => void }) {
  const status = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const [key, setKey] = useState(''), [error, setError] = useState(''), [connecting, setConnecting] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const connect = async () => {
    setError(''); setConnecting(true); const aborter = new AbortController(); controller.current = aborter
    try { await session.connect(key, aborter.signal); setKey('') }
    catch (error) { if (!aborter.signal.aborted) setError(error instanceof Error ? error.message : 'Koneksi gagal.') }
    finally { if (!aborter.signal.aborted) setConnecting(false) }
  }
  return <section className="ai-settings" aria-label="Koneksi AI OpenRouter"><div className="row-between"><h3><KeyRound size={18} />Bantuan AI OpenRouter</h3><span className="badge">{status.connected ? 'Terhubung untuk sesi ini' : 'Belum terhubung'}</span></div>
    <p>Mode manual tidak memerlukan API key. Bantuan AI mengirim konteks yang Anda tinjau ke OpenRouter dan penyedia model; biaya dibebankan ke akun OpenRouter Anda.</p>
    <div className="info-note"><ShieldCheck size={19} /><div>Key hanya berada di memori tab ini. Memuat ulang atau menutup halaman menghapus koneksi. Key tidak dimasukkan ke proyek, backup, ekspor, URL, atau log aplikasi. Penyimpanan sementara tetap dapat diakses skrip berbahaya atau ekstensi yang menguasai halaman.</div></div>
    {status.connected ? <div className="row-gap wrap"><button className="button secondary" onClick={() => { session.disconnect(); setKey(''); setError('') }}><Link2Off size={16} />Putuskan koneksi</button>{status.remaining !== null && <small className="muted">Sisa batas key: US${status.remaining.toFixed(4)} (saat dihubungkan)</small>}</div>
      : <div className="ai-connect"><div className="field"><label htmlFor="openrouter-key">API key khusus App Blueprint</label><input id="openrouter-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e => setKey(e.target.value)} maxLength={300} placeholder="sk-or-…" /></div><button className="button primary" disabled={connecting || !key.trim()} onClick={() => { void connect() }}>{connecting ? <LoaderCircle className="spin" size={16} /> : <KeyRound size={16} />}{connecting ? 'Memeriksa key…' : 'Hubungkan untuk sesi ini'}</button>{connecting && <button className="text-button" onClick={() => { controller.current?.abort(); setConnecting(false); setKey('') }}>Batalkan koneksi</button>}</div>}
    {error && <div className="error-box" role="alert">{error}</div>}
    <div className="field"><label htmlFor="ai-model">Model AI</label><select id="ai-model" value={aiModels.some(m => m.id === preferences.model) ? preferences.model : 'custom'} onChange={e => setPreferences({ ...preferences, model: e.target.value === 'custom' ? '' : e.target.value })}>{aiModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}<option value="custom">Model lain yang mendukung Structured Outputs</option></select></div>
    {!aiModels.some(m => m.id === preferences.model) && <div className="field"><label htmlFor="ai-custom-model">ID model OpenRouter</label><input id="ai-custom-model" value={preferences.model} onChange={e => setPreferences({ ...preferences, model: e.target.value })} placeholder="provider/nama-model" maxLength={150} /></div>}
    <div className="field"><label htmlFor="ai-token-limit">Batas token respons</label><select id="ai-token-limit" value={preferences.maxTokens} onChange={e => setPreferences({ ...preferences, maxTokens: Number(e.target.value) })}>{aiTokenLimits.map(limit => <option key={limit} value={limit}>{limit.toLocaleString('id-ID')} token</option>)}</select><small>Batas ini mencakup jawaban dan penalaran AI. Naikkan jika respons terpotong. Batas lebih besar dapat menambah biaya dan waktu tunggu; tidak ada percobaan ulang otomatis.</small></div>
    <label className="check-label"><input type="checkbox" checked={preferences.zeroRetention} onChange={e => setPreferences({ ...preferences, zeroRetention: e.target.checked })} />Hanya gunakan provider dengan Zero Data Retention</label>
    <small className="muted">Provider yang menggunakan data untuk pelatihan dikecualikan. Opsi Zero Data Retention dapat mengurangi pilihan provider dan membuat model tertentu tidak tersedia.</small>
    <div className="row-gap wrap"><a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">Buat key & tetapkan batas belanja <ExternalLink size={13} /></a><a href="https://openrouter.ai/docs/guides/privacy/provider-logging" target="_blank" rel="noopener noreferrer">Kebijakan data provider <ExternalLink size={13} /></a></div>
    {status.usage && <small className="muted">Permintaan terakhir: {status.usage.input.toLocaleString('id-ID')} token masuk · {status.usage.output.toLocaleString('id-ID')} token keluar{status.usage.reasoning > 0 ? ` (termasuk ${status.usage.reasoning.toLocaleString('id-ID')} token penalaran)` : ''}{status.usage.cost !== null ? ` · US$${status.usage.cost.toFixed(6)}` : ' · biaya tidak dilaporkan provider'}</small>}
  </section>
}
