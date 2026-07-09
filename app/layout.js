import { Orbitron, Nunito } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '600', '700', '800', '900'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'Akku ClipGen — Anime Video Clip Generator',
  description:
    'Upload any long video and instantly split it into equal-duration clips. Download each segment as MP4 or MP3 with one click. Powered by Akku ClipGen.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Akku ClipGen',
    description: 'High-performance local video/audio cropper and segmenter with a Cyber-Neon Anime aesthetic.',
    url: 'https://akku-clip-gen.vercel.app',
    siteName: 'Akku ClipGen',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Akku ClipGen Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akku ClipGen',
    description: 'High-performance local video/audio cropper and segmenter.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
