import React from 'react';

const Table = ({
  headers = [],
  data = [],
  renderRow,
  className = '',
  id,
  title,
  role,
  'aria-label': ariaLabel
}) => {
  return (
    <div 
      className={`w-full overflow-x-auto rounded-[10px] border border-theme bg-surface shadow-sm ${className}`}
      id={id}
      title={title}
      role={role}
      aria-label={ariaLabel}
    >
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-md border-b border-theme z-10">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 font-manrope font-semibold text-xs tracking-wider text-theme-secondary uppercase border-b border-theme
                  ${header.align === 'right' ? 'text-right' : header.align === 'center' ? 'text-center' : 'text-left'}
                  ${header.className || ''}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-theme/40 font-inter text-sm">
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="hover:bg-slate-800/10 dark:hover:bg-slate-200/5 transition-colors even:bg-slate-800/5 dark:even:bg-slate-200/5"
              >
                {renderRow(row, rowIdx)}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-theme-secondary">
                No items available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
