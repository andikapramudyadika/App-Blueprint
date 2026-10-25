# Verifikasi App Blueprint

Tanggal: **25 Oktober 2026 (Asia/Makassar)**.

## Perbaikan batas token OpenRouter

- Batas awal keluaran dinaikkan dari 4.096 menjadi 16.384 token, dengan pilihan 4.096 / 8.192 / 16.384 / 32.768 pada pengaturan dan waktu tunggu 180 detik. Prompt meminta usulan ringkas.
- Pengujian otomatis: **69/69 lulus**. Regresi mencakup keluaran kosong/null/JSON lengkap dengan `finish_reason: length`, pencatatan penggunaan dan biaya pada respons terpotong, proyek tidak berubah, penolakan batas token tidak valid, percobaan ulang manual memakai batas baru, dan tidak ada percobaan ulang otomatis.
- `pnpm build` berhasil, termasuk pemeriksaan TypeScript dan pembuatan service worker. Peringatan anotasi komentar Zod tetap berasal dari dependensi.
- Panggilan model berbayar tidak dijalankan; respons API dalam pengujian memakai transport tiruan. Verifikasi lokal selesai sebelum penerbitan; hasil penerbitan GitHub Pages tersedia pada workflow `Deploy GitHub Pages` di tab Actions.

## Pemeriksaan otomatis

- Instalasi dengan `pnpm 11.25.0 install --frozen-lockfile`: berhasil setelah menyesuaikan `allowBuilds` untuk esbuild dengan konfigurasi pnpm 11.
- Pemeriksaan TypeScript: berhasil tanpa error.
- Vitest: **31 dari 31 pengujian lulus**.
- Build produksi Vite: berhasil. Manifest, PNG/SVG ikon, service worker, dan precache 16 aset dihasilkan. Rollup memberi peringatan anotasi komentar pada dependensi Zod; build tetap berhasil.

Pengujian mencakup skema proyek dan backup, penolakan JSON rusak/struktur salah/versi tak didukung/ID ganda, round-trip seluruh field, duplikasi ID dan referensi internal, referensi yang terhapus, status manual, 10 aturan kelengkapan, heuristik kata kabur, ekspor seluruh detail, Markdown dengan karakter khusus dan pagar kode, nama file aman, isi 9 file ZIP, prompt MVP/tahap, persistensi IndexedDB, duplikasi/penghapusan, transaksi pemulihan, snapshot autosave, urutan penulisan, dan pemulihan antrean setelah gagal simpan.

## Pemeriksaan browser yang dilakukan

Menggunakan browser dalam aplikasi, pada server development dan **build produksi** lokal:

| Skenario | Hasil |
| --- | --- |
| Buat proyek dan edit ringkasan/fitur | Berhasil |
| Berpindah bagian segera setelah edit | Isian tersimpan |
| Reload lalu buka kembali proyek | Data terbaru tetap tersedia |
| Ekspor Markdown segera setelah edit | File yang diunduh memuat perubahan terbaru dan detail fitur |
| Ekspor ZIP dari browser | 9 file yang diminta tersedia; APP_SPEC.md memuat edit terakhir |
| Backup dari dalam ZIP | JSON berhasil divalidasi dan dipakai untuk pemulihan |
| Duplikasi melalui menu kartu | Salinan baru muncul; referensi internal juga diverifikasi lewat unit test |
| Impor JSON rusak | Pesan error tampil; proyek lama tetap ada |
| Impor JSON valid | Ringkasan tampil dahulu; pilihan default membuat salinan; jumlah proyek bertambah tanpa menimpa |
| Hapus salinan uji | Konfirmasi menyebut nama; hanya proyek yang dipilih dihapus |
| Layout desktop 1440 × 960 | Sidebar, editor, dan panel pratinjau terlihat; tidak ada overflow horizontal |
| Layout ponsel 390 × 844 dan 360 × 800 | Satu kolom; tidak ada overflow horizontal pada dashboard; editor juga diperiksa di 390 px |
| Navigasi ponsel dan dialog | Escape menutup; fokus kembali ke pemicu |
| Mode gelap | Dashboard/editor dapat dipakai dan terlihat pada ponsel |
| Lab motion | Tombol dan modal bekerja; tab dan kartu tersedia dari komponen interaktif |
| Prompt tahap | Pemilih tahap tersedia; generator diuji otomatis |
| Cache offline | **Server lokal dihentikan**, lalu reload berhasil; proyek tetap ada dan navigasi/lab tombol tetap berfungsi dari service worker |

Screenshot: [desktop](docs/desktop.png), [ponsel](docs/mobile.png).

## Batas verifikasi

- Tidak mengklaim pengukuran 60 fps, audit aksesibilitas penuh, atau pengujian lintas browser/perangkat fisik.
- Aturan CSS `prefers-reduced-motion` dan penggunaan MotionConfig/useReducedMotion diperiksa pada kode. Preferensi OS tidak diubah selama pengujian.
- Pembaruan service worker memakai mekanisme prompt, tetapi siklus upgrade dua versi tidak disimulasikan.
- Instalasi PWA pada perangkat fisik tidak dilakukan. Reload dari cache diuji dengan mematikan server asal, bukan memutus seluruh koneksi internet perangkat.
- Akses clipboard otomatis pada browser pengujian tidak dapat diverifikasi. Aplikasi menangani kegagalan clipboard dengan pesan dan menyediakan unduhan prompt sebagai alternatif.
- Kondisi kuota disk penuh tidak dipaksakan pada browser pengguna. Kegagalan penulisan dan pemulihan antrean diuji dengan writer yang sengaja gagal.
- Workflow GitHub CI disertakan; hasil CI jarak jauh terpisah dari hasil lokal ini.

## Perbaikan deployment GitHub Pages

- Diagnosis: halaman publik menyajikan `index.html` pengembangan dari root repositori. Skrip `/src/main.tsx` menghasilkan HTTP 404 sehingga aplikasi tidak dirender.
- Source Pages diubah dari “Deploy from a branch” menjadi “GitHub Actions”. Workflow `Deploy GitHub Pages` memverifikasi kode, membangun dengan base `/App-Blueprint/`, dan mengunggah folder `dist`.
- Build khusus Pages berhasil, termasuk service worker dan manifest. Pemeriksaan `scripts/check-pages-build.mjs` memverifikasi entry point produksi, 9 referensi aset di subpath yang benar, dan aset PWA wajib. Sebanyak 31 pengujian tetap lulus.
- Hasil deployment publik dapat diperiksa pada tab Actions, workflow `Deploy GitHub Pages`.

## Mode Terpandu & OpenRouter

- TypeScript lulus; **60 dari 60 pengujian lulus** (31 pengujian awal dan 29 pengujian tambahan).
- Pengujian tambahan mencakup kompatibilitas backup lama, pemetaan ke editor yang sama, acuan awal, penerapan pilihan sebagai draf, validasi field/opsi, larangan perubahan ID/checklist, duplikasi ID pertanyaan, ekspor metadata panduan, redaksi key yang salah ditempel ke konteks, serta penolakan respons kedaluwarsa.
- Transport OpenRouter diuji dengan fetch tiruan: header kredensial pada endpoint tetap, Structured Outputs, pembatasan provider, tidak ada persistensi/serialisasi key, error 401/402/429/503 yang tidak membocorkan isi respons, timeout tanpa retry, pemutusan koneksi, pembatalan, dan invalidasi respons terlambat. Key dicabut (401/403) menghapus koneksi sesi.
- Pemeriksaan browser pada aplikasi sebenarnya: proyek manual, penyimpanan acuan, penambahan fitur, perpindahan Mode Terpandu ↔ Editor Lanjutan, autosave, serta reload dan pemulihan tahap/isian berhasil.
- Harness lokal memakai komponen produksi dengan transport tiruan: usulan tidak mengubah proyek sebelum diterapkan; penerapan terpilih, undo, pertanyaan kontekstual dan penerapan jawaban, tinjauan konflik acuan, pembatalan, penolakan field ilegal, dan respons lama setelah edit berhasil. Reload menghapus koneksi sesi.
- Pada viewport **360 × 800**, keenam langkah, panel AI, dan dialog pengaturan tidak memiliki overflow horizontal. Screenshot: [ponsel](docs/guided-mobile.png), [desktop](docs/guided-desktop.png).
- API key berbayar tidak disediakan selama verifikasi. Tidak ada klaim keberhasilan inferensi pada provider berbayar; alur respons AI diuji dengan transport tiruan. Ketersediaan model/provider dan kebijakan akun dapat memengaruhi panggilan sebenarnya.
