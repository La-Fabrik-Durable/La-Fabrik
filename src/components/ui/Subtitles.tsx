import { useSettingsStore } from "@/managers/stores/useSettingsStore";

export type SubtitleSpeaker = "Narrateur" | "Fermier" | "Leonie";

interface SubtitlesProps {
  speaker?: SubtitleSpeaker | null;
  text?: string | null;
}

export function Subtitles({
  speaker = null,
  text = null,
}: SubtitlesProps): React.JSX.Element | null {
  const subtitlesEnabled = useSettingsStore((state) => state.subtitlesEnabled);
  const content = text?.trim();

  if (!subtitlesEnabled || !content) return null;

  return (
    <div className="subtitles" aria-live="polite">
      <p>
        {speaker ? (
          <span
            className={`subtitles__speaker subtitles__speaker--${speaker.toLowerCase()}`}
          >
            {speaker}:
          </span>
        ) : null}
        {content}
      </p>
    </div>
  );
}
