export const ROMAJI_INPUT_EVENT = 'typenihongo:romaji-input';

export function normalizeRomajiCharacter(value) {
  const character = String(value ?? '').toLowerCase();

  return /^[a-z]$/.test(character) ? character : null;
}

export function emitRomajiInput(character, target = globalThis.window) {
  const normalizedCharacter = normalizeRomajiCharacter(character);

  if (!normalizedCharacter || !target?.dispatchEvent || typeof CustomEvent === 'undefined') {
    return false;
  }

  target.dispatchEvent(
    new CustomEvent(ROMAJI_INPUT_EVENT, {
      detail: { character: normalizedCharacter },
    }),
  );

  return true;
}
