"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, LayoutGrid, List } from "lucide-react"
import type { BlockData } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

type Column = { id: string; name: string; type: string; options?: string[] }
type Row = { id: string; data: { [key: string]: string } }
type View = { id: string; name: string; type: "table" | "kanban" }

interface DatabaseBlockProps {
  data?: BlockData
  onUpdate: (data: BlockData) => void
  onExit: () => void
}

export function DatabaseBlock({ data, onUpdate, onExit }: DatabaseBlockProps) {
  const [columns, setColumns] = useState<Column[]>(data?.columns || [{ id: "name", name: "Name", type: "text" }])
  const [rows, setRows] = useState<Row[]>(data?.rows || [{ id: "1", data: { name: "" } }])
  const [views, setViews] = useState<View[]>(data?.views || [{ id: "table", name: "Table", type: "table" }])
  const [activeView, setActiveView] = useState<string>(views[0]?.id || "table")

  // Add a new column
  const addColumn = useCallback(() => {
    const newColumnId = `col-${Date.now()}`
    setColumns((prev) => [...prev, { id: newColumnId, name: `New Column`, type: "text" }])
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        data: { ...row.data, [newColumnId]: "" },
      })),
    )
  }, [])

  // Update column properties
  const updateColumn = useCallback((colId: string, updates: Partial<Column>) => {
    setColumns((prev) => prev.map((col) => (col.id === colId ? { ...col, ...updates } : col)))
  }, [])

  // Delete a column
  const deleteColumn = useCallback((colId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== colId))
    setRows((prev) =>
      prev.map((row) => {
        const newRowData = { ...row.data }
        delete newRowData[colId]
        return { ...row, data: newRowData }
      }),
    )
  }, [])

  // Add a new row
  const addRow = useCallback(() => {
    const newRowId = `${Date.now()}`
    const newRowData: { [key: string]: string } = {}
    columns.forEach((col) => {
      newRowData[col.id] = ""
    })
    setRows((prev) => [...prev, { id: newRowId, data: newRowData }])
  }, [columns])

  // Update cell data
  const updateCell = useCallback((rowId: string, colId: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, data: { ...row.data, [colId]: value } } : row)))
  }, [])

  // Delete a row
  const deleteRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId))
  }, [])

  // Add a new view
  const addView = useCallback(() => {
    const newViewId = `view-${Date.now()}`
    setViews((prev) => [...prev, { id: newViewId, name: `New View`, type: "table" }])
    setActiveView(newViewId)
  }, [])

  // Update view properties
  const updateView = useCallback((viewId: string, updates: Partial<View>) => {
    setViews((prev) => prev.map((view) => (view.id === viewId ? { ...view, ...updates } : view)))
  }, [])

  // Delete a view
  const deleteView = useCallback(
    (viewId: string) => {
      setViews((prev) => {
        const newViews = prev.filter((view) => view.id !== viewId)
        if (activeView === viewId && newViews.length > 0) {
          setActiveView(newViews[0].id)
        } else if (newViews.length === 0) {
          setActiveView("")
        }
        return newViews
      })
    },
    [activeView],
  )

  // Sync data back to parent when columns / rows / views change
  useEffect(() => {
    onUpdate({ columns, rows, views })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows, views])

  const currentView = useMemo(() => views.find((v) => v.id === activeView), [views, activeView])

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Database</CardTitle>
        <div className="flex items-center gap-2">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList>
              {views.map((view) => (
                <TabsTrigger key={view.id} value={view.id} className="flex items-center gap-1">
                  {view.type === "table" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  {view.name}
                </TabsTrigger>
              ))}
              <Button variant="ghost" size="sm" onClick={addView} title="Add View">
                <Plus className="h-4 w-4" />
              </Button>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {currentView?.type === "table" && (
          <ScrollArea className="w-full border rounded-md">
            {" "}
            {/* Removed fixed height */}
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  {columns.map((col) => (
                    <TableHead key={col.id} className="relative group border p-2">
                      <Input
                        value={col.name}
                        onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                        className="font-semibold bg-transparent border-none focus-visible:ring-0"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => deleteColumn(col.id)}>Delete Column</DropdownMenuItem>
                          <DropdownMenuItem>
                            <Select value={col.type} onValueChange={(value) => updateColumn(col.id, { type: value })}>
                              <SelectTrigger className="w-full border-none shadow-none h-8 px-2">
                                <SelectValue placeholder="Column Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                {rows.map((row) => (
                  <TableRow key={row.id} className="group">
                    {columns.map((col) => (
                      <TableCell key={col.id} className="border p-2">
                        {col.type === "text" && (
                          <Input
                            value={row.data[col.id] || ""}
                            onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                            className="bg-transparent border-none focus-visible:ring-0"
                          />
                        )}
                        {col.type === "number" && (
                          <Input
                            type="number"
                            value={row.data[col.id] || ""}
                            onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                            className="bg-transparent border-none focus-visible:ring-0"
                          />
                        )}
                        {col.type === "select" && (
                          <Select
                            value={row.data[col.id] || ""}
                            onValueChange={(value) => updateCell(row.id, col.id, value)}
                          >
                            <SelectTrigger className="w-full border-none shadow-none h-8 px-2">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {col.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="w-12 border p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRow(row.id)}
                        title="Delete Row"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="border p-2">
                    <Button variant="ghost" size="sm" onClick={addRow} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Add Row
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {currentView?.type === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns
              .filter((col) => col.type === "select")
              .map((statusCol) => (
                <Card key={statusCol.id} className="bg-gray-50 dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">{statusCol.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rows
                      .filter((row) => row.data[statusCol.id] === statusCol.options?.[0])
                      .map((row) => (
                        <Card key={row.id} className="p-3">
                          <Input
                            value={row.data.name || ""}
                            onChange={(e) => updateCell(row.id, "name", e.target.value)}
                            className="font-medium bg-transparent border-none focus-visible:ring-0"
                          />
                          {/* Add more fields as needed */}
                        </Card>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
