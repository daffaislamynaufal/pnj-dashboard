# 🎓 PNJ Academic Dashboard (E-Learning Moodle 5.x Integration + AI Assistant)

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-orange?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

**PNJ Academic Dashboard** adalah personal academic operating system untuk mahasiswa **Politeknik Negeri Jakarta (PNJ)**. Terhubung secara native dan aman ke Moodle 5.x (`https://elearning.pnj.ac.id/`) dengan arsitektur **Local-First (Dexie IndexedDB)**, tampilan **Neo-Brutalist**, serta terintegrasi dengan **AI Study Assistant (DeepSeek)**.

---

## ✨ Fitur Utama

- ⚡ **API-First Multi-Tier Moodle Connector**:
  - Sinkronisasi langsung ke Moodle via AJAX & REST WebService (`core_course_get_contents`, `core_calendar_get_action_events_by_timesort`).
  - Penanganan CSRF `logintoken` & cookie sesi `MoodleSession` secara aman di Next.js API Routes.
- ⏱️ **Live Countdown & Priority Matrix**:
  - Live ticking countdown per detik pada setiap tugas.
  - Pengelompokan urgensi: 🔴 **Critical (<24h)**, 🟠 **Urgent (<3d)**, 🟡 **Upcoming (<7d)**, 🟢 **Safe (>7d)**.
  - Fitur **Atur Tenggat Manual** jika dosen tidak menyetel batas waktu di Moodle.
- 🤖 **AI Study Assistant (DeepSeek Free API)**:
  - Generator rencana belajar harian otomatis berdasarkan deadline tugas aktif.
  - Konsultasi materi dan tips praktikum.
- 💾 **Local-First & Offline Mode**:
  - Menggunakan **Dexie.js (IndexedDB)**. Data tersimpan di browser mahasiswa.
  - Tetap dapat diakses meski koneksi internet atau server Moodle kampus sedang *down*.
  - Ekspor/Impor data backup format JSON.
- 🎨 **Neo-Brutalist Design Identity**:
  - High-contrast Neo-Brutalist UI (`3px solid #000`, `4px 4px 0px #000`, aksen *Safety Orange*).
  - Mode Gelap (Dark Mode) kontras tinggi.
  - Responsif di Desktop & Mobile (Bottom Navigation).
  - Web Audio API Sound Effects.

---

## 📂 Struktur Proyek

```bash
├── app/
│   ├── api/
│   │   ├── ai/assistant/route.ts      # AI Assistant endpoint (DeepSeek)
│   │   ├── moodle/auth/login/route.ts # Moodle authentication proxy
│   │   ├── moodle/sync/route.ts       # Moodle data synchronizer
│   │   └── moodle/debug/discover/     # Moodle diagnostic endpoint
│   ├── assignments/page.tsx           # Halaman tugas & deadline
│   ├── courses/page.tsx               # Halaman daftar mata kuliah
│   ├── calendar/page.tsx              # Halaman kalender & agenda
│   ├── quizzes/page.tsx               # Halaman kuis & evaluasi
│   ├── announcements/page.tsx         # Halaman pengumuman kampus
│   ├── notifications/page.tsx         # Halaman pusat notifikasi
│   ├── settings/page.tsx              # Halaman backup & pengaturan
│   ├── login/page.tsx                 # Halaman login E-Learning PNJ
│   └── page.tsx                       # Dashboard overview
├── components/
│   ├── layout/                        # Header, Sidebar, BottomNav, OfflineBanner
│   ├── dashboard/                     # StatGrid, PriorityTaskList, TodayAgenda
│   ├── assignments/                   # SetDeadlineModal
│   └── ui/                            # NeoCard, NeoButton, NeoBadge, LiveCountdown
├── lib/
│   ├── moodle/                        # Moodle client, auth, config, parser, normalizer
│   ├── storage/                       # Dexie IndexedDB & sync engine
│   ├── ai/                            # DeepSeek AI service
│   └── utils/                         # Priority engine & sound synthesizer
└── types/                             # TypeScript data contracts & models
```

---

## 🚀 Menjalankan Secara Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/daffaislamynaufal/pnj-dashboard.git
   cd pnj-dashboard
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka **`http://localhost:3000`** di browser Anda.

---

## 🌐 Deploy ke Vercel

Aplikasi ini sudah dioptimalkan untuk Vercel:

1. Push repositori ini ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/) dan klik **Add New Project**.
3. Import repositori `daffaislamynaufal/pnj-dashboard`.
4. Framework Preset: **Next.js**.
5. Klik **Deploy**!

---

## 🔒 Privasi & Keamanan

- **Local-First**: Kredensial dan data akademik disimpan di IndexedDB browser Anda.
- **Serverless**: Tidak ada password yang disimpan ke database eksternal manapun.

---

*Dikembangkan untuk Mahasiswa Politeknik Negeri Jakarta (PNJ).*
