/** Only reviewed recordings may play. The rejected eSpeak batch is blocked,
 * including when a browser still has an earlier content response cached. */
export function narrationAvailable(path: string) {
  return Boolean(path) && !path.startsWith("assets/voice/");
}
