import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueVoice,
} from "@/types/dialogues/dialogues";
import type { SubtitleLanguage } from "@/managers/stores/useSettingsStore";
import { parseDialogueManifest } from "@/utils/dialogues/dialogueManifestValidation";

const DIALOGUE_MANIFEST_PATH = "/sounds/dialogue/dialogues.json";
const DEFAULT_SUBTITLE_LANGUAGE: SubtitleLanguage = "fr";

export async function loadDialogueManifest(): Promise<DialogueManifest | null> {
  const response = await fetch(DIALOGUE_MANIFEST_PATH);

  if (!response.ok) {
    return null;
  }

  return parseDialogueManifest(await response.json());
}

export function resolveDialogueSubtitlePath(
  manifest: DialogueManifest,
  dialogue: DialogueDefinition,
  language: SubtitleLanguage,
): string | null {
  const voice = getDialogueVoice(manifest, dialogue.voice);
  if (!voice) return null;

  return getVoiceSubtitlePath(voice, language);
}

export function getDialogueVoice(
  manifest: DialogueManifest,
  voiceId: DialogueDefinition["voice"],
): DialogueVoice | null {
  return manifest.voices.find((voice) => voice.id === voiceId) ?? null;
}

function getVoiceSubtitlePath(
  voice: DialogueVoice,
  language: SubtitleLanguage,
): string | null {
  return (
    voice.subtitles[language] ??
    voice.subtitles[DEFAULT_SUBTITLE_LANGUAGE] ??
    null
  );
}
