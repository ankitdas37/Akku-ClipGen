/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow native Node packages to run server-side only
  experimental: {
    serverComponentsExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg'],
  },

  // ── Security / cross-origin headers ────────────────────────────────────
  // COOP + COEP are required for SharedArrayBuffer (multi-threaded FFmpeg WASM).
  // They are safe on Railway because Railway does NOT use a shared-origin CDN.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
