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

    // Run yt-dlp to download subtitles in the requested language
    const command = `${ytDlpPath} --extractor-args "youtube:player_client=android,ios,web" --write-sub --write-auto-sub --sub-lang ${lang} --skip-download --output "%(id)s" "${videoUrl}"`;
    console.log("🚀 Running command:", command);

    const { stdout, stderr } = await execPromise(command);
    console.log("📜 yt-dlp stdout:", stdout);
    if (stderr) console.error("⚠️ yt-dlp stderr:", stderr);

    // Locate downloaded subtitles file
    let subtitleFile = path.resolve(`./${videoId}.${lang}.vtt`);
    if (!fs.existsSync(subtitleFile)) {
      // Look for any subtitle file matching the video ID in current directory
      const candidates = fs.readdirSync("./").filter((f) => f.startsWith(videoId) && f.endsWith(".vtt"));
      if (candidates.length > 0) {
        subtitleFile = path.resolve(`./${candidates[0]}`);
      }
    }

    if (!fs.existsSync(subtitleFile)) {
      console.error(`❌ No subtitles found for language: ${lang}`);
      return NextResponse.json({ error: `No subtitles found for language: ${lang}` }, { status: 404 });
    }

    // Read and clean up subtitles
    let subtitles = fs.readFileSync(subtitleFile, "utf8");
    try {
      fs.unlinkSync(subtitleFile); // Delete file after reading
    } catch {
      // Ignore deletion failure
    }

    // Remove timestamps and metadata
    subtitles = subtitles
      .split("\n")
      .filter((line) => !line.startsWith("WEBVTT") && !line.match(/\d{2}:\d{2}:\d{2}/)) // Remove timestamps
      .map((line) => line.trim())
      .filter((line, index, self) => line && self.indexOf(line) === index) // Remove duplicate lines
      .join(" ");

    console.log("📝 Transcript Extracted!");

    // ✅ OpenRouter configuration
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing OpenRouter API Key!");
      return NextResponse.json(
        { error: "API key missing. Please set OPENROUTER_API_KEY or OPENAI_API_KEY in .env" },
        { status: 500 }
      );
    }

    const model = process.env.AI_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
    console.log(`🤖 Requesting summary from OpenRouter using model: ${model}...`);

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "YouTube Lecture Summarizer",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an expert academic tutor and lecture summarizer. Provide a concise, well-structured summary of this YouTube lecture with key takeaways and clear bullet points (In this Language: ${lang}).`,
          },
          { role: "user", content: subtitles },
        ],
        max_tokens: 1500,
      }),
    });

    const aiData = await openRouterResponse.json();

    if (!openRouterResponse.ok || !aiData.choices) {
      console.error("❌ OpenRouter API Error:", aiData);
      const errDetail = aiData?.error?.message || aiData?.message || "Failed to generate summary with OpenRouter.";
      return NextResponse.json({ error: errDetail, details: aiData }, { status: 500 });
    }

    const summary = aiData.choices?.[0]?.message?.content || "No summary available.";

    console.log("📝 Summary Generated!");
    console.log("📜 Final API Response:", JSON.stringify({ transcriptLength: subtitles.length, summaryPreview: summary.slice(0, 100) }, null, 2));

    return NextResponse.json({ transcript: subtitles, summary, language: lang });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
