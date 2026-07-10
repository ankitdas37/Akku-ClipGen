<div align="center">
  
![Akku ClipGen Banner](./public/anime_banner.png)

# 🌸 AKKU CLIPGEN 🌸
`✦ ─── ⋆ 💮 ⋆ ─── ✦`

**A high-performance local video/audio cropper and segmenter styled with a premium Cyber-Neon Anime aesthetic.**

🌐 **[Live Demo / Deployment Link](https://akku-clipgen.onrender.com/)** &nbsp; • &nbsp; 💻 **[GitHub Repository](https://github.com/ankitdas37/Akku-ClipGen)**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-100%25_Private-654FF0?style=for-the-badge&logo=webassembly)](https://webassembly.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg.wasm-In_Browser-007808?style=for-the-badge&logo=ffmpeg)](https://ffmpeg.wasm.dev/)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()

</div>

<br />

> Designed for rapid content generation, it utilizes WebAssembly via `@ffmpeg/ffmpeg` to clip videos directly inside your browser. No server uploads required, ensuring 100% privacy and zero file size limits!

<div align="center">
  <img src="./public/logo.png" alt="Akku ClipGen Logo" width="220" height="220" style="border-radius: 50%; border: 4px solid #22d3ee; box-shadow: 0 0 25px rgba(34,211,238,0.6); margin: 25px 0;" />
</div>

---

## 🎐 What is Akku ClipGen?

**Akku ClipGen** is a modern, anime-themed web application built for creators to instantly cut, crop, and generate segments from large video files. It leverages **WebAssembly** to handle gigabytes of video entirely inside the browser's memory, meaning **$0 server costs**, 100% free Vercel deployment, and unparalleled privacy.

### ✨ Key Features

| Feature | Description |
| :--- | :--- |
| ⚡ **In-Browser WebAssembly** | Uses `@ffmpeg/ffmpeg` to process video on the client side. **No 4.5MB upload limits**, no server timeouts. The video never leaves your computer! |
| 🚀 **100% Free Hosting** | Since the backend does zero heavy lifting, you can host this for free forever on Vercel without ever needing a credit card. |
| 🎨 **Anime Cyber-Design** | Interactive canvas particles, glassmorphic interfaces, dynamic micro-animations, and curated HSL neon themes. |
| 📧 **Contact Center** | Fully functional contact page with local storage persistence and automated email notifications via Nodemailer. |
| 🛡️ **Multi-Admin Dashboard**| A secure command center to view, reply, and manage messages. Support for multiple secondary admin accounts. |

### 🤯 How "Unlimited GB Uploads" Work (The WebAssembly Magic)

Traditional video editing websites require you to **upload** your video to their server. If you upload a 2GB video, it takes a long time, consumes massive server bandwidth, and gets blocked by free hosting providers like Vercel (which have a strict 4.5MB upload limit).

**Akku ClipGen bypasses this completely using WebAssembly (`@ffmpeg/ffmpeg`):**
1. **Unlimited File Sizes:** The video **never** uploads to any server. It stays 100% on the user's device, meaning you can process 1GB or even 5GB videos instantly.
2. **Virtual Memory:** The app downloads a tiny `ffmpeg-core.wasm` engine into your browser. Your browser then creates a *Virtual File System* (MEMFS) in your RAM.
3. **Local Processing:** The video is loaded directly from your storage into this virtual memory. Your own device's CPU runs the exact same video-cutting commands a powerful server would run.
4. **Instant Download:** Once the clip is generated, the browser creates a "Blob URL" (a temporary link pointing to your own RAM). When you click download, it saves instantly with zero network delay.
5. **📱 Does this work on Mobile? YES!** WebAssembly is supported on all modern mobile browsers (Safari on iOS, Chrome on Android). Users can split massive videos directly from their phone's camera roll without needing to download a separate app. The processing happens securely and locally on their smartphone's CPU!

Because your backend server does absolutely zero work, you can process massive gigabyte videos instantly, and host the website for **100% free**!

### 🧹 How Automatic Memory Cleanup Works
When dealing with massive video files in the browser, RAM management is critical. Akku ClipGen uses a three-tier automatic garbage collection system to ensure the user's computer never runs out of memory:

1. **WebAssembly Virtual Memory (MEMFS) Cleanup:** While `ffmpeg.wasm` is generating clips, it creates temporary files inside a Virtual File System within the browser's RAM. As soon as a clip finishes generating, the app executes `ffmpeg.deleteFile()` to instantly flush the raw video data out of the WebAssembly heap.
2. **Blob Revocation (Web API):** When a clip is ready for download, it is converted into a `Blob URL` (a DOM reference to raw binary data in RAM). If the user clicks "Remove Video" or starts over, the app executes `URL.revokeObjectURL()`. This native Web API forcefully destroys the reference, allowing the browser to instantly reclaim gigabytes of RAM.
3. **V8 Engine Garbage Collection:** If the user completely closes the tab or refreshes the page, the browser's internal JavaScript Garbage Collector (e.g., Chrome's V8 engine) automatically flushes all remaining Blobs and WebAssembly memory instances, ensuring a completely clean slate.

---

<details>
<summary><b>🛠️ Click to Expand: Technology Stack Used</b></summary>
<br/>

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| ⚛️ **[Next.js 14.2](https://nextjs.org/)** | Framework | React framework for server-side rendering, routing, and full-stack architecture. |
| 🌐 **[FFmpeg.wasm](https://ffmpeg.wasm.dev/)** | Engine | The core WebAssembly engine used to process video entirely inside the user's browser. |
| ✉️ **[Nodemailer](https://nodemailer.com/)**| Emails | Used for sending automated email notifications directly from the backend via SMTP. |
| 🎨 **Vanilla CSS** | Styling | Custom Properties (Variables) to create the dynamic glassmorphic and glowing cyber-neon themes. |
| 💾 **Local Persistence**| Database | Node.js `fs` module to store admin/contact data locally (Note: serverless environments may reset this data). |

</details>

---

<details>
<summary><b>🔐 Click to Expand: Security Mechanisms</b></summary>
<br/>

Akku ClipGen implements modern security practices to protect the Admin Dashboard:

* 🔑 **Stateless Token Authentication:** Uses the **Web Crypto API (HMAC-SHA256)** to cryptographically sign session tokens, verifying users securely on the edge middleware.
* 🛡️ **Next.js Edge Middleware:** Intercepts any request to `/admin` routes, validating the HMAC signature before granting access.
* 🍪 **HttpOnly Session Cookies:** Stores the session token in an `HttpOnly` cookie, rendering it completely inaccessible to client-side JavaScript and blocking XSS attacks.
* ⏳ **Anti-Brute Force Delay:** Implements a synthetic `800ms` delay on failed login attempts to dramatically slow down automated password guessing attacks.
* 🔒 **Secondary Admin Hashing:** Passwords for additional admins are irreversibly hashed using **SHA-256** before being saved to the local database.

</details>

---

## 🚀 How to Setup and Run

If you want to clone this project or set it up on a new machine, follow these simple steps:

### 1. Summon the Source Code
Download or clone the repository to your new machine.
Ensure you have **[Node.js](https://nodejs.org/)** installed (v18+ recommended).

### 2. Install the Components
Open your terminal, navigate into the downloaded folder, and run:
```bash
npm install
```

### 3. Setup the Security Seals (Environment Variables)
Create a `.env.local` file in the root folder and add the following configuration:
```env
# ── Admin Panel Credentials ──
ADMIN_USERNAME=admin
ADMIN_PASSWORD=1234
ADMIN_SECRET=your-super-long-secret-key-change-this

# ── Email / SMTP Configuration ──
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=your-email@gmail.com
```

> [!NOTE]
> **📧 How to Setup Gmail SMTP (App Passwords)**
> To allow the application to send emails from your Gmail account, you must generate an **App Password**:
> 1. Go to your [Google Account Security settings](https://myaccount.google.com/security).
> 2. Ensure **2-Step Verification** is turned on.
> 3. Search for **"App Passwords"** in the top search bar of your Google account.
> 4. Create a new App Password (name it "Akku ClipGen").
> 5. Copy the 16-character password generated and paste it as your `SMTP_PASS` in the `.env.local` file (no spaces).
> 6. Set both `SMTP_USER` and `ADMIN_EMAIL` to your Gmail address.

### 4. Cast the Dev Server
Launch the application:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

<details>
<summary><b>📂 Click to Expand: Project Architecture</b></summary>
<br/>

```text
Akku ClipGen/
├── app/
│   ├── admin/                # 🛡️ Admin command dashboard & Multi-admin panel
│   │   ├── login/            # Anime style login console
│   │   └── page.js           # Admin messages reader & replies
│   ├── api/
│   │   ├── admin/            # Session & Admin management API
│   │   └── messages/         # Message retrieval & creation API
│   ├── components/           # 🎨 Interactive UI elements (Client-side FFmpeg)
│   ├── contact/              # 📧 Customer feedback panel
│   ├── globals.css           # 🎨 Core design token system
│   ├── layout.js             # HTML layout wrapper
│   └── page.js               # 🏠 Main workspace page
├── tmp/                      # 💾 Local storage for JSON Admin DB
├── middleware.js             # 🛡️ Authentication Edge middleware
└── package.json              # Project dependencies
```

</details>

---

## 💫 Developed By

<div align="center">

<img src="./Image/ankit.jpg" alt="Ankit Das Developer Avatar" width="160" height="160" style="border-radius: 50%; border: 4px solid #ff69b4; box-shadow: 0 0 20px rgba(255,105,180,0.6); object-fit: cover; margin-bottom: 15px;" />

### Ankit Das
**Developer 🚀**

*Passionate about building magical, beautiful, and high-performance web applications! 🌸*

### 🤝 Connect With Me

<p align="center">
<a href="mailto:ankitdas082006@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
<a href="https://www.linkedin.com/in/akku-clip-gen-8106b12ba/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
<a href="https://www.instagram.com/the.ankit.das"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a>
<a href="https://x.com/AnkitDa01860054"><img src="https://img.shields.io/badge/Twitter/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="Twitter/X" /></a>
</p>

<br/>

`✦ ─── ⋆ 🌸 ⋆ ─── ✦`


</div>
