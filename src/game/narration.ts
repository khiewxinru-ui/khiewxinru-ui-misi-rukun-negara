/** Play file recordings only; retired eSpeak paths stay blocked even in cached content. */
export function narrationAvailable(path: string) {
  return Boolean(path) && !path.startsWith("assets/voice/");
}
