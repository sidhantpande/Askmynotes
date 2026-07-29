<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-FF6B6B" />
  <img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase" />
  <img src="https://img.shields.io/badge/LangChain-RAG-1C3C3C" />
</p>

# 📚 AskMyNotes — Subject-Scoped AI Study Copilot

🚀 **Live Demo**: [https://askmynotes-algorise.vercel.app](https://askmynotes-algorise.vercel.app)

> [!IMPORTANT]
> **Note**: Responses may occasionally fail with a "something went wrong" message due to the daily 20-request quota limit of the Gemini API free tier.

> **Stop asking general AI. Ask your notes.**  
> The AI tutor that actually knows your curriculum, provides citations, and prevents hallucinations.

AskMyNotes is a full-stack RAG (Retrieval-Augmented Generation) study app built with **Next.js 16**, **Gemini 2.0 Flash**, **ChromaDB**, and **Supabase Auth**. Upload your lecture notes (PDF or text), and get an AI copilot that answers questions **only from your material** — with confidence scores, citations, and source snippets.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | Supabase email/password authentication with middleware-protected routes |
| 📄 **PDF & Text Upload** | Upload study material (PDF or paste text) — chunked and embedded into ChromaDB |
| 💬 **RAG Chat** | Ask questions and get answers grounded in your notes with confidence badges and citations |
| 📚 **Study Mode** | Generate **MCQs** (5) or **Short Q&A** (3) directly from your uploaded material |
| 🎙️ **AI Voice Assistant** | Speak your questions and hear AI answers using Web Speech API |
| 💾 **Chat Persistence** | Chat history saved per subject via localStorage — survives page reloads |
| 🌗 **Dark / Light Mode** | Full theme toggle with smooth transitions |
| 👤 **Profile Modal** | View user profile with study stats |
| 🎨 **Premium UI** | Glassmorphism, gradient accents, micro-animations, Bricolage Grotesque font |

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   Gemini     │     │   Supabase   │
│   Frontend   │     │   2.0 Flash  │     │   Auth       │
│   (App Router)│     │   (LLM +     │     │              │
│              │     │   Embeddings)│     │              │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│   ChromaDB   │
│   Vector     │
│   Store      │
│  (Persisted) │
└──────────────┘
```

### How RAG Works

1. **Upload** → PDF/text is chunked (500 chars, 50 overlap) → embedded via Gemini → stored in ChromaDB with `{userId, subject}` metadata
2. **Ask** → Question is embedded → top-k similar chunks retrieved (filtered by user + subject) → Gemini generates answer with citations
3. **Study** → Context chunks retrieved → Gemini generates MCQs or short-answer questions grounded in the material

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ask/route.js          # RAG Q&A endpoint
│   │   ├── study/route.js        # MCQ & Short Q&A generator
│   │   └── upload/route.js       # PDF/text upload + chunking + embedding
│   ├── auth/
│   │   ├── actions.js            # Supabase login/signup/logout server actions
│   │   ├── auth.css              # Auth page styles
│   │   └── page.js               # Login / Sign-up page
│   ├── dashboard/
│   │   ├── dashboard.css         # Dashboard styles (incl. voice assistant)
│   │   └── page.jsx              # Dashboard with subjects, AI tools, voice panel
│   ├── subject/[id]/
│   │   ├── page.jsx              # Subject page: upload, chat, study mode
│   │   └── subject.css           # Subject page styles
│   ├── globals.css               # Design system: tokens, components, animations
│   ├── layout.js                 # Root layout with Google Fonts
│   └── page.js                   # Landing page
├── components/
│   └── dashboard/
│       ├── Header.jsx            # Dashboard header with theme toggle
│       └── Sidebar.jsx           # Sidebar with workspace subjects
├── lib/
│   ├── gemini.js                 # Gemini LLM + embeddings singleton
│   └── vectorStore.js            # ChromaDB connection + collection management
├── utils/
│   └── supabase/
│       ├── client.js             # Browser Supabase client
│       └── server.js             # Server-side Supabase client
└── middleware.js                  # Auth route protection
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.8 (for ChromaDB)
- A **Google AI Studio** account ([aistudio.google.com](https://aistudio.google.com)) for the Gemini API key
- **Supabase CLI** for local auth and database via Docker

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/AskMyNotes.git
cd AskMyNotes
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is needed because `@langchain/community` expects `pdf-parse@2.x` as an optional peer, but we use `1.1.1` for Turbopack compatibility.

### 3. Install ChromaDB

```bash
pip install chromadb
```

### 4. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Local Supabase: run `supabase start` and paste the values from `supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_supabase_service_role_key

# Choose one AI provider
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key

# Or
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your_gemini_api_key

# ChromaDB persistence
CHROMA_DIR=./chroma_store
```

### 5. Start local Supabase

1. Install and start Docker Desktop
2. Run `npm run bootstrap:local`
3. Copy the `API URL`, `anon key`, and `service_role key` from `supabase status`
4. Paste them into `.env.local`

### 6. Start ChromaDB

```bash
chroma run --host 0.0.0.0 --port 8000 --path /tmp/chroma_data
```

> ChromaDB will persist data at `/tmp/chroma_data`. Change the path if you want a permanent location.

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

---

## 🧪 Usage Guide

### 1. Sign Up / Log In
Navigate to `/auth` and create an account with email and password.

### 2. Create a Subject
From the dashboard, click **Create Subject** and give it a name (e.g., "Physics", "Biology").

### 3. Upload Material
Click on a subject → choose **Paste Text** or **Upload PDF** → your material is chunked, embedded, and stored.

### 4. Ask Questions
Type a question in the chat bar. The AI will answer using only your uploaded notes, showing:
- **Confidence badge** (High / Medium / Low)
- **Citations** (file name + chunk ID)
- **Supporting snippets** (collapsible)

### 5. Study Mode
Click the 📚 button in the prompt bar → choose:
- **MCQ Practice** → 5 multiple-choice questions with explanations
- **Short Q&A** → 3 short-answer questions with answers

### 6. Voice Assistant
From the dashboard, click the **AI Voice Assistant** card → select a subject → tap the mic → speak your question → hear the AI response.

---

## 🔧 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Upload PDF/text, chunk, embed, store in ChromaDB |
| `/api/ask` | POST | RAG query — retrieve relevant chunks + generate answer |
| `/api/study` | POST | Generate MCQs (`type: "mcq"`) or short Q&A (`type: "short"`) |

All routes are **auth-gated** — they verify the Supabase session and scope queries by `userId` + `subject`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | JavaScript (React 19) |
| **LLM** | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| **Embeddings** | Google Gemini Embedding (`text-embedding-004`) |
| **Vector Store** | ChromaDB (persistent, self-hosted) |
| **Auth** | Supabase (email/password) |
| **PDF Parsing** | pdf-parse v1.1.1 |
| **Text Splitting** | LangChain RecursiveCharacterTextSplitter |
| **Styling** | Vanilla CSS (glassmorphism, dark mode) |
| **Font** | Bricolage Grotesque (Google Fonts) |

---

## ⚠️ Troubleshooting

### PDF upload fails
- Make sure ChromaDB is running (`chroma run ...`)
- Check that `pdf-parse` is v1.1.1: `npm ls pdf-parse`
- Clear the `.next` cache: `rm -rf .next && npm run dev`

### "Unauthorized" errors
- Verify your Supabase keys in `.env.local`
- Make sure you're logged in (session cookies must be present)

### "No notes found" in study mode
- Upload material to the subject first before generating study questions

### Voice assistant not working
- Use **Chrome** — `SpeechRecognition` API is not supported in all browsers
- Allow microphone permissions when prompted

---

## 📄 License

MIT

---

# Askmynotes
