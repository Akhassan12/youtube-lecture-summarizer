# 🎓 YouTube Lecture Summarizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenRouter](https://img.shields.io/badge/AI_Engine-OpenRouter-6366F1)](https://openrouter.ai/)

An intelligent web application that automatically extracts subtitles from any YouTube lecture or video and generates clear, structured, academic-grade summaries and key takeaways using **OpenRouter** AI models (such as **NVIDIA Nemotron 3 Ultra 550B**).

---

## ✨ Features

- **Instant Subtitle Extraction**: Automatically extracts transcripts and captions from YouTube videos (supports standard URLs, `youtu.be` links, and Shorts).
- **Structured AI Summaries**: Generates high-quality summaries with an executive overview, core concepts, and key takeaways.
- **Multi-Language Support**: Summarize videos in English, Spanish, French, German, Simplified Chinese, and Japanese.
- **Reliable AI Fallbacks**: Built-in fallback chain across frontier models (Nemotron, Llama 3.3, Mistral) to handle rate limits and service peaks smoothly.
- **Clean & Responsive UI**: Modern design built with Next.js 15, Tailwind CSS, with light and dark mode support.

---

## 🛠️ Tech Stack

- **Frontend & Backend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Transcript Engine**: [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) (via `yt-dlp-exec`)
- **AI Engine**: [OpenRouter](https://openrouter.ai/) (`nvidia/nemotron-3-ultra-550b-a55b:free`, `meta-llama/llama-3.3-70b-instruct:free`)

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: `v18.0.0` or higher
- **OpenRouter API Key**: Get a free API key at [openrouter.ai](https://openrouter.ai/)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Akhassan12/youtube-lecture-summarizer.git
cd youtube-lecture-summarizer
npm install
```

> **Note**: On Windows, `npm install` automatically downloads the necessary `yt-dlp` executable. If you are on Linux or macOS, install `yt-dlp` globally via your package manager (`brew install yt-dlp` or `sudo apt install yt-dlp`).

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your OpenRouter API key and optional configuration:

```env
# OpenRouter API Key (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# AI Model Selection (Optional - defaults to NVIDIA Nemotron 3 Ultra)
AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free

# Optional: Custom yt-dlp executable path (auto-detected by default)
# YT_DLP_PATH=C:\yt-dlp\yt-dlp.exe
```

### 4. Run the Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How to Use

1. **Paste Link**: Paste any public YouTube video or lecture link into the input field.
2. **Select Language**: Pick the target language for the summary.
3. **Get Transcript**: Click **Get Transcript** to extract and summarize.
4. **Review Results**: Read the clean transcript and structured AI summary.

---

## 🌐 Supported Languages

| Language | Code |
| :--- | :--- |
| English | `en` |
| Spanish | `es` |
| French | `fr` |
| German | `de` |
| Chinese (Simplified) | `zh-Hans` |
| Japanese | `ja` |

---

## 🔧 Troubleshooting

- **Missing Subtitles**: Ensure the video has closed captions (CC) or auto-generated subtitles available on YouTube.
- **API Key Missing**: Verify that `OPENROUTER_API_KEY` is present in your `.env` file, and restart the development server (`npm run dev`).
- **yt-dlp Not Found**: On Linux or macOS, make sure `yt-dlp` is installed on your system or specify its path in `YT_DLP_PATH`.

---

## 👤 Author

- **Ali Hassan Kadri**
- Email: [hasanqadri1990@gmail.com](mailto:hasanqadri1990@gmail.com)
- GitHub: [@Akhassan12](https://github.com/Akhassan12)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
