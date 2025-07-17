"use client"

import { useCallback, useEffect, useRef, useMemo } from "react"
import { useApp } from "@/context/app-context"
import { BlockEditor } from "./block-editor"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Maximize, Minimize } from "lucide-react"
import type { Block, BlockType, Page } from "@/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { ImageIcon, Video, Music, LayoutGrid, FileText } from "lucide-react" // Declared variables here

export function MainContent() {
  const { state, dispatch } = useApp()
  const currentPage = state.pages.find((p) => p.id === state.currentPageId)
  const contentEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const handleUpdateBlock = useCallback(
    (blockId: string, updates: Partial<Block>) => {
      if (currentPage) {
        dispatch({
          type: "UPDATE_BLOCK",
          payload: { pageId: currentPage.id, blockId, updates },
        })
      }
    },
    [currentPage, dispatch],
  )

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (currentPage) {
        dispatch({
          type: "DELETE_BLOCK",
          payload: { pageId: currentPage.id, blockId },
        })
      }
    },
    [currentPage, dispatch],
  )

  const handleAddBlock = useCallback(
    (type: BlockType, afterBlockId?: string) => {
      if (currentPage) {
        dispatch({
          type: "ADD_BLOCK",
          payload: { pageId: currentPage.id, afterBlockId, type },
        })
      }
    },
    [currentPage, dispatch],
  )

  // Scroll to bottom when new block is added
  useEffect(() => {
    if (contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentPage?.content.length])

  const getBreadcrumbs = useCallback(
    (page: Page | undefined | null) => {
      const path: Page[] = []
      let current = page
      while (current) {
        path.unshift(current)
        current = state.pages.find((p) => p.id === current?.parentId)
      }
      return path
    },
    [state.pages],
  )

  const breadcrumbs = getBreadcrumbs(currentPage)

  const handleCopyUrl = useCallback(() => {
    if (currentPage) {
      const url = `${window.location.origin}/?pageId=${currentPage.id}` // Example URL structure
      navigator.clipboard.writeText(url)
      toast({
        title: "URL Copied!",
        description: "The page URL has been copied to your clipboard.",
      })
    }
  }, [currentPage, toast])

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: event.active.id as string })
    },
    [dispatch],
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null })

      if (!over || !currentPage) return

      if (active.id !== over.id) {
        const oldIndex = currentPage.content.findIndex((block) => block.id === active.id)
        const newIndex = currentPage.content.findIndex((block) => block.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          dispatch({
            type: "REORDER_BLOCKS",
            payload: { pageId: currentPage.id, fromIndex: oldIndex, toIndex: newIndex },
          })
        }
      }
    },
    [currentPage, dispatch],
  )

  const activeBlockForOverlay = useMemo(() => {
    if (!state.activeDragId || !currentPage) return null
    return currentPage.content.find((block) => block.id === state.activeDragId)
  }, [state.activeDragId, currentPage])

  if (!currentPage || currentPage.isDeleted) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {state.currentPageId ? "Page not found or deleted." : "Select a page from the sidebar or create a new one."}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col relative transition-all duration-200 ease-in-out",
        state.sidebarOpen ? "ml-0 md:ml-1/5" : "ml-0 md:ml-12", // Adjusted margin for main content
      )}
    >
      <header className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: crumb.id })}>
                      {crumb.icon} {crumb.title}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator key={`sep-${crumb.id}`} />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyUrl} title="Copy Page URL">
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy URL</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "TOGGLE_CONTENT_WIDTH" })}
            title={state.contentWidth === "half" ? "Full Width" : "Half Width"}
          >
            {state.contentWidth === "half" ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
            <span className="sr-only">Toggle Content Width</span>
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1 p-8">
        <div
          className={cn(
            "mx-auto transition-all duration-200 ease-in-out",
            state.contentWidth === "half" ? "max-w-3xl" : "max-w-full px-4",
          )}
        >
          {/* Page Title */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-4xl">{currentPage.icon}</span>
            <h1 className="text-4xl font-bold tracking-tight">{currentPage.title}</h1>
          </div>

          {/* Blocks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={currentPage.content.map((block) => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {currentPage.content.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    pageId={currentPage.id}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onAddBlock={(type) => handleAddBlock(type, block.id)}
                  />
                ))}
                <div ref={contentEndRef} /> {/* Scroll target */}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeBlockForOverlay ? (
                <div
                  className="p-2 rounded-md bg-background shadow-lg"
                  style={{
                    width: "300px", // Fixed width for overlay
                    opacity: 0.8,
                    minHeight: "auto",
                    height: "auto",
                    ...getBlockOverlayStyle(activeBlockForOverlay),
                  }}
                >
                  {activeBlockForOverlay.type === "text" || activeBlockForOverlay.type.includes("heading") ? (
                    activeBlockForOverlay.content || "Empty Block"
                  ) : (
                    <span className="flex items-center gap-2">
                      {activeBlockForOverlay.type === "image" && <ImageIcon className="h-4 w-4" />}
                      {activeBlockForOverlay.type === "video" && <Video className="h-4 w-4" />}
                      {activeBlockForOverlay.type === "audio" && <Music className="h-4 w-4" />}
                      {activeBlockForOverlay.type === "table" && <LayoutGrid className="h-4 w-4" />}
                      {/* {activeBlockForOverlay.type === "database" && <LayoutGrid className="h-4 w-4" />} */}
                      {activeBlockForOverlay.type === "page" && <FileText className="h-4 w-4" />}
                      {activeBlockForOverlay.type.charAt(0).toUpperCase() + activeBlockForOverlay.type.slice(1)} Block
                    </span>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </ScrollArea>

      {/* Add Block Button at bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex justify-center">
        <Button
          variant="outline"
          onClick={() => handleAddBlock("text", currentPage.content[currentPage.content.length - 1]?.id)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Block
        </Button>
      </div>
    </div>
  )
}

// Helper function to get basic style for block overlay
const getBlockOverlayStyle = (block: Block) => {
  const baseStyle = {
    color: block.properties?.color || "inherit",
    backgroundColor: block.properties?.backgroundColor || "transparent",
    fontWeight: block.properties?.bold ? "bold" : "normal",
    fontStyle: block.properties?.italic ? "italic" : "normal",
    textDecoration:
      [block.properties?.underline ? "underline" : "", block.properties?.strikethrough ? "line-through" : ""]
        .filter(Boolean)
        .join(" ") || "none",
    textAlign: block.properties?.alignment as any,
    fontFamily: block.properties?.fontFamily || "inherit",
    paddingLeft: block.properties?.indent ? "2rem" : undefined,
    textTransform: block.properties?.textTransform || "none",
  }

  switch (block.type) {
    case "heading1":
      return { ...baseStyle, fontSize: "2rem", fontWeight: "bold" }
    case "heading2":
      return { ...baseStyle, fontSize: "1.75rem", fontWeight: "600" }
    case "heading3":
      return { ...baseStyle, fontSize: "1.5rem", fontWeight: "500" }
    case "code":
      return {
        ...baseStyle,
        fontSize: "0.875rem",
        backgroundColor: "#1f2937",
        color: "#f9fafb",
        fontFamily: "'Courier New', monospace",
        padding: "1rem",
      }
    case "quote":
      return {
        ...baseStyle,
        fontSize: "1rem",
        fontStyle: "italic",
        backgroundColor: "#f3f4f6",
        color: "#374151",
        borderLeft: "4px solid #d1d5db",
        paddingLeft: "1rem",
      }
    default:
      return { ...baseStyle, fontSize: "1rem" }
  }
}
