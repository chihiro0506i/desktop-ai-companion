import type { CharacterImages, PetEmotion } from "../types/pet";

export const petEmotions: PetEmotion[] = [
  "idle",
  "thinking",
  "talking",
  "happy",
  "confused",
  "sleepy",
  "concerned"
];

export const petEmotionLabels: Record<PetEmotion, string> = {
  idle: "通常",
  thinking: "考え中",
  talking: "会話中",
  happy: "うれしい",
  confused: "困惑",
  sleepy: "眠い",
  concerned: "心配"
};

export function createEmptyCharacterImages(value = ""): CharacterImages {
  return {
    idle: value,
    thinking: value,
    talking: value,
    happy: value,
    confused: value,
    sleepy: value,
    concerned: value
  };
}

export function mergeCharacterImages(
  images: Partial<CharacterImages> | undefined,
  fallback = ""
): CharacterImages {
  return {
    ...createEmptyCharacterImages(fallback),
    ...(images ?? {})
  };
}

export function normalizeImageSource(value: string): string {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed) || /^file:\/\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return `file:///${trimmed.replaceAll("\\", "/")}`;
  }

  return "";
}

export function getCharacterImage(images: CharacterImages, emotion: PetEmotion): string {
  return images[emotion] || images.idle || "";
}
