"use client";

import { useState } from "react";
import { extractYouTubeIdsFromText } from "@/lib/youtube";

export default function ContentTextareaWithPreview({
  defaultValue = "",
  rows = 10,
  placeholder = "",
}) {
  const [content, setContent] = useState(defaultValue);
  const youtubeIds = extractYouTubeIdsFromText(content);

  return (
    <div className="space-y-3">
      <textarea
        name="content"
        rows={rows}
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <p className="text-xs text-slate-500">
        Tips: Tempel link YouTube (contoh:{" "}
        <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
          https://www.youtube.com/watch?v=...
        </code>{" "}
        atau{" "}
        <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
          https://youtu.be/...
        </code>
        ) di dalam isi materi untuk menampilkan video yang dapat langsung diputar
        siswa.
      </p>

      {youtubeIds.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            Pratinjau Video YouTube ({youtubeIds.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {youtubeIds.map((videoId) => (
              <div
                key={videoId}
                className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`Preview Video YouTube ${videoId}`}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
