import axios from 'axios';

const cache = new Map<string, { text: string; at: number }>();
const htmlCache = new Map<string, { html: string; at: number }>();
const TTL = 10 * 60 * 1000; // 10 minute

/** Extrage ID-ul documentului dintr-un URL Google Docs. */
export function extractDocId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Preia conținutul text al unui Google Doc public (export ca .txt).
 * Returnează null dacă URL-ul e invalid, documentul nu e public sau apare o eroare.
 */
export async function fetchGoogleDocText(url: string): Promise<string | null> {
  const id = extractDocId(url);
  if (!id) return null;

  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < TTL) return cached.text;

  try {
    const res = await axios.get(
      `https://docs.google.com/document/d/${id}/export?format=txt`,
      { timeout: 10000, responseType: 'text' },
    );
    const text = String(res.data ?? '');
    // Documentul nepublic redirecționează către o pagină HTML de login.
    if (!text || /<!doctype html|<html/i.test(text.slice(0, 200))) return null;
    cache.set(id, { text, at: Date.now() });
    return text;
  } catch {
    return null;
  }
}

/**
 * Preia conținutul HTML al unui Google Doc public (export ca .html, păstrează
 * formatarea). Returnează null dacă nu e accesibil.
 */
export async function fetchGoogleDocHtml(url: string): Promise<string | null> {
  const id = extractDocId(url);
  if (!id) return null;

  const cached = htmlCache.get(id);
  if (cached && Date.now() - cached.at < TTL) return cached.html;

  try {
    const res = await axios.get(
      `https://docs.google.com/document/d/${id}/export?format=html`,
      { timeout: 12000, responseType: 'text' },
    );
    const html = String(res.data ?? '');
    // Pagina de login (doc nepublic) nu conține clasa doc-content.
    if (!html || !/doc-content|<body/i.test(html)) return null;
    htmlCache.set(id, { html, at: Date.now() });
    return html;
  } catch {
    return null;
  }
}

