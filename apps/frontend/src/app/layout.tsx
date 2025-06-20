import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '../contexts/AppContext';
import { SimpleToastProvider } from '../components/toast/SimpleToastProvider';

export const metadata: Metadata = {
  title: {
    default: 'Emotion Recognition System',
    template: '%s | Emotion Recognition System',
  },
  description: 'AI-powered real-time emotion detection for e-commerce personalization. Analyze emotions and get personalized product recommendations.',
  keywords: [
    'emotion recognition',
    'AI',
    'machine learning',
    'e-commerce',
    'personalization',
    'product recommendations',
    'facial emotion detection',
    'computer vision',
  ],
  authors: [{ name: 'Emotion Recognition Team' }],
  creator: 'Emotion Recognition System',
  publisher: 'Emotion Recognition System',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    title: 'Emotion Recognition System',
    description: 'AI-powered real-time emotion detection for e-commerce personalization',
    siteName: 'Emotion Recognition System',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emotion Recognition System',
    description: 'AI-powered real-time emotion detection for e-commerce personalization',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        <SimpleToastProvider>
          <AppProvider>
            <div id="root">
              {children}
            </div>
          </AppProvider>
        </SimpleToastProvider>
        <div id="modal-root" />
      </body>
    </html>
  );
}
