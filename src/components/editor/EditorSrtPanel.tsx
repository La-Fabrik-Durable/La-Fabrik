import { useEffect, useState } from "react";
import { Download, RefreshCw, Save } from "lucide-react";
import type { SubtitleLanguage } from "@/managers/stores/useSettingsStore";
import type {
  DialogueSpeaker,
  DialogueVoiceId,
} from "@/types/dialogues/dialogues";

interface SrtVoiceOption {
  id: DialogueVoiceId;
  label: DialogueSpeaker;
}

const SRT_VOICES: SrtVoiceOption[] = [
  { id: "narrateur", label: "Narrateur" },
  { id: "fermier", label: "Fermier" },
  { id: "electricienne", label: "Electricienne" },
];
const DEFAULT_SRT_VOICE: SrtVoiceOption = {
  id: "narrateur",
  label: "Narrateur",
};

const SRT_LANGUAGES: SubtitleLanguage[] = ["fr", "en"];

function getSrtPath(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
): string {
  return `/sounds/dialogue/subtitles/${language}/${voice}.srt`;
}

function createEmptySrtTemplate(speaker: DialogueSpeaker): string {
  return `1\n00:00:00,000 --> 00:00:02,000\n${speaker}: Nouveau sous-titre\n`;
}

function downloadSrtFile(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
  content: string,
): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${voice}.${language}.srt`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function saveSrtFile(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
  content: string,
): Promise<void> {
  const response = await fetch("/api/save-srt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice, language, content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Sauvegarde SRT impossible");
  }
}

export function EditorSrtPanel(): React.JSX.Element {
  const [voice, setVoice] = useState<DialogueVoiceId>("narrateur");
  const [language, setLanguage] = useState<SubtitleLanguage>("fr");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Chargement du SRT...");
  const [isSaving, setIsSaving] = useState(false);
  const selectedVoice =
    SRT_VOICES.find((item) => item.id === voice) ?? DEFAULT_SRT_VOICE;

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    setStatus("Sauvegarde du SRT...");

    try {
      await saveSrtFile(voice, language, content);
      setStatus(`Sauvegarde dans ${getSrtPath(voice, language)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(`${message}. Utilise Export SRT si le serveur dev est absent.`);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    const srtPath = getSrtPath(voice, language);

    void fetch(srtPath)
      .then(async (response) => {
        if (!mounted) return;

        if (!response.ok) {
          setContent(createEmptySrtTemplate(selectedVoice.label));
          setStatus("Fichier absent, template local cree");
          return;
        }

        setContent(await response.text());
        setStatus(`Charge depuis ${srtPath}`);
      })
      .catch(() => {
        if (!mounted) return;
        setContent(createEmptySrtTemplate(selectedVoice.label));
        setStatus("Erreur de chargement, template local cree");
      });

    return () => {
      mounted = false;
    };
  }, [language, selectedVoice.label, voice]);

  return (
    <section className="editor-srt-section" aria-labelledby="srt-heading">
      <div className="editor-section-heading">
        <h3 id="srt-heading">SRT</h3>
        <span>{language.toUpperCase()}</span>
      </div>

      <div className="editor-srt-controls">
        <label>
          Voix
          <select
            value={voice}
            onChange={(event) =>
              setVoice(event.target.value as DialogueVoiceId)
            }
          >
            {SRT_VOICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Langue
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as SubtitleLanguage)
            }
          >
            {SRT_LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        className="editor-srt-textarea"
        value={content}
        spellCheck={false}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        aria-label="SRT content"
      />

      <div className="editor-srt-actions">
        <button
          className="editor-action-button"
          type="button"
          onClick={() =>
            setContent(createEmptySrtTemplate(selectedVoice.label))
          }
        >
          <RefreshCw size={15} aria-hidden="true" />
          Template
        </button>
        <button
          className="editor-action-button editor-action-button-primary"
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
        >
          <Save size={15} aria-hidden="true" />
          {isSaving ? "Saving..." : "Save SRT"}
        </button>
        <button
          className="editor-action-button"
          type="button"
          onClick={() => downloadSrtFile(voice, language, content)}
        >
          <Download size={15} aria-hidden="true" />
          Export SRT
        </button>
      </div>

      <p className="editor-srt-status">{status}</p>
    </section>
  );
}
