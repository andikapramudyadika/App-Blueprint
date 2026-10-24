import type { Project, SectionKey } from './model'
export type Finding = { section: SectionKey; message: string; hint?: boolean }
export function checks(p: Project) {
  const rules: { ok: boolean; section: SectionKey; message: string }[] = [
    { ok: !!p.summary.goal?.trim(), section: 'summary', message: 'Tujuan utama belum ditentukan.' },
    { ok: !!p.summary.audience?.trim(), section: 'summary', message: 'Target pengguna belum ditentukan.' },
    { ok: p.lists.features.some(f => f.data.phase === 'MVP'), section: 'features', message: 'Belum ada fitur untuk MVP.' },
    { ok: p.lists.features.some(f => f.data.phase === 'MVP') && p.lists.features.filter(f => f.data.phase === 'MVP').every(f => !!f.data.criteria?.trim()), section: 'features', message: 'Setiap fitur MVP memerlukan kriteria penerimaan.' },
    { ok: p.lists.screens.length > 0 && p.lists.screens.every(s => s.data.goal?.trim() && s.data.actions?.trim()), section: 'screens', message: 'Tentukan tujuan dan tindakan utama untuk setiap layar.' },
    { ok: !!p.dataSettings.storage?.trim(), section: 'data', message: 'Jenis penyimpanan belum ditentukan.' },
    { ok: !!p.design.responsive?.trim(), section: 'design', message: 'Pedoman responsif belum ditentukan.' },
    { ok: p.lists.motion.length > 0 && p.lists.motion.every(m => !!m.data.reduced?.trim()), section: 'motion', message: 'Setiap aturan animasi memerlukan perilaku reduced motion.' },
    { ok: p.lists.features.every(f => (f.links.dependencies ?? []).every(id => id !== f.id && p.lists.features.some(x => x.id === id))), section: 'features', message: 'Ada dependensi fitur yang tidak valid atau mengacu pada diri sendiri.' },
    { ok: !p.lists.questions.some(q => q.data.status !== 'Terselesaikan'), section: 'decisions', message: 'Masih ada pertanyaan yang belum terjawab.' },
  ]
  const findings: Finding[] = rules.filter(r => !r.ok).map(r => ({ section: r.section, message: r.message }))
  for (const [key, list] of Object.entries(p.lists)) for (const item of list) for (const [ref, ids] of Object.entries(item.links)) {
    const target = ref === 'dependencies' && key === 'plan' ? p.lists.plan : p.lists.features
    if (ids.some(id => !target.some(x => x.id === id) || (ref === 'dependencies' && item.id === id))) {
      findings.push({ section: key === 'plan' ? 'plan' : key === 'screens' ? 'screens' : 'features', message: `Referensi tidak valid pada “${item.data.name || 'Item tanpa judul'}”. Hapus atau pilih ulang referensinya.` })
    }
  }
  const groups: [SectionKey, string][] = [['summary', Object.values(p.summary).join(' ')], ['design', Object.values(p.design).join(' ')], ...Object.entries(p.lists).map(([key, values]) => [key === 'entities' ? 'data' : key === 'questions' ? 'decisions' : key, values.map(i => Object.values(i.data).join(' ')).join(' ')] as [SectionKey, string])]
  for (const [section, value] of groups) if (/\b(modern|smooth)\b/i.test(value)) findings.push({ section, message: 'Kata “modern” atau “smooth” masih umum. Tambahkan warna, ukuran, durasi, atau perilaku yang dapat diverifikasi.', hint: true })
  const passed = rules.filter(r => r.ok).length
  return { percent: Math.round(passed / rules.length * 100), passed, total: rules.length, findings }
}
