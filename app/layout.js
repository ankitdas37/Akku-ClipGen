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
  title: 'Akku ClipGen — Free AI Video Clipper & Shorts Generator',
  description: 'Upload any long video and instantly split it into viral shorts or equal-duration clips. Download segments as MP4 or MP3 fast. No watermark, high-performance browser video cropper.',
  keywords: [
    'video splitter', 'clip generator', 'anime video cropper', 'MP4 splitter', 
    'MP3 converter', 'browser video editor', 'YouTube Shorts maker', 
    'TikTok clip maker', 'AI video clipper', 'free video cutter', 'Akku ClipGen'
  ],
  authors: [{ name: 'Akku ClipGen' }],
  creator: 'Akku ClipGen',
  publisher: 'Akku ClipGen',
  alternates: {
    canonical: 'https://akku-clipgen.onrender.com',
  },
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
    title: 'Akku ClipGen — Free AI Video Clipper & Shorts Generator',
    description: 'Instantly split long videos into clips. Download segments as MP4 or MP3 with one click right in your browser.',
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
    title: 'Akku ClipGen — Free Video Clipper',
    description: 'Instantly split long videos into clips. Download segments as MP4 or MP3 with one click.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }) {
  // Schema.org Structured Data for Google (SoftwareApplication)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Akku ClipGen',
    operatingSystem: 'Any',
    applicationCategory: 'MultimediaApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'A fast, high-performance web application that instantly splits long videos into smaller MP4 clips or MP3 audio tracks directly in the browser.',
    url: 'https://akku-clipgen.onrender.com',
  };

  return (
    <html lang="en" className={`${orbitron.variable} ${nunito.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
