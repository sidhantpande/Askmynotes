import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata = {
  title: "AskMyNotes | Subject-Scoped AI Study Copilot",
  description: "Stop asking general AI. Ask your notes. The AI tutor that actually knows your curriculum, provides citations, and prevents hallucinations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={bricolage.variable}>
        {children}
      </body>
    </html>
  );
}
