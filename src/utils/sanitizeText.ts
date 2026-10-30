/**
 * Safely parses and sanitizes user-provided rich text for form descriptions.
 * Permits formatting tags: <b>, <strong>, <i>, <em>, <u>, <span>, <p>, <br>, <div>.
 * Also parses markdown shortcuts (**bold**, *italic*, _italic_, ~underline~).
 */
export function sanitizeFormattedText(input: string): string {
  if (!input) return '';

  // 1. Strip scripts, styles, iframes, and dangerous event handlers
  let clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // 2. Convert markdown bold (**text** or __text__)
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  clean = clean.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 3. Convert markdown italic (*text* or _text_)
  clean = clean.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  clean = clean.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // 4. Convert markdown underline (~text~)
  clean = clean.replace(/~([^~]+)~/g, '<u>$1</u>');

  return clean;
}

