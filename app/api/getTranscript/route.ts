import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execPromise = promisify(exec);

function getYtDlpPath(): string {
  if (process.env.YT_DLP_PATH && fs.existsSync(process.env.YT_DLP_PATH)) {
    return `"${process.env.YT_DLP_PATH}"`;
  }
  const localBin = path.resolve("./node_modules/yt-dlp-exec/bin/yt-dlp.exe");
  if (fs.existsSync(localBin)) {
    return `"${localBin}"`;
  }
  const defaultCustom = "C:\\yt-dlp\\yt-dlp.exe";
  if (fs.existsSync(defaultCustom)) {
    return `"${defaultCustom}"`;
  }
  return "yt-dlp";
}

function extractVideoId(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    if (parsed.pathname.includes("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1]?.split("?")[0] || null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log("✅ API was hit! Processing request...");

    const { videoUrl, lang = "en" } = await req.json();
    console.log(`🎯 Requested Language: ${lang}`);

    if (!videoUrl) {
      console.error("❌ No video URL provided!");
      return NextResponse.json({ error: "Missing video URL" }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.error("❌ Could not extract video ID!");
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const ytDlpPath = getYtDlpPath();

    // Run yt-dlp with --ignore-errors and sub-lang fallback (${lang}, original audio captions .*-orig, and all)
    // This ensures that if YouTube returns HTTP 429 on auto-translated captions, it gracefully falls back to the native transcript
    const command = `${ytDlpPath} --ignore-errors --write-auto-sub --sub-lang "${lang},${lang}-.*,.*-orig" --skip-download --output "%(id)s" "${videoUrl}"`;
    console.log("🚀 Running command:", command);

    try {
      const { stdout, stderr } = await execPromise(command);
      console.log("📜 yt-dlp stdout:", stdout);
      if (stderr) console.warn("⚠️ yt-dlp stderr:", stderr);
    } catch (execErr: any) {
      console.warn("⚠️ yt-dlp completed with warnings (inspecting downloaded files):", execErr?.message || execErr);
    }

    // Locate downloaded subtitles file: prioritize requested language, then native language, then any matching .vtt
    const allFiles = fs.readdirSync("./");
    const matchingFiles = allFiles.filter((f) => f.startsWith(videoId) && f.endsWith(".vtt"));

    let targetFile = matchingFiles.find((f) => f === `${videoId}.${lang}.vtt`)
      || matchingFiles.find((f) => f.startsWith(`${videoId}.${lang}`))
      || matchingFiles.find((f) => f.includes("orig"))
      || matchingFiles[0];

    if (!targetFile) {
      console.error(`❌ No subtitles found for video ID: ${videoId}`);
      return NextResponse.json(
        {
          error: "Could not retrieve subtitles for this video. YouTube may have blocked automated requests (HTTP 429) or captions are unavailable.",
        },
        { status: 404 }
      );
    }

    const subtitleFilePath = path.resolve(`./${targetFile}`);
    console.log(`📄 Using subtitle file: ${targetFile}`);

    // Read and clean up subtitles
    let subtitles = fs.readFileSync(subtitleFilePath, "utf8");
    try {
      // Clean up all matching .vtt files for this video
      matchingFiles.forEach((f) => {
        try { fs.unlinkSync(path.resolve(`./${f}`)); } catch {}
      });
    } catch {
      // Ignore deletion failure
    }

    // Remove timestamps, HTML/formatting tags, and metadata
    subtitles = subtitles
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed &&
          !trimmed.startsWith("WEBVTT") &&
          !trimmed.startsWith("Kind:") &&
          !trimmed.startsWith("Language:") &&
          !trimmed.match(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/)
        );
      })
      .map((line) => line.replace(/<[^>]+>/g, "").trim()) // Strip inline cue tags like <00:00:00.160><c>
      .filter((line, index, self) => line && self.indexOf(line) === index) // Remove duplicate lines
      .join(" ");

    if (!subtitles || subtitles.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript was empty or could not be parsed." },
        { status: 422 }
      );
    }

    console.log(`📝 Transcript Extracted! Length: ${subtitles.length} characters`);

    // ✅ OpenRouter configuration
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing OpenRouter API Key!");
      return NextResponse.json(
        { error: "API key missing. Please set OPENROUTER_API_KEY or OPENAI_API_KEY in .env" },
        { status: 500 }
      );
    }

    const primaryModel = process.env.AI_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
    // OpenRouter fallback chain: up to 3 free frontier models
    const fallbackModels = [
      primaryModel,
      "meta-llama/llama-3.3-70b-instruct:free",
      "mistralai/mistral-small-24b-instruct-2501:free",
    ].filter((m, i, arr) => arr.indexOf(m) === i).slice(0, 3);

    console.log(`🤖 Requesting summary from OpenRouter using model chain:`, fallbackModels);

    let aiData: any = null;
    let openRouterResponse: Response | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🚀 Sending OpenRouter request (attempt ${attempt}/${maxRetries})...`);

      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "YouTube Lecture Summarizer",
        },
        body: JSON.stringify({
          model: primaryModel,
          models: fallbackModels,
          messages: [
            {
              role: "system",
              content: `You are an expert academic tutor and lecture summarizer. The following is a raw transcript from a YouTube video or lecture (which may be in the original spoken audio language). Provide a comprehensive, well-structured summary featuring:
- An Executive Overview
- Key Concepts & Core Takeaways
- Structured Bullet Points
Produce and write the entire summary strictly in this requested language: ${lang}.`,
            },
            { role: "user", content: subtitles.slice(0, 45000) },
          ],
          max_tokens: 1500,
        }),
      });

      aiData = await openRouterResponse.json();

      if (openRouterResponse.ok && aiData.choices?.length > 0) {
        break;
      }

      const errMsg = aiData?.error?.message?.toLowerCase() || "";
      const isOverloaded =
        aiData?.error?.code === 503 ||
        aiData?.error?.code === 429 ||
        errMsg.includes("overloaded") ||
        errMsg.includes("rate limit");

      if (isOverloaded && attempt < maxRetries) {
        console.warn(`⚠️ Upstream provider overloaded. Retrying in 2.5s...`);
        await new Promise((res) => setTimeout(res, 2500));
      }
    }

    if (!openRouterResponse?.ok || !aiData?.choices) {
      console.error("❌ OpenRouter API Error:", aiData);
      const errDetail = aiData?.error?.message || aiData?.message || "Failed to generate summary with OpenRouter.";
      return NextResponse.json({ error: errDetail, details: aiData }, { status: 500 });
    }

    const summary = aiData.choices?.[0]?.message?.content || "No summary available.";
    const activeModel = aiData?.model || primaryModel;

    console.log(`📝 Summary Generated by model: ${activeModel}!`);
    console.log("📜 Final API Response:", JSON.stringify({ model: activeModel, transcriptLength: subtitles.length, summaryPreview: summary.slice(0, 100) }, null, 2));

    return NextResponse.json({ transcript: subtitles, summary, language: lang, model: activeModel });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
