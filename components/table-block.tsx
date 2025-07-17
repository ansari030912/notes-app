"use client"

import { useState, useCallback, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import type { BlockData } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TableBlockProps {
  data?: BlockData
  onUpdate: (data: BlockData) => void
  onExit: () => void
}

export function TableBlock({ data, onUpdate, onExit }: TableBlockProps) {
  const [headers, setHeaders] = useState<string[]>(data?.headers || ["Column 1", "Column 2"])
  const [rows, setRows] = useState<string[][]>(
    data?.rows || [
      ["", ""],
      ["", ""],
    ],
  )

  // Sync data back to parent when headers / rows change
  useEffect(() => {
    onUpdate({ headers, rows })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, rows])

  const handleHeaderChange = useCallback((index: number, value: string) => {
    setHeaders((prev) => {
      const newHeaders = [...prev]
      newHeaders[index] = value
      return newHeaders
    })
  }, [])

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setRows((prev) => {
      const newRows = [...prev]
      newRows[rowIndex][colIndex] = value
      return newRows
    })
  }, [])

  const addColumn = useCallback(() => {
    setHeaders((prev) => [...prev, `Column ${prev.length + 1}`])
    setRows((prev) => prev.map((row) => [...row, ""]))
  }, [])

  const deleteColumn = useCallback((indexToDelete: number) => {
    setHeaders((prev) => prev.filter((_, index) => index !== indexToDelete))
    setRows((prev) => prev.map((row) => row.filter((_, index) => index !== indexToDelete)))
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, Array(headers.length).fill("")])
  }, [headers.length])

  const deleteRow = useCallback((indexToDelete: number) => {
    setRows((prev) => prev.filter((_, index) => index !== indexToDelete))
  }, [])

  return (
    <ScrollArea className="w-full border rounded-md">
      {" "}
      {/* Removed fixed height */}
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-gray-800">
            {headers.map((header, index) => (
              <TableHead key={index} className="relative group border p-2">
                <Input
                  value={header}
                  onChange={(e) => handleHeaderChange(index, e.target.value)}
                  className="font-semibold bg-transparent border-none focus-visible:ring-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteColumn(index)}
                  title="Delete Column"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableHead>
            ))}
            <TableHead className="w-12 border p-2">
              <Button variant="ghost" size="sm" onClick={addColumn} title="Add Column">
                <Plus className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} className="group">
              {row.map((cell, colIndex) => (
                <TableCell key={colIndex} className="border p-2">
                  <Input
                    value={cell}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    className="bg-transparent border-none focus-visible:ring-0"
                  />
                </TableCell>
              ))}
              <TableCell className="w-12 border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRow(rowIndex)}
                  title="Delete Row"
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={headers.length + 1} className="border p-2">
              <Button variant="ghost" size="sm" onClick={addRow} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Row
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
