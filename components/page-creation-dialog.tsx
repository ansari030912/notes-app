"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Folder } from "lucide-react"
import { useApp } from "@/context/app-context"
import type { Block, Page } from "@/types"

interface PageCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentPageId?: string
  blockId?: string
  onComplete?: (pageId: string) => void
  currentBlock?: Block // Added to check if a page is already linked
}

const DEFAULT_ICONS = ["📄", "📝", "📚", "📊", "📈", "📌", "🗂️", "📁", "🔍", "⚙️", "🏠", "🌟", "🔖", "📅", "✅"]
const DEFAULT_FOLDER_ICONS = ["📁", "🗂️", "📂", "📑", "🗃️", "🗄️", "📋", "📎", "🔖", "🏷️", "📌", "📍", "🔍", "🔎", "📦"]

export function PageCreationDialog({
  open,
  onOpenChange,
  parentPageId,
  blockId,
  onComplete,
  currentBlock, // Destructure new prop
}: PageCreationDialogProps) {
  const { dispatch, state } = useApp()
  const [title, setTitle] = useState("Untitled")
  const [selectedIcon, setSelectedIcon] = useState("📄")
  const [type, setType] = useState<"page" | "folder">("page")
  const [creationMode, setCreationMode] = useState<"new" | "existing">("new") // New state for creation mode
  const [selectedExistingPageId, setSelectedExistingPageId] = useState<string | null>(null) // New state for existing page selection
  const [searchTerm, setSearchTerm] = useState("") // New state for search term
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Reset states when dialog opens
      setTitle("Untitled")
      setSelectedIcon(type === "page" ? "📄" : "📁")
      setCreationMode("new") // Default to 'new' tab
      setSelectedExistingPageId(null)
      setSearchTerm("")
      const timeout = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50) // Ensure dialog is mounted before focusing
      return () => clearTimeout(timeout)
    }
  }, [open, type]) // Depend on 'type' to reset icon correctly

  const handleCreateItem = () => {
    if (creationMode === "new") {
      const newPage: Page = {
        id: Date.now().toString(),
        title: title || "Untitled",
        icon: selectedIcon,
        parentId: parentPageId,
        content: [
          {
            id: Date.now().toString() + "-block",
            type: "text",
            content: "",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isFolder: type === "folder",
      }
      dispatch({ type: "ADD_PAGE", payload: newPage })
      if (blockId && parentPageId) {
        dispatch({
          type: "ADD_PAGE_REFERENCE",
          payload: {
            pageId: parentPageId,
            blockId,
            referencePageId: newPage.id,
          },
        })
      }
      if (onComplete) {
        onComplete(newPage.id)
      }
    } else {
      // Handle linking existing page
      if (selectedExistingPageId && blockId && parentPageId) {
        dispatch({
          type: "ADD_PAGE_REFERENCE",
          payload: {
            pageId: parentPageId,
            blockId,
            referencePageId: selectedExistingPageId,
          },
        })
        if (onComplete) {
          onComplete(selectedExistingPageId)
        }
      }
    }
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateItem()
    }
  }

  // Filter available pages for linking
  const availablePagesToLink = state.pages.filter(
    (page) =>
      !page.isFolder && // Only show pages, not folders
      page.id !== parentPageId && // Exclude the current page itself
      page.id !== currentBlock?.data?.pageId && // Exclude the page if it's already linked by this block
      page.title.toLowerCase().includes(searchTerm.toLowerCase()), // Filter by search term
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{creationMode === "new" ? `Create a new ${type}` : "Link an existing page"}</DialogTitle>
          <DialogDescription>
            {creationMode === "new"
              ? `Add a title and icon for your new ${type}.`
              : "Select an existing page to link in this block."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Tabs value={creationMode} onValueChange={(value) => setCreationMode(value as "new" | "existing")}>
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex-1 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Existing
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {creationMode === "new" ? (
            <>
              <Tabs value={type} onValueChange={(value) => setType(value as "page" | "folder")}>
                <TabsList className="w-full">
                  <TabsTrigger value="page" className="flex-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Page
                  </TabsTrigger>
                  <TabsTrigger value="folder" className="flex-1 flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Folder
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap gap-2 mb-4">
                {(type === "page" ? DEFAULT_ICONS : DEFAULT_FOLDER_ICONS).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`w-8 h-8 text-lg flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      selectedIcon === icon ? "bg-gray-200 dark:bg-gray-700" : ""
                    }`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor="title" className="text-sm font-medium">
                  {type === "page" ? "Page Title" : "Folder Name"}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xl">{selectedIcon}</div>
                  <Input
                    id="title"
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Untitled"
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="max-h-[calc(70vh-180px)] overflow-y-auto space-y-1">
                {availablePagesToLink.length > 0 ? (
                  availablePagesToLink.map((page) => (
                    <Button
                      key={page.id}
                      variant="ghost"
                      className={`w-full justify-start text-left ${
                        selectedExistingPageId === page.id ? "bg-gray-100 dark:bg-gray-800" : ""
                      }`}
                      onClick={() => setSelectedExistingPageId(page.id)}
                    >
                      <span className="mr-2">{page.icon || "📄"}</span> {page.title}
                    </Button>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No pages found or available to link.</p>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateItem} disabled={creationMode === "existing" && !selectedExistingPageId}>
            {creationMode === "new" ? `Create ${type === "page" ? "Page" : "Folder"}` : "Link Page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
