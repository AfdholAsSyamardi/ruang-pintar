export function extractYouTubeId(rawUrl) {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname
      .replace(/^(www\.|m\.|music\.)/i, "")
      .toLowerCase();

    let candidate = null;

    if (host === "youtu.be") {
      candidate = parsed.pathname.split("/").filter(Boolean)[0] || null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        candidate = parsed.searchParams.get("v");
      } else {
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live", "v"].includes(segments[0])) {
          candidate = segments[1] || null;
        }
      }
    }

    if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
      return candidate;
    }

    return null;
  } catch {
    return null;
  }
}

export function extractYouTubeIdsFromText(text) {
  if (!text) return [];

  const matches = String(text).match(/https?:\/\/[^\s]+/gi) || [];
  const seen = new Set();

  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;:!?)]+$/, "");
    const videoId = extractYouTubeId(cleaned);
    if (videoId) {
      seen.add(videoId);
    }
  }

  return Array.from(seen);
}
