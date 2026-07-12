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
  metadataBase: new URL('https://akku-clipgen.onrender.com'),
  title: 'Akku ClipGen — Anime Video Clip Generator',
  description:
    'Upload any long video and instantly split it into equal-duration clips. Download each segment as MP4 or MP3 with one click. High-performance local video/audio cropper and segmenter.',
  keywords: ['video splitter', 'clip generator', 'anime video cropper', 'MP4 splitter', 'MP3 converter', 'browser video editor', 'Akku ClipGen'],
  authors: [{ name: 'Akku ClipGen' }],
  creator: 'Akku ClipGen',
  publisher: 'Akku ClipGen',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Akku ClipGen — Anime Video Clip Generator',
    description: 'Instantly split long videos into equal-duration clips. Download segments as MP4 or MP3 with one click right in your browser.',
    url: 'https://akku-clipgen.onrender.com',
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
    title: 'Akku ClipGen — Anime Video Clip Generator',
    description: 'Instantly split long videos into equal-duration clips. Download segments as MP4 or MP3 with one click.',
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
