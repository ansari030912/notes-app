"use client"

import { useApp } from "@/context/app-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Search, Trash2, Undo2, FileText, Folder } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

export function TrashView() {
  const { state, dispatch } = useApp()
  const [searchQuery, setSearchQuery] = useState("")

  const trashPages = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    return state.pages.filter(
      (page) =>
        page.isDeleted &&
        (page.title.toLowerCase().includes(lowerCaseQuery) ||
          page.content.some((block) => block.content.toLowerCase().includes(lowerCaseQuery))),
    )
  }, [state.pages, searchQuery])

  const handleToggleSelect = useCallback(
    (pageId: string) => {
      dispatch({ type: "TOGGLE_SELECT_TRASH_PAGE", payload: pageId })
    },
    [dispatch],
  )

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      dispatch({ type: "SELECT_ALL_TRASH_PAGES", payload: checked })
    },
    [dispatch],
  )

  const handleRestoreSelected = useCallback(() => {
    dispatch({ type: "RESTORE_SELECTED_TRASH", payload: state.selectedTrashPageIds })
  }, [dispatch, state.selectedTrashPageIds])

  const handlePermanentlyDeleteSelected = useCallback(() => {
    dispatch({ type: "PERMANENTLY_DELETE_SELECTED_TRASH", payload: state.selectedTrashPageIds })
  }, [dispatch, state.selectedTrashPageIds])

  const handleRestoreAll = useCallback(() => {
    dispatch({ type: "RESTORE_ALL_TRASH" })
  }, [dispatch])

  const handlePermanentlyDeleteAll = useCallback(() => {
    dispatch({ type: "PERMANENTLY_DELETE_ALL_TRASH" })
  }, [dispatch])

  const isAllSelected = trashPages.length > 0 && state.selectedTrashPageIds.length === trashPages.length
  const isAnySelected = state.selectedTrashPageIds.length > 0

  return (
    <div
      className={cn(
        "flex-1 flex flex-col relative transition-all duration-200 ease-in-out",
        state.sidebarOpen ? "ml-0 md:ml-1/4" : "ml-0 md:ml-12",
      )}
    >
      <header className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Trash2 className="h-5 w-5" /> Trash
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRestoreSelected} disabled={!isAnySelected}>
            <Undo2 className="h-4 w-4 mr-2" /> Restore Selected
          </Button>
          <Button variant="destructive" size="sm" onClick={handlePermanentlyDeleteSelected} disabled={!isAnySelected}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestoreAll} disabled={trashPages.length === 0}>
            Restore All
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePermanentlyDeleteAll}
            disabled={trashPages.length === 0}
          >
            Delete All
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {trashPages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No items in trash.</div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox id="select-all-trash" checked={isAllSelected} onCheckedChange={handleSelectAll} />
                  <label
                    htmlFor="select-all-trash"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All ({state.selectedTrashPageIds.length}/{trashPages.length})
                  </label>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {trashPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox
                      checked={state.selectedTrashPageIds.includes(page.id)}
                      onCheckedChange={() => handleToggleSelect(page.id)}
                    />
                    <span className="text-xl">{page.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{page.title}</div>
                      <div className="text-xs text-gray-500">
                        {page.isFolder ? (
                          <Folder className="h-3 w-3 inline-block mr-1" />
                        ) : (
                          <FileText className="h-3 w-3 inline-block mr-1" />
                        )}
                        Deleted: {new Date(page.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: "RESTORE_PAGE", payload: page.id })}
                      title="Restore page"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => dispatch({ type: "PERMANENTLY_DELETE_PAGE", payload: page.id })}
                      title="Permanently delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
