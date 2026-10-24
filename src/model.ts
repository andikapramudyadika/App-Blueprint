import { z } from 'zod'

export type Field = { key: string; label: string; hint?: string; placeholder?: string; options?: string[]; short?: boolean; ref?: 'features' | 'plan'; number?: boolean }
export const sections = [
  { key: 'summary', label: 'Ringkasan proyek', description: 'Mulai dengan alasan mengapa aplikasi ini perlu ada.', icon: 'Compass' },
  { key: 'features', label: 'Fitur & ruang lingkup', description: 'Tentukan apa yang penting untuk versi pertama.', icon: 'Layers' },
  { key: 'flows', label: 'Alur pengguna', description: 'Petakan perjalanan pengguna, satu langkah pada satu waktu.', icon: 'Route' },
  { key: 'screens', label: 'Spesifikasi layar', description: 'Beri setiap layar tujuan dan perilaku yang jelas.', icon: 'PanelsTopLeft' },
  { key: 'design', label: 'Sistem desain', description: 'Bangun bahasa visual yang konsisten dan nyaman.', icon: 'Palette' },
  { key: 'motion', label: 'Animasi & interaksi', description: 'Gerakan kecil, dengan tujuan yang jelas.', icon: 'Sparkles' },
  { key: 'data', label: 'Data & penyimpanan', description: 'Rencanakan apa yang disimpan dan bagaimana menjaganya.', icon: 'Database' },
  { key: 'plan', label: 'Rencana implementasi', description: 'Pecah pekerjaan menjadi tahap yang dapat diverifikasi.', icon: 'Milestone' },
  { key: 'acceptance', label: 'Kriteria penerimaan', description: 'Tulis apa yang harus dipenuhi aplikasi yang akan dibangun.', icon: 'ListChecks' },
  { key: 'decisions', label: 'Keputusan & pertanyaan', description: 'Simpan alasan keputusan dan hal yang masih terbuka.', icon: 'MessagesSquare' },
] as const
export type SectionKey = typeof sections[number]['key']
export const listKeys = ['features', 'flows', 'screens', 'motion', 'entities', 'plan', 'acceptance', 'decisions', 'questions'] as const
export type ListKey = typeof listKeys[number]
export const field = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, ...extra })
export const summaryFields: Field[] = [
  field('name', 'Nama proyek', { short: true, placeholder: 'Contoh: Habit Garden' }),
  field('description', 'Deskripsi singkat', { placeholder: 'Jelaskan ide aplikasi Anda dalam satu atau dua kalimat.' }),
  field('problem', 'Masalah yang ingin diselesaikan'), field('goal', 'Tujuan utama', { placeholder: 'Contoh: Membantu pekerja menjaga fokus selama jam kerja.' }),
  field('audience', 'Target pengguna', { placeholder: 'Siapa yang memakai aplikasi ini, dan dalam situasi apa?' }),
  field('platform', 'Platform sasaran', { short: true, placeholder: 'Contoh: Web, ponsel dan desktop' }),
  field('language', 'Bahasa aplikasi', { short: true, placeholder: 'Contoh: Bahasa Indonesia' }),
  field('constraints', 'Batasan biaya, waktu, atau teknologi'), field('success', 'Indikator keberhasilan'), field('outOfScope', 'Di luar ruang lingkup'),
]
export const designFields: Field[] = [
  field('direction', 'Karakter visual'), field('primary', 'Warna utama', { short: true, placeholder: '#167867' }), field('accent', 'Warna aksen', { short: true }),
  field('background', 'Warna latar', { short: true }), field('text', 'Warna teks', { short: true }), field('status', 'Warna status'),
  field('typography', 'Tipografi', { short: true }), field('fontSize', 'Ukuran dasar (px)', { short: true, number: true }), field('spacing', 'Skala spacing'),
  field('radius', 'Radius (px)', { short: true, number: true }), field('shadow', 'Bayangan'), field('width', 'Lebar konten'), field('icons', 'Gaya ikon'),
  field('buttons', 'Tombol'), field('inputs', 'Input dan validasi'), field('cards', 'Kartu'), field('dialogs', 'Modal atau dialog'), field('navigation', 'Navigasi'),
  field('themes', 'Dukungan tema'), field('responsive', 'Ketentuan responsif', { placeholder: 'Contoh: Satu kolom di bawah 768 px; target sentuh minimal 44 px.' }),
]
export const dataFields: Field[] = [field('storage', 'Jenis penyimpanan'), field('accounts', 'Kebutuhan akun'), field('offline', 'Kebutuhan offline'), field('sync', 'Kebutuhan sinkronisasi'), field('backup', 'Pencadangan dan pemulihan'), field('deletion', 'Penghapusan data'), field('privacy', 'Catatan privasi')]
export const childFields: Field[] = [field('name', 'Nama field', { short: true }), field('type', 'Tipe data', { short: true, options: ['string', 'number', 'boolean', 'date', 'object', 'array'] }), field('required', 'Wajib atau opsional', { short: true, options: ['Wajib', 'Opsional'] }), field('default', 'Nilai awal'), field('relation', 'Relasi'), field('validation', 'Aturan validasi')]
export const itemFields: Record<ListKey, Field[]> = {
  features: [field('name', 'Nama fitur', { short: true }), field('description', 'Deskripsi'), field('benefit', 'Masalah atau manfaat'), field('story', 'User story', { placeholder: 'Sebagai …, saya ingin …, sehingga …' }), field('priority', 'Prioritas', { short: true, options: ['Wajib', 'Sebaiknya ada', 'Opsional'] }), field('phase', 'Tahap', { short: true, options: ['MVP', 'Berikutnya', 'Di luar cakupan'] }), field('dependencies', 'Dependensi fitur', { ref: 'features' }), field('criteria', 'Kriteria penerimaan', { placeholder: 'Tuliskan kondisi yang dapat diverifikasi, satu per baris.' }), field('notes', 'Catatan')],
  flows: [field('name', 'Nama alur', { short: true }), field('goal', 'Tujuan'), field('entry', 'Titik awal'), field('preconditions', 'Prasyarat'), field('steps', 'Langkah berurutan', { hint: 'Satu langkah per baris. Urutan baris menjadi urutan langkah.' }), field('success', 'Kondisi berhasil'), field('failure', 'Kondisi gagal'), field('alternatives', 'Jalur alternatif')],
  screens: [field('name', 'Nama layar', { short: true }), field('route', 'Route atau identitas layar', { short: true }), field('goal', 'Tujuan'), field('components', 'Komponen utama'), field('actions', 'Tindakan pengguna'), field('features', 'Fitur terkait', { ref: 'features' }), field('entry', 'Navigasi masuk'), field('exit', 'Navigasi keluar'), field('normal', 'Kondisi normal'), field('empty', 'Kondisi kosong'), field('loading', 'Kondisi loading'), field('error', 'Kondisi error'), field('success', 'Kondisi sukses'), field('mobile', 'Perilaku pada ponsel'), field('accessibility', 'Kebutuhan aksesibilitas')],
  motion: [field('name', 'Elemen atau komponen', { short: true }), field('trigger', 'Pemicu'), field('effect', 'Efek', { placeholder: 'Contoh: opacity 0 → 1 dan translateY 8 → 0 px' }), field('duration', 'Durasi (ms)', { short: true, number: true }), field('easing', 'Easing', { short: true, options: ['ease-out', 'ease-in-out', 'linear'] }), field('reduced', 'Perilaku reduced motion'), field('purpose', 'Tujuan penggunaan')],
  entities: [field('name', 'Nama entitas', { short: true }), field('description', 'Deskripsi dan relasi entitas')],
  plan: [field('name', 'Nama tahap', { short: true }), field('goal', 'Tujuan'), field('features', 'Fitur terkait', { ref: 'features' }), field('tasks', 'Tugas'), field('dependencies', 'Dependensi tahap', { ref: 'plan' }), field('deliverable', 'Hasil yang diharapkan'), field('verification', 'Cara verifikasi'), field('status', 'Status tahap', { short: true, options: ['Belum dimulai', 'Berjalan', 'Selesai'] })],
  acceptance: [field('name', 'Kriteria', { placeholder: 'Contoh: Data tetap tersedia setelah halaman dimuat ulang.' }), field('category', 'Kategori', { short: true, options: ['Fungsi', 'UI', 'Responsivitas', 'Aksesibilitas', 'Penyimpanan', 'Penanganan error', 'Animasi', 'Ekspor dan impor'] }), field('verification', 'Cara verifikasi')],
  decisions: [field('name', 'Judul keputusan', { short: true }), field('decision', 'Isi keputusan'), field('reason', 'Alasan'), field('date', 'Tanggal', { short: true, placeholder: 'YYYY-MM-DD' }), field('section', 'Bagian terkait', { short: true, options: sections.map(s => s.label) })],
  questions: [field('name', 'Pertanyaan', { short: true }), field('detail', 'Konteks atau jawaban'), field('status', 'Status pertanyaan', { short: true, options: ['Belum terjawab', 'Terselesaikan'] })],
}
const str = z.string().max(200000)
const data = z.record(z.string().max(100), str)
const links = z.record(z.string().max(100), z.array(z.string().max(200)).max(1000))
const childSchema = z.object({ id: z.string().min(1).max(200), data, links, checked: z.boolean() })
export const itemSchema = childSchema.extend({ children: z.array(childSchema).max(1000) })
export type Item = z.infer<typeof itemSchema>
const stage = z.enum(['Belum diisi', 'Draf', 'Disepakati'])
export const projectSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1).max(200), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  name: z.string().min(1).max(200), description: str, status: z.enum(['Draf', 'Disepakati', 'Arsip']), example: z.boolean(),
  version: z.string().max(100), changeSummary: str,
  summary: data, design: data, dataSettings: data,
  sectionStatus: z.object({ summary: stage, features: stage, flows: stage, screens: stage, design: stage, motion: stage, data: stage, plan: stage, acceptance: stage, decisions: stage }),
  lists: z.object(Object.fromEntries(listKeys.map(k => [k, z.array(itemSchema).max(1000)])) as Record<ListKey, z.ZodArray<typeof itemSchema>>),
}).superRefine((p, ctx) => {
  const ids = listKeys.flatMap(k => p.lists[k].flatMap(i => [i.id, ...i.children.map(c => c.id)]))
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'ID item harus unik dalam proyek.' })
})
export type Project = z.infer<typeof projectSchema>
export const uid = () => crypto.randomUUID()
export function newItem(key: ListKey): Item {
  const defaults: Record<string, string> = {}
  itemFields[key].forEach(f => { if (f.options) defaults[f.key] = f.options[0] })
  return { id: uid(), data: defaults, links: {}, checked: false, children: [] }
}
export function newProject(name = 'Proyek tanpa judul'): Project {
  const now = new Date().toISOString()
  return { schemaVersion: 1, id: uid(), createdAt: now, updatedAt: now, name, description: '', status: 'Draf', example: false, version: '1.0', changeSummary: '', summary: { name }, design: {}, dataSettings: {}, sectionStatus: Object.fromEntries(sections.map(s => [s.key, 'Belum diisi'])) as Project['sectionStatus'], lists: { features: [], flows: [], screens: [], motion: [], entities: [], plan: [], acceptance: [], decisions: [], questions: [] } }
}
export function duplicateProject(source: Project, suffix = ' (salinan)'): Project {
  const p = structuredClone(source), ids = new Map<string, string>()
  for (const key of listKeys) for (const item of p.lists[key]) { ids.set(item.id, uid()); for (const child of item.children) ids.set(child.id, uid()) }
  for (const key of listKeys) for (const item of p.lists[key]) {
    item.id = ids.get(item.id)!
    for (const [ref, values] of Object.entries(item.links)) item.links[ref] = values.map(id => ids.get(id) ?? id)
    item.children.forEach(child => { child.id = ids.get(child.id)!; for (const [ref, values] of Object.entries(child.links)) child.links[ref] = values.map(id => ids.get(id) ?? id) })
  }
  p.id = uid(); p.name = (p.name + suffix).slice(0, 200); p.summary.name = p.name; p.createdAt = p.updatedAt = new Date().toISOString(); p.example = false
  return p
}
export const backupSchema = z.object({ schemaVersion: z.literal(1), exportedAt: z.iso.datetime(), projects: z.array(projectSchema).min(1).max(500) })
export function parseImport(text: string): Project[] {
  if (text.length > 20 * 1024 * 1024) throw new Error('Ukuran file melebihi batas 20 MB.')
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('File bukan JSON yang valid. Pilih PROJECT_BACKUP.json atau backup App Blueprint.') }
  const result = backupSchema.safeParse(raw)
  if (!result.success) throw new Error('Struktur backup tidak valid atau schemaVersion tidak didukung (versi yang didukung: 1). ' + result.error.issues[0]?.message)
  if (new Set(result.data.projects.map(p => p.id)).size !== result.data.projects.length) throw new Error('Backup memiliki ID proyek ganda.')
  return result.data.projects
}
export const backup = (projects: Project[]) => JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects }, null, 2)

export const presets: Record<string, Record<string, string>> = Object.fromEntries([
  ['Minimal Terang', '#202d35', '#167867', '#ffffff', '#202d35', 'Minimal, lapang, dengan border halus.'],
  ['Gelap Elegan', '#7dd3c0', '#b9a4f2', '#141c24', '#ecf2f6', 'Tenang, gelap, dengan aksen yang lembut.'],
  ['Produktivitas Tenang', '#167867', '#dba955', '#f7f8fa', '#243932', 'Ruang kerja netral dengan aksen teal terkendali.'],
].map(([name, primary, accent, background, text, direction]) => [name, { direction, primary, accent, background, text, status: 'Sukses #167867; error #b74747; peringatan #9c6d23', typography: 'system-ui, sans-serif', fontSize: '16', spacing: '4, 8, 12, 16, 24, 32, 48 px', radius: '12', shadow: 'Tipis dan lembut pada elemen mengambang.', width: 'Maksimal 1200 px', icons: 'Lucide, stroke 1.75 px', buttons: 'Target sentuh minimal 44 px; label eksplisit; fokus terlihat.', inputs: 'Label tetap terlihat; error berupa teks di bawah input.', cards: 'Border 1 px; padding 24 px.', dialogs: 'Fokus terjebak; Escape menutup; fokus kembali ke pemicu.', navigation: 'Sidebar di desktop; pemilih bagian di ponsel.', themes: name === 'Gelap Elegan' ? 'Gelap' : 'Terang dan gelap', responsive: 'Di bawah 768 px: satu kolom, target sentuh 44 px. Desktop: sidebar dan panel pratinjau.' }]))

export function exampleProject(): Project {
  const p = newProject('Quiet Focus'); p.example = true; p.description = 'Pomodoro pribadi untuk bekerja lebih fokus, dengan ritme yang lebih tenang.'
  p.summary = { name: p.name, description: p.description, problem: 'Distraksi mengganggu sesi kerja dan pencatatan fokus masih manual.', goal: 'Membantu pengguna menyelesaikan sesi fokus dan melihat pola kerja mereka.', audience: 'Pekerja mandiri dan mahasiswa yang bekerja melalui browser.', platform: 'Web responsif dan PWA', language: 'Bahasa Indonesia', constraints: 'Tanpa backend, akun, API berbayar, atau cloud.', success: 'Sesi yang selesai tercatat tepat sekali dan dapat dilihat kembali setelah reload.', outOfScope: 'Kolaborasi, sinkronisasi cloud, dan gamifikasi.' }
  const add = (key: ListKey, data: Record<string, string>, refs: Record<string, string[]> = {}) => { const item = newItem(key); item.data = { ...item.data, ...data }; item.links = refs; p.lists[key].push(item); return item.id }
  const timer = add('features', { name: 'Timer fokus & istirahat', description: 'Sesi fokus 25 menit dengan istirahat 5 menit.', benefit: 'Membantu menjaga ritme kerja.', story: 'Sebagai pengguna, saya ingin memulai, menjeda, dan mengulang sesi agar dapat menyesuaikan ritme.', priority: 'Wajib', phase: 'MVP', criteria: 'Mulai menghitung mundur dari durasi pilihan.\nJeda mempertahankan sisa waktu.\nReload memulihkan sesi berdasarkan timestamp.\nSesi selesai hanya tercatat satu kali.' })
  const stats = add('features', { name: 'Statistik fokus', description: 'Ringkasan harian, mingguan, dan bulanan.', benefit: 'Memahami pola fokus pribadi.', story: 'Sebagai pengguna, saya ingin melihat menit fokus yang telah selesai.', priority: 'Wajib', phase: 'MVP', criteria: 'Hanya sesi selesai dihitung.\nFilter hari, minggu, dan bulan memakai tanggal lokal.\nTampilan kosong menjelaskan cara memulai.' }, { dependencies: [timer] })
  const settings = add('features', { name: 'Tema & pengaturan', description: 'Atur durasi dan tema terang atau gelap.', priority: 'Wajib', phase: 'MVP', criteria: 'Durasi harus antara 1 dan 120 menit.\nTema dan durasi tetap tersimpan setelah reload.' })
  add('flows', { name: 'Menyelesaikan sesi fokus', goal: 'Menyelesaikan satu sesi dan melihat hasil.', entry: 'Halaman timer', preconditions: 'Browser mendukung IndexedDB.', steps: 'Pilih durasi.\nTekan Mulai.\nSelesaikan sesi atau jeda bila perlu.\nLihat hasil pada statistik.', success: 'Sesi tercatat dan istirahat dapat dimulai.', failure: 'Bila penyimpanan gagal, tampilkan pesan dan sediakan coba lagi.', alternatives: 'Pengguna dapat mereset sesi dengan konfirmasi.' })
  for (const [name, route, goal, actions, refs] of [
    ['Timer', '/', 'Menjalankan sesi fokus.', 'Mulai, jeda, lanjutkan, reset.', [timer]],
    ['Statistik', '/stats', 'Melihat total waktu fokus.', 'Pilih periode harian, mingguan, atau bulanan.', [stats]],
    ['Pengaturan', '/settings', 'Menyesuaikan pengalaman.', 'Ubah durasi, tema, dan ekspor backup.', [settings]],
  ] as const) add('screens', { name, route, goal, actions, components: 'Judul, navigasi, kartu konten, tombol berlabel.', entry: 'Navigasi utama', exit: 'Navigasi utama', normal: 'Data terakhir tampil.', empty: 'Petunjuk memulai tanpa statistik palsu.', loading: 'Teks Memuat dan indikator progres.', error: 'Pesan kegagalan dengan tindakan Coba lagi.', success: 'Konfirmasi tindakan tersimpan.', mobile: 'Satu kolom; navigasi di bawah; target sentuh 44 px.', accessibility: 'Label eksplisit, fokus terlihat, status aria-live. Timer tidak diumumkan setiap detik.' }, { features: [...refs] })
  p.design = { ...presets['Produktivitas Tenang'] }
  for (const [name, trigger, effect, duration] of [['Tombol', 'Tekan', 'scale 0.98 → 1', '120'], ['Panel', 'Ganti tab', 'opacity 0 → 1', '200'], ['Modal', 'Buka atau tutup', 'opacity dan translateY 8 px', '200']]) add('motion', { name, trigger, effect, duration, easing: 'ease-out', reduced: 'Hapus transform dan transisi; perubahan tampil langsung.', purpose: 'Memberi umpan balik tanpa mengalihkan perhatian.' })
  p.dataSettings = { storage: 'IndexedDB lokal melalui Dexie.', accounts: 'Tidak memerlukan akun.', offline: 'Timer, statistik, dan pengaturan tersedia offline setelah aset tersimpan.', sync: 'Tidak ada sinkronisasi antarperangkat.', backup: 'Ekspor JSON dan impor sebagai salinan; validasi struktur sebelum menulis.', deletion: 'Konfirmasi penghapusan dengan nama; hapus data di IndexedDB.', privacy: 'Semua catatan fokus tetap di browser ini.' }
  add('entities', { name: 'Session', description: 'Satu sesi fokus yang selesai.' })
  p.lists.entities[0].children = [{ id: uid(), data: { name: 'id', type: 'string', required: 'Wajib', default: 'UUID', validation: 'Unik' }, links: {}, checked: false }, { id: uid(), data: { name: 'completedAt', type: 'date', required: 'Wajib', validation: 'Timestamp ISO valid' }, links: {}, checked: false }, { id: uid(), data: { name: 'durationMinutes', type: 'number', required: 'Wajib', validation: '1–120' }, links: {}, checked: false }]
  const phase = add('plan', { name: 'Fondasi dan timer', goal: 'Alur fokus yang tahan reload.', tasks: 'Bangun layout responsif.\nImplementasikan timer berbasis timestamp.\nSimpan sesi secara idempoten.', deliverable: 'Timer dan penyimpanan lokal.', verification: 'Uji jeda, reset, reload, dan sesi selesai.', status: 'Belum dimulai' }, { features: [timer] })
  add('plan', { name: 'Statistik, tema, dan offline', goal: 'Lengkapi MVP.', tasks: 'Bangun filter statistik.\nTambahkan pengaturan tema.\nCache aset PWA dan verifikasi offline.', deliverable: 'Aplikasi MVP siap ditinjau.', verification: 'Periksa statistik, backup round-trip, keyboard, dan mode offline.', status: 'Belum dimulai' }, { features: [stats, settings], dependencies: [phase] })
  for (const [category, name] of [['Fungsi', 'Timer dapat dimulai, dijeda, dilanjutkan, dan direset.'], ['UI', 'Tema terang dan gelap konsisten.'], ['Responsivitas', 'Halaman tidak overflow pada lebar 360 px.'], ['Aksesibilitas', 'Alur utama dapat dioperasikan dengan keyboard.'], ['Penyimpanan', 'Data sesi tetap ada setelah reload.'], ['Penanganan error', 'Kegagalan simpan mempertahankan isian.'], ['Animasi', 'Reduced motion menghapus gerakan dekoratif.'], ['Ekspor dan impor', 'Backup dapat dipulihkan dengan isi setara.']]) add('acceptance', { name, category, verification: 'Verifikasi manual dan pengujian otomatis sesuai skenario.' })
  add('decisions', { name: 'Penyimpanan lokal', decision: 'Gunakan IndexedDB tanpa akun.', reason: 'MVP pribadi harus bekerja offline dan tidak memerlukan server.', date: new Date().toISOString().slice(0, 10), section: 'Data & penyimpanan' })
  add('questions', { name: 'Perlu notifikasi suara saat sesi berakhir?', detail: 'Tentukan bersama pengguna sebelum implementasi.', status: 'Belum terjawab' })
  p.changeSummary = 'Versi contoh awal untuk memperagakan editor dan ekspor.'
  sections.forEach(s => { p.sectionStatus[s.key] = 'Draf' })
  return p
}
