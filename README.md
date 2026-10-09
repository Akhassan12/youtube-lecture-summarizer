# 🎓 AI YouTube Lecture Summarizer

An intelligent lecture summarizer that automatically extracts transcripts and subtitles from any YouTube video and generates structured, academic-grade summaries and key takeaways using **OpenRouter** and **NVIDIA Nemotron 3 Ultra (550B)**.

---

## ✨ Features

- **Automated Transcript Extraction**: Downloads and extracts subtitles from YouTube videos using built-in `yt-dlp` extraction with multi-client fallback (Android, iOS, Web).
- **Frontier AI Summarization**: Powered by **NVIDIA Nemotron 3 Ultra (550B-A55B)** via OpenRouter, delivering rich, structured summaries with key takeaways and concept breakdowns.
- **Multi-Language Support**: Extract and summarize lectures in multiple languages (English, Spanish, French, German, Japanese, Simplified Chinese).
- **Clean, Responsive Interface**: Built with Next.js 15, React 19, Tailwind CSS, and Shadcn UI with support for light and dark themes.
- **Reliable Fallbacks**: Automatic handling of YouTube anti-bot protections, missing subtitle fallbacks, and resilient URL formatting (supports standard, short `youtu.be`, and Shorts URLs).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, Lucide React Icons |
| **Subtitle Engine** | `yt-dlp` (via `yt-dlp-exec`) |
| **AI Engine** | OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`) |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **OpenRouter API Key**: Obtain a free key from [OpenRouter](https://openrouter.ai/)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/AI-Youtube-Lecture-Summarizer.git
cd AI-Youtube-Lecture-Summarizer
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# OpenRouter API Credentials
OPENROUTER_API_KEY=your_openrouter_api_key_here

# AI Model Selection
AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free

# Optional: Custom yt-dlp path (auto-detected by default)
# YT_DLP_PATH=C:\yt-dlp\yt-dlp.exe
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📖 How to Use

1. **Paste URL**: Paste any public YouTube lecture or video link into the input field.
2. **Select Language**: Pick the target language for the summary.
3. **Generate**: Click **Get Transcript**.
4. **Review**: View the raw transcript alongside the structured AI summary, complete with headings, key takeaways, and breakdown tables.

---

## 👤 Author & Contributor

- **Maintainer**: **Ali Hassan Kadri**
- **Email**: [hasanqadri1990@gmail.com](mailto:hasanqadri1990@gmail.com)
- **GitHub**: [Ali Hassan Kadri](https://github.com)

Contributions, issues, and feature requests are welcome!

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
