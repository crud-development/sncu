/** Afișează un document HTML (din template) într-un iframe izolat. */
export function DocFrame({ html, height = 460 }: { html?: string; height?: number }) {
  if (html === undefined) {
    return (
      <div className="skeleton" style={{ height, borderRadius: 12 }} />
    );
  }
  return (
    <iframe
      title="Document"
      srcDoc={html}
      style={{
        width: '100%',
        height,
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: '#fff',
      }}
    />
  );
}
