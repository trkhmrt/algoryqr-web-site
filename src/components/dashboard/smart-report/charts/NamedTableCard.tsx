"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NamedTableCard({
  title,
  value,
  columns,
  rows,
}: {
  title: string;
  value?: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <CardTitle className="min-w-0 text-sm font-semibold leading-5">{title}</CardTitle>
        {value ? (
          <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-[11px] text-muted-foreground">
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`pb-1.5 font-medium ${index === 0 ? "text-left" : "text-right"}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                  Bu dönemde kayıt yok.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row[0] ?? "row"}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${cell}-${cellIndex}`}
                      className={`py-1.5 ${cellIndex === 0 ? "truncate text-left text-foreground" : "text-right tabular-nums text-foreground"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
