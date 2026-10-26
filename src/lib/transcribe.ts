import type { TranscriptSegment } from "../models/transcription.model.js";

interface TranscribeItem {
    type: "pronunciation" | "punctuation";
    start_time?: string;
    end_time?: string;
    speaker_label?: string;
    alternatives: { content: string }[];
}

export function parseTranscribeOutput(json: any): { fullText: string; segments: TranscriptSegment[] } {
    const fullText: string = json.results.transcripts[0]?.transcript ?? "";
    const items: TranscribeItem[] = json.results.items;

    const segments: TranscriptSegment[] = [];
    let current: TranscriptSegment | null = null;
    let lastSpeaker = "spk_0";

    for (const item of items) {
        const word = item.alternatives[0]?.content ?? "";

        if (item.type === "punctuation") {
            if (current) current.text += word;
            continue;
        }

        const speaker = item.speaker_label ?? lastSpeaker;
        const startMs = Math.round(Number(item.start_time) * 1000);
        const endMs = Math.round(Number(item.end_time) * 1000);

        if (!current || current.speaker !== speaker) {
            current = { speaker, startMs, endMs, text: word };
            segments.push(current);
        } else {
            current.text += ` ${word}`;
            current.endMs = endMs;
        }
        lastSpeaker = speaker;
    }

    return { fullText, segments };
}
