import type { ReactNode } from 'react';

type GridColumn<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type StyledGridProps<T> = {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  emptyMessage?: string;
};

function StyledGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'Nenhum registro encontrado.',
}: StyledGridProps<T>) {
  if (rows.length === 0) {
    return <p className="grid-empty-message">{emptyMessage}</p>;
  }

  return (
    <div className="styled-grid-wrapper">
      <table className="styled-grid">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column) => {
                const cellValue = row[column.key];
                return (
                  <td key={String(column.key)}>
                    {column.render ? column.render(cellValue, row) : String(cellValue ?? '-')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StyledGrid;
