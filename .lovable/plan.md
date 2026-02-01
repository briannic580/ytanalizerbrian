
# Implementasi: Performance Score, Comprehensive Report & YouTube Downloader

## Ringkasan

Mengimplementasikan 3 fitur utama:
1. **Performance-Based Scoring** - Title & Thumbnail score berdasarkan data views/likes
2. **Comprehensive Report Export** - PDF & CSV lengkap dengan gambar thumbnail
3. **YouTube Video Downloader** - Integrasi y2down.cc API untuk download video

---

## Bagian 1: Performance-Based Title & Thumbnail Score

### Konsep Baru

Score sekarang dihitung berdasarkan **performa aktual video** (views, likes, engagement), bukan hanya analisis teks.

**Logika:** Jika sebuah video dengan title/thumbnail tertentu mendapat banyak views dan likes, berarti title/thumbnail tersebut efektif.

### 1.1 Buat Service Baru: `performanceScoreService.ts`

```text
File: src/services/performanceScoreService.ts

Fungsi utama:
- calculatePerformanceScore(videos) - Hitung score untuk semua video
- getPercentile(value, allValues) - Hitung percentile posisi
- getTitlePerformanceScore(video, allVideos) - Score title berdasarkan performance
- getThumbnailPerformanceScore(video, allVideos) - Score thumbnail berdasarkan performance

Formula Title Score (0-100):
┌───────────────────────────────────────────────────┐
│ Component          │ Weight │ Source              │
├────────────────────┼────────┼─────────────────────┤
│ Views Percentile   │  35%   │ Position in channel │
│ Likes Percentile   │  25%   │ Position in channel │
│ ER Percentile      │  20%   │ Engagement rate     │
│ Text Quality       │  20%   │ Existing analysis   │
└────────────────────────────────────────────────────┘

Formula Thumbnail Score (0-100):
┌───────────────────────────────────────────────────┐
│ Component          │ Weight │ Source              │
├────────────────────┼────────┼─────────────────────┤
│ Views Percentile   │  40%   │ CTR proxy           │
│ ER Percentile      │  30%   │ Engagement quality  │
│ Recency Bonus      │  30%   │ Quick views = good  │
└────────────────────────────────────────────────────┘
```

### 1.2 Update Type Definitions

```text
File: src/types/index.ts

Tambah:
- interface PerformanceScore {
    totalScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    viewsPercentile: number;
    likesPercentile: number;
    erPercentile: number;
    textScore?: number;
    recencyBonus?: number;
  }

- interface VideoWithScores extends VideoItem {
    titleScore: PerformanceScore;
    thumbnailScore: PerformanceScore;
  }
```

### 1.3 Update TitleScoreAnalyzer Component

```text
File: src/components/TitleScoreAnalyzer.tsx

Perubahan:
1. Import performanceScoreService
2. Tambah tab untuk "Title Score" dan "Thumbnail Score"
3. Tampilkan breakdown score dengan:
   - Views Performance (bar chart)
   - Likes Performance (bar chart)
   - ER Performance (bar chart)
   - Text Quality (untuk title) / Recency (untuk thumbnail)
4. Ranking video berdasarkan score
5. Comparison table side-by-side
```

---

## Bagian 2: Comprehensive Report Export

### 2.1 PDF Report dengan Thumbnail Images

```text
File: src/services/pdfService.ts

Update generatePDFReport() untuk include:

PAGE 1: Cover & Summary
┌─────────────────────────────────────────────┐
│  YT ANALYZER PRO - CHANNEL ANALYSIS REPORT  │
│                                             │
│  Channel: [Channel Name]                    │
│  Generated: [Date Time]                     │
│  Videos Analyzed: [Count]                   │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Subs    │ │ Views   │ │ Videos  │       │
│  │ 1.2M    │ │ 50M     │ │ 500     │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘

PAGE 2-N: Top Videos dengan Thumbnail
┌─────────────────────────────────────────────┐
│  TOP PERFORMING VIDEOS                      │
│                                             │
│  #1 ┌────────┐ Title: [Video Title]        │
│     │ [THUMB]│ Views: 1.5M | Likes: 50K    │
│     │  IMG   │ ER: 5.2% | Duration: 10:30  │
│     └────────┘ Title Score: 85 (A)          │
│                Thumb Score: 78 (B)          │
│                                             │
│  #2 ┌────────┐ Title: [Video Title]        │
│     │ [THUMB]│ Views: 1.2M | Likes: 45K    │
│     │  IMG   │ ER: 4.8% | Duration: 8:45   │
│     └────────┘ Title Score: 72 (B)          │
│                Thumb Score: 81 (A)          │
└─────────────────────────────────────────────┘

PAGE N+1: Analytics Summary
- Engagement Distribution Chart
- Upload Schedule Heatmap Summary
- Content Gap Highlights
- Top 20 Tags

PAGE LAST: Recommendations
- Best performing content types
- Optimal upload times
- Title improvement suggestions
```

**Teknis untuk menambahkan gambar thumbnail ke PDF:**
```typescript
// Fetch thumbnail as base64
const fetchThumbnailAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

// Add to PDF
doc.addImage(base64Image, 'JPEG', x, y, width, height);
```

### 2.2 Comprehensive CSV Export

```text
File: src/services/exportService.ts

Fungsi baru: generateFullAnalysisCSV()

Kolom yang disertakan:
1.  No
2.  Title
3.  Video ID
4.  Video URL
5.  Thumbnail URL (dapat diklik/download)
6.  Channel Name
7.  Channel ID
8.  Duration (formatted)
9.  Duration (seconds)
10. Published Date
11. Published Time Ago
12. Views (raw)
13. Views (formatted)
14. Likes (raw)
15. Likes (formatted)
16. Comments (raw)
17. Comments (formatted)
18. Engagement Rate %
19. Title Score
20. Title Grade
21. Thumbnail Score
22. Thumbnail Grade
23. Tags (comma separated)
24. Is Short (Yes/No)
25. Is Outlier (Yes/No)
```

### 2.3 Buat Tombol Export Komprehensif

```text
File: src/pages/YouTubeAnalyzer.tsx

Tambah dropdown Export:
┌──────────────────────────┐
│ Export Report ▼          │
├──────────────────────────┤
│ 📄 PDF Full Report       │
│ 📊 CSV Basic             │
│ 📊 CSV Complete          │
│ 📈 Excel with Scores     │
└──────────────────────────┘
```

---

## Bagian 3: YouTube Video Downloader Integration

### 3.1 Buat Komponen VideoDownloader

```text
File: src/components/VideoDownloader.tsx

Props:
- videoUrl: string
- videoTitle: string
- isOpen: boolean
- onClose: () => void

Menggunakan y2down.cc Card API:
<iframe 
  src={`https://p.savenow.to/api/card2/?url=${encodeURIComponent(videoUrl)}`}
  style={{ width: '100%', height: '400px', border: 'none' }}
  allowFullScreen
/>

UI:
┌─────────────────────────────────────────────┐
│  Download Video                    [X]      │
│─────────────────────────────────────────────│
│  ┌─────────────────────────────────────────┐│
│  │                                         ││
│  │     y2down.cc Card API iframe           ││
│  │     (Auto-shows format options)         ││
│  │     - MP4 various resolutions           ││
│  │     - MP3 audio only                    ││
│  │     - WAV audio                         ││
│  │                                         ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Video: [Title truncated...]                │
│  Format options provided by y2down.cc       │
└─────────────────────────────────────────────┘
```

### 3.2 Buat Halaman Downloader Standalone

```text
File: src/components/DownloaderPage.tsx

Menggunakan y2down.cc Widget API:
- Full widget untuk search dan download
- User bisa paste URL YouTube apapun
- Support: MP4, MP3, WAV, berbagai resolusi

UI Layout:
┌─────────────────────────────────────────────┐
│  YouTube Video Downloader                   │
│  Download video dalam berbagai format       │
│─────────────────────────────────────────────│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │                                         ││
│  │     y2down.cc Widget API iframe         ││
│  │     (Full search + download widget)     ││
│  │                                         ││
│  │     Features:                           ││
│  │     - Paste any YouTube URL             ││
│  │     - Choose format (MP4/MP3/WAV)       ││
│  │     - Choose resolution                 ││
│  │     - Direct download                   ││
│  │                                         ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Supported: YouTube, TikTok, Instagram      │
└─────────────────────────────────────────────┘
```

### 3.3 Integrasi ke UI Existing

```text
1. VideoPreviewModal.tsx
   - Tambah tombol "Download Video" di action buttons
   - Klik -> buka VideoDownloader modal

2. AnimatedVideoCard.tsx
   - Tambah icon download di hover actions
   - Klik -> buka VideoDownloader modal

3. Sidebar.tsx
   - Tambah menu "Video Downloader" di section baru
   - Mode: 'downloader'

4. YouTubeAnalyzer.tsx
   - Handle mode 'downloader' -> render DownloaderPage
   - State untuk VideoDownloader modal
```

### 3.4 Update Types

```text
File: src/types/index.ts

Update AnalysisMode:
export type AnalysisMode = 
  'dashboard' | 'trending' | 'insights' | 'benchmark' | 
  'saved' | 'content_gap' | 'history' | 'schedule' | 
  'title_score' | 'downloader';  // <- BARU
```

---

## File yang Akan Dibuat

1. `src/services/performanceScoreService.ts` - Scoring berdasarkan performance
2. `src/components/VideoDownloader.tsx` - Modal download video
3. `src/components/DownloaderPage.tsx` - Halaman downloader standalone

## File yang Akan Dimodifikasi

1. `src/types/index.ts` - Tambah types baru
2. `src/services/pdfService.ts` - Comprehensive PDF dengan thumbnail
3. `src/services/exportService.ts` - Extended CSV export
4. `src/components/TitleScoreAnalyzer.tsx` - UI untuk performance + thumbnail score
5. `src/components/VideoPreviewModal.tsx` - Tambah download button
6. `src/components/AnimatedVideoCard.tsx` - Tambah download button
7. `src/components/Sidebar.tsx` - Tambah Downloader mode
8. `src/pages/YouTubeAnalyzer.tsx` - Integrasi semua fitur

---

## Urutan Implementasi

1. Update types/index.ts dengan types baru
2. Buat performanceScoreService.ts
3. Update TitleScoreAnalyzer dengan performance + thumbnail scoring
4. Update pdfService.ts dengan thumbnail images
5. Update exportService.ts dengan CSV lengkap
6. Buat VideoDownloader.tsx component
7. Buat DownloaderPage.tsx component
8. Update Sidebar dengan menu Downloader
9. Integrasi ke YouTubeAnalyzer dan modal/cards

---

## Catatan Teknis

### Thumbnail di PDF
- jsPDF mendukung addImage() untuk menambahkan gambar
- Perlu fetch thumbnail sebagai base64 terlebih dahulu
- Resize untuk optimize file size PDF

### y2down.cc API
- Menggunakan iframe embed (tidak perlu API key)
- Card API: Menampilkan info video + download options
- Widget API: Full search widget
- Support dark/light mode via CSS parameter

### Data Organization di Report
- Semua data diorganisir dalam tabel yang mudah dibaca
- Thumbnail ditampilkan sebagai gambar aktual (bukan hanya URL)
- Score dan grade ditampilkan dengan color coding
- Export CSV tetap menyertakan URL thumbnail untuk reference
