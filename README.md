# 🌸 AKKU CLIPGEN 🌸
`✦ ─── ⋆ 💮 ⋆ ─── ✦`

Welcome to **Akku ClipGen** — a high-performance local video/audio cropper and segmenter styled with a premium Cyber-Neon Anime aesthetic. 

Designed for rapid content generation, it utilizes zero-loss stream copying via `ffmpeg` to clip videos in a fraction of a second, wrapped in a beautiful, interactive visual dashboard.

```
                    _  _             ____ _ _pHGen 
    /\  |__/|__/|  |  |  |  |       / ___| (_)  _ \ 
   /  \ |  \|  \|__|__|__|__|      | |   | | | |_) |
  / /\ \|  \|  \           _       | |___| | |  __/ 
 /_/  \_\__\__\__\        (_)       \____|_|_|_|    
```

---

## 🎐 Features & Magic Powers

### ⚡ Zero-Loss Stream Clipping
Unlike ordinary editors that re-encode and degrade output quality, **Akku ClipGen** invokes native `ffmpeg` with stream copying (`-c copy`).
* **Instant processing:** A 1-hour video can be split into chunks in seconds.
* **Lossless quality:** The video and audio streams are copied bit-for-bit.
* **Versatile format support:** Works with `MP4`, `MKV`, `AVI`, `MOV`, `WebM`, `FLV`, and more.

### 🎨 Premium Anime Cyber-Design
* **Interactive Canvas Particles:** Moving glowing nodes that react to mouse hover.
* **Glassmorphic Interfaces:** Transparent dark layout panels styled with curated HSL color systems.
* **Dynamic Animations:** Micro-interactions, custom scrollbars, glowing input borders, and responsive layouts.

### 📧 Anime Contact Center (`/contact`)
* A custom interactive contact page for users to submit feedback and suggestions.
* Stored locally in a secure storage file (`tmp/data/messages.json`).
* Styled FAQ accordion panel with clean animations.

### 🛡️ Secure Admin Inbox Command Center (`/admin`)
* **Next.js Edge Middleware Protection:** Intercepts `/admin` and checks authorization before loading.
* **Web Crypto API (HMAC-SHA256):** Standard token signing for Session Authentication.
* **HttpOnly Session Cookies:** Restricts JS access to security tokens, blocking XSS leaks.
* **Failed Attempt Delay:** Prevents brute-force attempts with built-in response throttling.
* **Reply Engine:** Real-time email pre-fill generator or local thread responder.

---

## 🛠️ The Tech Alchemy (Stack)

* **Framework:** Next.js 14.2 (App Router)
* **Backend Utilities:** `fluent-ffmpeg`, `ffmpeg-static`, `multer`, `uuid`
* **Security:** Web Crypto API (`crypto.subtle`)
* **Styling:** Custom CSS Custom Properties (Variables) with Vanilla CSS (Theme colors: Sakura 🌸, Violet 🔮, Cyan 💎, Gold ⚜️)
* **Database:** Local JSON File Persistence (`tmp/data/messages.json`)

---

## 🚀 Running the Ritual (Installation)

### 1. Summon the Source Code
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install the Components
Run the following command in the project root to fetch dependencies:
```bash
npm install
```

### 3. Setup the Security Seal
Create a `.env.local` file in the root folder (automatically ignored by Git):
```env
# ── Admin Panel Credentials ──
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Akku@2024
ADMIN_SECRET=your-super-long-secret-key-change-this
```

### 4. Cast the Dev Server
Launch the development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
Akku ClipGen/
├── app/
│   ├── admin/                # 🛡️ Admin command dashboard
│   │   ├── login/
│   │   │   └── page.js       # Anime style login console
│   │   └── page.js           # Admin messages reader & replies
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/        # Session cookie generation API
│   │   │   └── logout/       # Session deletion API
│   │   ├── messages/
│   │   │   ├── reply/        # Message reply submission API
│   │   │   └── route.js      # Message retrieval & creation API
│   │   └── cleanup/          # File maintenance endpoint
│   ├── components/           # 🎨 Interactive UI elements
│   │   ├── ClipConfigurator.js
│   │   ├── ClipGrid.js
│   │   ├── Footer.js         # Navigation footer
│   │   ├── ParticleBackground.js # Interactive canvas
│   │   └── UploadZone.js     # Drag-and-drop zone
│   ├── contact/
│   │   └── page.js           # 📧 Customer feedback panel
│   ├── globals.css           # 🎨 Core design token system
│   ├── layout.js             # HTML layout wrapper
│   └── page.js               # 🏠 Main workspace page
├── tmp/                      # 💾 Local storage & message database
├── middleware.js             # 🛡️ Authentication middleware
├── package.json              # Project manifests
└── README.md                 # 🎐 The Grimoire (This file)
```

---

## 🌸 Admin Credentials Default
By default, the application is pre-configured with the following credentials (defined in your local `.env.local` file):
* **Username:** `admin`
* **Password:** `Akku@2024`

*To change these, simply update your `.env.local` values.*

---

## 💫 Developed By
Created with 💖 by **Ankit Das**.

* 📧 **Email:** [ankitdas@gmail.com](mailto:ankitdas@gmail.com)
* 💬 **WhatsApp:** [+91 9339840967](https://wa.me/919339840967)
* 🐙 **GitHub:** [github.com/ankitdas37](https://github.com/ankitdas37)
* 📸 **Instagram:** [@the.ankit.das](https://www.instagram.com/the.ankit.das)
* 🐦 **Twitter / X:** [@AnkitDa01860054](https://x.com/AnkitDa01860054)

`✦ ─── ⋆ 🌸 ⋆ ─── ✦`
*May your clips render instantly and your styling stay cybernetic!*
