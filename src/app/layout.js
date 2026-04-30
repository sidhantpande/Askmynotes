import "./globals.css";

export const metadata = {
  title: "AskMyNotes | Subject-Scoped AI Study Copilot",
  description: "Stop asking general AI. Ask your notes. The AI tutor that actually knows your curriculum, provides citations, and prevents hallucinations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
