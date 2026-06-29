/** Skeleton de tabel afișat în timpul încărcării listelor. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div
                    className="skeleton"
                    style={{ height: 14, width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '55%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
