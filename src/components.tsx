import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Layers3, Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Field, Item, ListKey, Project } from './model'
import { childFields, itemFields, newItem, uid } from './model'

export function Logo() { return <span className="logo-mark"><Layers3 size={23} strokeWidth={1.7} /></span> }
export function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; const previous = document.activeElement as HTMLElement | null; dialog.showModal(); return () => { dialog.close(); previous?.focus() } }, [])
  return <dialog ref={ref} className={`dialog ${wide ? 'wide' : ''}`} onCancel={e => { e.preventDefault(); close() }} onClick={e => { if (e.target === e.currentTarget) close() }}>
    <div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label="Tutup dialog" onClick={close}><X size={20} /></button></div>{children}
  </dialog>
}
export function FieldInput({ definition: f, value, onChange, id }: { definition: Field; value: string; onChange: (value: string) => void; id: string }) {
  return <div className={`field ${f.short ? '' : 'full'}`}><label htmlFor={id}>{f.label}</label>
    {f.options ? <select id={id} value={value} onChange={e => onChange(e.target.value)}><option value="">Belum ditentukan</option>{f.options.map(option => <option key={option}>{option}</option>)}</select>
      : f.short ? <input id={id} type={f.number ? 'number' : 'text'} min={f.number ? 0 : undefined} maxLength={f.key === 'name' ? 200 : 200000} value={value} placeholder={f.placeholder} onChange={e => onChange(e.target.value)} />
      : <textarea id={id} rows={3} value={value} maxLength={200000} placeholder={f.placeholder || `Tuliskan ${f.label.toLowerCase()}…`} onChange={e => onChange(e.target.value)} />}
    {f.hint && <small>{f.hint}</small>}
  </div>
}
export function Fields({ definitions, data, change, prefix }: { definitions: Field[]; data: Record<string, string>; change: (key: string, value: string) => void; prefix: string }) {
  return <div className="form-grid">{definitions.map(f => <FieldInput key={f.key} definition={f} value={data[f.key] || ''} onChange={value => change(f.key, value)} id={`${prefix}-${f.key}`} />)}</div>
}
export function ListEditor({ listKey, project, update, confirm }: { listKey: ListKey; project: Project; update: (fn: (p: Project) => void) => void; confirm: (title: string, text: string, action: () => void) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const list = project.lists[listKey]
  const change = (id: string, fn: (item: Item) => void) => update(p => { const item = p.lists[listKey].find(i => i.id === id); if (item) fn(item) })
  const move = (index: number, delta: number) => update(p => { const items = p.lists[listKey]; [items[index], items[index + delta]] = [items[index + delta], items[index]] })
  return <div className="list-editor">
    {list.length === 0 && <div className="section-empty"><span className="empty-symbol"><Layers3 size={24} /></span><h3>Mulai dari satu item</h3><p>Tambahkan detail sedikit demi sedikit. Semua isian dapat diubah kapan saja.</p></div>}
    {list.map((item, index) => <div className="item-card" key={item.id}>
      <div className="item-head"><button className="item-toggle" onClick={() => setOpen(open === item.id ? null : item.id)} aria-expanded={open === item.id}><span className="item-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.data.name || 'Item tanpa judul'}</strong><small>{listKey === 'features' ? `${item.data.phase || 'Tahap belum ditentukan'} · ${item.data.priority || 'Prioritas belum ditentukan'}` : listKey === 'acceptance' ? `${item.data.category || 'Kategori belum ditentukan'} · ${item.checked ? 'Terpenuhi (manual)' : 'Belum diverifikasi'}` : item.id.slice(0, 8)}</small></span><ChevronDown className={open === item.id ? 'rotate' : ''} size={17} /></button>
        <div className="item-actions"><button className="icon-button" aria-label={`Naikkan ${item.data.name || 'item'}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button className="icon-button" aria-label={`Turunkan ${item.data.name || 'item'}`} disabled={index === list.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button className="icon-button danger" aria-label={`Hapus ${item.data.name || 'item'}`} onClick={() => confirm('Hapus item', `Hapus “${item.data.name || 'Item tanpa judul'}”? Referensi yang tersisa akan ditandai agar dapat diperbaiki.`, () => update(p => { p.lists[listKey] = p.lists[listKey].filter(i => i.id !== item.id) }))}><Trash2 size={16} /></button></div>
      </div>
      {open === item.id && <div className="item-body"><div className="form-grid">{itemFields[listKey].map(f => f.ref ? <fieldset className="references full" key={f.key}><legend>{f.label}</legend>
        {project.lists[f.ref].filter(x => !(f.key === 'dependencies' && x.id === item.id)).map(target => <label className="check-label" key={target.id}><input type="checkbox" checked={(item.links[f.key] || []).includes(target.id)} onChange={e => change(item.id, i => { i.links[f.key] = e.target.checked ? [...(i.links[f.key] || []), target.id] : (i.links[f.key] || []).filter(id => id !== target.id) })} />{target.data.name || 'Tanpa judul'} <code>{target.id.slice(0, 8)}</code></label>)}
        {project.lists[f.ref].filter(x => x.id !== item.id).length === 0 && <p className="muted">Belum ada item lain yang dapat ditautkan.</p>}
        {(item.links[f.key] || []).filter(id => id === item.id && f.key === 'dependencies' || !project.lists[f.ref!].some(x => x.id === id)).map(id => <div className="ref-error" key={id}>Referensi tidak valid: {id}<button className="text-button" onClick={() => change(item.id, i => { i.links[f.key] = i.links[f.key].filter(x => x !== id) })}>Hapus referensi</button></div>)}
      </fieldset> : <FieldInput key={f.key} definition={f} value={item.data[f.key] || ''} id={`${item.id}-${f.key}`} onChange={value => change(item.id, i => { i.data[f.key] = value })} />)}</div>
        {listKey === 'acceptance' && <label className="check-label acceptance-check"><input type="checkbox" checked={item.checked} onChange={e => change(item.id, i => { i.checked = e.target.checked })} />Tandai terpenuhi setelah verifikasi manual</label>}
        {listKey === 'entities' && <div className="entity-fields"><h4>Field entitas</h4>{item.children.map((child, n) => <div className="child-card" key={child.id}><div className="row-between"><strong>Field {n + 1}</strong><button className="icon-button danger" aria-label={`Hapus field ${child.data.name || n + 1}`} onClick={() => confirm('Hapus field', `Hapus field “${child.data.name || n + 1}”?`, () => change(item.id, i => { i.children = i.children.filter(c => c.id !== child.id) }))}><Trash2 size={16} /></button></div><Fields definitions={childFields} data={child.data} prefix={child.id} change={(key, value) => change(item.id, i => { i.children.find(c => c.id === child.id)!.data[key] = value })} /></div>)}<button className="button secondary" onClick={() => change(item.id, i => { i.children.push({ id: uid(), data: {}, links: {}, checked: false }) })}><Plus size={16} />Tambah field</button></div>}
      </div>}
    </div>)}
    <button className="add-item" onClick={() => { const item = newItem(listKey); update(p => { p.lists[listKey].push(item) }); setOpen(item.id) }}><Plus size={18} />Tambah {({ features: 'fitur', flows: 'alur pengguna', screens: 'layar', motion: 'aturan animasi', entities: 'entitas', plan: 'tahap', acceptance: 'kriteria', decisions: 'keputusan', questions: 'pertanyaan' })[listKey]}</button>
  </div>
}
const safeColor = (color: string | undefined, fallback: string) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color || '') ? color! : fallback
export function DesignPreview({ data }: { data: Record<string, string> }) {
  const [message, setMessage] = useState(false)
  const bounded = (value: string, min: number, max: number, fallback: number) => value?.trim() && Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback
  const style = { '--sample-primary': safeColor(data.primary, '#167867'), '--sample-bg': safeColor(data.background, '#ffffff'), '--sample-text': safeColor(data.text, '#243932'), '--sample-accent': safeColor(data.accent, '#e3eee8'), borderRadius: bounded(data.radius, 0, 32, 12), fontSize: bounded(data.fontSize, 12, 24, 16) } as CSSProperties
  return <div className="design-preview" style={style}><div className="row-between"><span className="eyebrow">PRATINJAU SISTEM DESAIN</span><span className="sample-badge">Contoh</span></div><h3>Satu ide, banyak kemungkinan.</h3><p>Pratinjau ini mengikuti warna, ukuran teks, dan radius yang Anda tentukan.</p><label htmlFor="sample-input">Nama proyek</label><input id="sample-input" placeholder="Ide berikutnya" /><button onClick={() => setMessage(!message)}>Coba tombol <Check size={16} /></button>{message && <small role="status">Interaksi contoh berhasil.</small>}</div>
}
export function MotionPlayground({ rules }: { rules: Item[] }) {
  const reduced = useReducedMotion(), [tab, setTab] = useState(0), [cards, setCards] = useState(1), [modal, setModal] = useState(false), [notice, setNotice] = useState(false), [presses, setPresses] = useState(0)
  const rule = (pattern: RegExp, fallback: number) => { const found = rules.find(r => pattern.test(r.data.name || ''))?.data.duration; const value = found?.trim() ? Number(found) : fallback; return reduced ? 0 : Math.max(0, Math.min(2000, Number.isFinite(value) ? value : fallback)) / 1000 }
  return <div className="playground"><div className="row-between"><div><span className="eyebrow">LAB INTERAKSI</span><h3>Rasakan gerakannya</h3></div><span className="badge">{reduced ? 'Reduced motion aktif' : 'Pratinjau proyek'}</span></div><p>Contoh memakai durasi aturan bernama Tombol, Panel/Tab, dan Modal (dibatasi 0–2.000 ms). Efek lainnya tetap menjadi spesifikasi tertulis.</p>
    <div className="playground-actions"><motion.button className="button primary" whileTap={reduced ? {} : { scale: 0.97 }} transition={{ duration: rule(/tombol|button/i, 120) }} onClick={() => setPresses(p => p + 1)}>Tekan tombol{presses > 0 ? ` (${presses})` : ''}</motion.button><button className="button secondary" onClick={() => setModal(true)}>Buka modal</button><button className="button secondary" onClick={() => { setNotice(true); setTimeout(() => setNotice(false), 3500) }}>Notifikasi</button></div>
    <div className="segmented" role="tablist" aria-label="Contoh tab">{['Ringkasan', 'Detail'].map((label, n) => <button key={label} role="tab" id={`lab-tab-${n}`} aria-controls="lab-tabpanel" aria-selected={tab === n} tabIndex={tab === n ? 0 : -1} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); setTab(1 - tab); document.getElementById(`lab-tab-${1 - tab}`)?.focus() } }} onClick={() => setTab(n)}>{label}</button>)}</div>
    <motion.div id="lab-tabpanel" role="tabpanel" aria-labelledby={`lab-tab-${tab}`} key={tab} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: rule(/panel|tab/i, 200) }} className="lab-panel">{tab === 0 ? 'Transisi memberi konteks ketika konten berubah.' : 'Utamakan transform dan opacity. Hormati preferensi reduced motion.'}</motion.div>
    <div className="lab-cards"><AnimatePresence>{Array.from({ length: cards }, (_, i) => <motion.div key={i} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: rule(/panel|tab/i, 200) }} className="lab-card"><Layers3 size={17} />Kartu {i + 1}</motion.div>)}</AnimatePresence></div><button className="text-button" disabled={cards >= 4} onClick={() => setCards(c => c + 1)}><Plus size={16} />Tambahkan kartu</button>
    <AnimatePresence>{notice && <motion.div className="inline-success" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15 }}><Check size={17} />Notifikasi contoh ditampilkan.</motion.div>}</AnimatePresence>
    {modal && <Modal title="Contoh modal proyek" close={() => setModal(false)}><motion.div className="dialog-body" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: rule(/modal/i, 200) }}><p>Pratinjau ini terpisah dari animasi antarmuka App Blueprint. Tekan Escape untuk menutup.</p><button className="button primary" onClick={() => setModal(false)}>Tutup modal</button></motion.div></Modal>}
  </div>
}
export function CopyButton({ value, notify }: { value: string; notify: (message: string) => void }) {
  return <button className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(value); notify('Prompt disalin ke clipboard.') } catch { notify('Clipboard tidak tersedia. Gunakan tombol Unduh prompt.') } }}><Copy size={16} />Salin prompt</button>
}
