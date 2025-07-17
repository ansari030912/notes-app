"use client"

import type { ReactNode } from "react"
import React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Settings,
  Search,
  GripVertical,
  MoreHorizontal,
  Copy,
  Undo2,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageCreationDialog } from "./page-creation-dialog"
import { useApp } from "@/context/app-context"
import type { Page } from "@/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
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
  type DragOverEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Helper component for sortable page items
interface SortablePageItemProps {
  page: Page
  level: number
  inTrash: boolean
  isExpanded: boolean
  hasChildren: boolean
  childrenCount: number
  isFavorite: boolean
  isActive: boolean
  isDragOverTarget: boolean
  dropPosition: "before" | "after" | "inside" | null
  toggleExpanded: (pageId: string) => void
  handleDeletePage: (pageId: string) => void
  handleRestorePage: (pageId: string) => void
  handleDuplicatePage: (pageId: string) => void
  handleRenamePage: (pageId: string, newTitle: string) => void
  setShowPageDialog: (show: boolean) => void
  setDialogParentId: (id: string | undefined) => void
  expandParentPages: (pageId: string) => void
  editingPageId: string | null
  setEditingPageId: (id: string | null) => void // New prop
  sidebarOpen: boolean
}

const SortablePageItem: React.FC<SortablePageItemProps> = ({
  page,
  level,
  inTrash,
  isExpanded,
  hasChildren,
  childrenCount,
  isFavorite,
  isActive,
  isDragOverTarget,
  dropPosition,
  toggleExpanded,
  handleDeletePage,
  handleRestorePage,
  handleDuplicatePage,
  handleRenamePage,
  setShowPageDialog,
  setDialogParentId,
  expandParentPages,
  editingPageId,
  setEditingPageId, // Destructure new prop
  sidebarOpen,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
    data: { page: page, type: "page" },
    disabled: inTrash || editingPageId === page.id, // Disable dragging while editing or in trash
  })
  const { dispatch } = useApp()
  const inputRef = React.createRef<HTMLInputElement>()

  useEffect(() => {
    if (editingPageId === page.id && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingPageId, page.id])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group relative",
        isActive && "bg-gray-100 dark:bg-gray-800",
        isDragOverTarget && "bg-blue-50 dark:bg-blue-900/20",
        inTrash && "opacity-70 hover:opacity-100", // Dim deleted items
        editingPageId !== page.id && "cursor-pointer", // Only cursor-pointer if not editing
      )}
      onClick={() => {
        if (editingPageId !== page.id) {
          dispatch({ type: "SET_CURRENT_PAGE", payload: page.id })
          dispatch({ type: "SET_CURRENT_VIEW", payload: "pages" }) // Ensure we are in pages view
          expandParentPages(page.id)
        }
      }}
    >
      {isDragOverTarget && dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}
      {isDragOverTarget && dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}
      <div
        className={cn(
          "opacity-0 group-hover:opacity-100 cursor-grab",
          !sidebarOpen && "hidden",
          isDragging && "opacity-100", // Always show grip when dragging
        )}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>
      {hasChildren ? ( // Show chevron for any page with children
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-4 w-4 p-0", !sidebarOpen && "hidden")}
          onClick={(e) => {
            e.stopPropagation()
            toggleExpanded(page.id)
          }}
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      ) : (
        <div className={cn("w-4", !sidebarOpen && "hidden")} /> // Placeholder for non-parents to align
      )}
      <span className="text-sm mr-1">{page.icon || "📄"}</span>
      {editingPageId === page.id ? (
        <Input
          ref={inputRef}
          value={page.title}
          onChange={(e) => {
            // Optimistic update for immediate feedback
            dispatch({ type: "UPDATE_PAGE_TITLE", payload: { pageId: page.id, newTitle: e.target.value } })
          }}
          onBlur={(e) => handleRenamePage(page.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur() // Trigger onBlur
            }
            if (e.key === "Escape") {
              e.preventDefault()
              handleRenamePage(page.id, page.title) // Revert to original title
            }
          }}
          className={cn(
            "flex-1 text-sm bg-transparent border-none focus-visible:ring-0 p-0 h-auto",
            !sidebarOpen && "hidden",
          )}
          style={{ minWidth: 0 }} // Allow input to shrink
        />
      ) : (
        <span className={cn("flex-1 text-sm whitespace-normal break-words", !sidebarOpen && "hidden")}>
          {page.title}
        </span>
      )}
      {page.isFolder && sidebarOpen && childrenCount > 0 && (
        <span className="text-xs text-gray-400 mr-1">({childrenCount})</span>
      )}
      <div
        className={cn(
          "opacity-0 group-hover:opacity-100 flex items-center gap-1",
          !sidebarOpen && "hidden",
          isDragging && "hidden", // Hide controls when dragging
        )}
      >
        {!inTrash && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: "TOGGLE_FAVORITE", payload: page.id })
              }}
            >
              <Star className={`h-3 w-3 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            {!inTrash && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingPageId(page.id) // Set editing mode for this page
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPageDialog(true)
                    setDialogParentId(page.id)
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Add Subpage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicatePage(page.id)
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePage(page.id)
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {inTrash && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleRestorePage(page.id)
                }}
              >
                <Undo2 className="h-3.5 w-3.5 mr-2" />
                Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { state, dispatch } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null)
  const [showPageDialog, setShowPageDialog] = useState(false)
  const [dialogParentId, setDialogParentId] = useState<string | undefined>(undefined)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  // Memoize filtered pages to prevent unnecessary recalculations
  const filteredPages = useMemo(() => {
    if (!state.pages) return []
    const lowerCaseQuery = searchQuery.toLowerCase()
    return state.pages.filter((page) => {
      if (page.isDeleted) return false // Exclude deleted pages from main view
      // Search by title or content
      const matchesTitle = page.title?.toLowerCase().includes(lowerCaseQuery)
      const matchesContent = page.content?.some((block) => block.content?.toLowerCase().includes(lowerCaseQuery))
      return matchesTitle || matchesContent
    })
  }, [state.pages, searchQuery])

  // Memoize top level and favorite pages
  const { topLevelPages, favoritePages, trashPages } = useMemo(() => {
    const topLevel = filteredPages.filter((page) => !page.parentId)
    const favorites = filteredPages.filter((page) => state.favorites?.includes(page.id))
    const trash = state.pages.filter((page) => page.isDeleted) // All deleted pages
    return { topLevelPages: topLevel, favoritePages: favorites, trashPages: trash }
  }, [filteredPages, state.favorites, state.pages])

  const toggleExpanded = useCallback((pageId: string) => {
    setExpandedPages((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(pageId)) {
        newExpanded.delete(pageId)
      } else {
        newExpanded.add(pageId)
      }
      return newExpanded
    })
  }, [])

  const handleDeletePage = useCallback(
    (pageId: string) => {
      dispatch({ type: "DELETE_PAGE", payload: pageId })
    },
    [dispatch],
  )

  const handleRestorePage = useCallback(
    (pageId: string) => {
      dispatch({ type: "RESTORE_PAGE", payload: pageId })
    },
    [dispatch],
  )

  const handleDuplicatePage = useCallback(
    (pageId: string) => {
      dispatch({ type: "DUPLICATE_PAGE", payload: pageId })
    },
    [dispatch],
  )

  const handleRenamePage = useCallback(
    (pageId: string, newTitle: string) => {
      if (newTitle.trim() === "") {
        const originalPage = state.pages.find((p) => p.id === pageId)
        if (originalPage) {
          newTitle = originalPage.title // Revert to original title if empty
        } else {
          newTitle = "Untitled"
        }
      }
      dispatch({ type: "UPDATE_PAGE_TITLE", payload: { pageId, newTitle } })
      setEditingPageId(null) // Clear editing mode
    },
    [dispatch, state.pages],
  )

  // Function to expand all parent pages when navigating to a nested page
  const expandParentPages = useCallback(
    (pageId: string) => {
      const page = state.pages?.find((p) => p.id === pageId)
      if (page && page.parentId) {
        setExpandedPages((prev) => {
          const newExpanded = new Set(prev)
          // Recursively expand all parent pages
          const expandParents = (currentPageId: string) => {
            const currentPage = state.pages?.find((p) => p.id === currentPageId)
            if (currentPage && currentPage.parentId) {
              newExpanded.add(currentPage.parentId)
              expandParents(currentPage.parentId)
            }
          }
          expandParents(pageId)
          return newExpanded
        })
      }
    },
    [state.pages],
  )

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: event.active.id as string })
    },
    [dispatch],
  )

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) {
        setDragOverId(null)
        setDropPosition(null)
        return
      }

      const activePage = state.pages.find((p) => p.id === active.id)
      const overPage = state.pages.find((p) => p.id === over.id)

      if (!activePage || !overPage || activePage.id === overPage.id) {
        setDragOverId(null)
        setDropPosition(null)
        return
      }

      // Prevent dropping a page into itself or its descendants
      const isDescendant = (potentialParentId: string, childId: string): boolean => {
        const children = state.pages.filter((p) => p.parentId === potentialParentId)
        if (children.some((c) => c.id === childId)) return true
        return children.some((c) => isDescendant(c.id, childId))
      }

      if (isDescendant(activePage.id, overPage.id)) {
        setDragOverId(null)
        setDropPosition(null)
        return
      }

      setDragOverId(overPage.id)

      // Determine drop position (before, after, or inside)
      const overElement = document.getElementById(`page-item-${overPage.id}`)
      if (overElement) {
        const rect = overElement.getBoundingClientRect()
        const mouseY = event.activatorEvent.clientY // Use clientY from the original event
        const elementHeight = rect.height
        const relativeY = mouseY - rect.top

        if (overPage.isFolder) {
          if (relativeY < elementHeight * 0.25) {
            setDropPosition("before")
          } else if (relativeY > elementHeight * 0.75) {
            setDropPosition("after")
          } else {
            setDropPosition("inside")
          }
        } else {
          if (relativeY < elementHeight / 2) {
            setDropPosition("before")
          } else {
            setDropPosition("after")
          }
        }
      }
    },
    [state.pages],
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null })
      setDragOverId(null)
      setDropPosition(null)

      if (!over) return

      const activePage = state.pages.find((p) => p.id === active.id)
      const overPage = state.pages.find((p) => p.id === over.id)

      if (!activePage || !overPage || activePage.id === overPage.id) return

      // Prevent dropping a page into itself or its descendants
      const isDescendant = (potentialParentId: string, childId: string): boolean => {
        const children = state.pages.filter((p) => p.parentId === potentialParentId)
        if (children.some((c) => c.id === childId)) return true
        return children.some((c) => isDescendant(c.id, childId))
      }

      if (isDescendant(activePage.id, overPage.id)) {
        toast({
          title: "Cannot move page",
          description: "Cannot move a page into its own descendant.",
          variant: "destructive",
        })
        return
      }

      let newParentId: string | undefined = undefined
      const siblings = state.pages
        .filter((p) => p.parentId === overPage.parentId && !p.isDeleted)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Simple sorting for consistent order

      const activeIndexInSiblings = siblings.findIndex((p) => p.id === activePage.id)
      const overIndexInSiblings = siblings.findIndex((p) => p.id === overPage.id)

      if (dropPosition === "inside" && overPage.isFolder) {
        newParentId = overPage.id
        // Expand the target page if it's a folder/parent
        setExpandedPages((prev) => new Set([...prev, overPage.id]))
      } else if (dropPosition === "before") {
        newParentId = overPage.parentId
        // Reorder within siblings
        if (newParentId === activePage.parentId && activeIndexInSiblings !== -1 && overIndexInSiblings !== -1) {
          const newSiblingsOrder = arrayMove(siblings, activeIndexInSiblings, overIndexInSiblings)
          // This reordering logic needs to be handled by updating the 'createdAt' or a dedicated 'order' property
          // For simplicity, we'll just update the parent for now. Full reordering would require more complex state management.
        }
      } else if (dropPosition === "after") {
        newParentId = overPage.parentId
        // Reorder within siblings
        if (newParentId === activePage.parentId && activeIndexInSiblings !== -1 && overIndexInSiblings !== -1) {
          const newSiblingsOrder = arrayMove(siblings, activeIndexInSiblings, overIndexInSiblings + 1)
          // Same as above, needs more complex state for full reordering
        }
      }

      if (newParentId !== activePage.parentId) {
        dispatch({
          type: "UPDATE_PAGE_PARENT",
          payload: { pageId: activePage.id, newParentId },
        })
        toast({
          title: "Page Moved",
          description: `${activePage.title} moved successfully.`,
        })
      } else if (newParentId === activePage.parentId && activeIndexInSiblings !== -1 && overIndexInSiblings !== -1) {
        // If parent is the same, and it's a reorder, we need to update the order.
        // This is a simplified example. A real app might use a 'sortOrder' property on pages.
        // For now, we'll just log that a reorder within the same parent occurred.
        console.log("Reorder within same parent detected, but not fully implemented in state.")
      }
    },
    [dispatch, state.pages, dropPosition, toast],
  )

  const renderPage = useCallback(
    (page: Page, level = 0, inTrash = false): ReactNode => {
      if (!page) return null // Ensure page exists
      const childPages = state.pages?.filter((p) => p.parentId === page.id && !p.isDeleted) || []
      const hasChildren = childPages.length > 0
      const childrenCount = childPages.length
      const isExpanded = expandedPages.has(page.id)
      const isFavorite = state.favorites?.includes(page.id) || false
      const isActive = state.currentPageId === page.id
      const isDragOverTarget = dragOverId === page.id

      return (
        <div key={page.id} id={`page-item-${page.id}`} style={{ paddingLeft: `${8 + level * 16}px` }}>
          <SortablePageItem
            page={page}
            level={level}
            inTrash={inTrash}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            childrenCount={childrenCount}
            isFavorite={isFavorite}
            isActive={isActive}
            isDragOverTarget={isDragOverTarget}
            dropPosition={dropPosition}
            toggleExpanded={toggleExpanded}
            handleDeletePage={handleDeletePage}
            handleRestorePage={handleRestorePage}
            handleDuplicatePage={handleDuplicatePage}
            handleRenamePage={handleRenamePage}
            setShowPageDialog={setShowPageDialog}
            setDialogParentId={setDialogParentId}
            expandParentPages={expandParentPages}
            editingPageId={editingPageId}
            setEditingPageId={setEditingPageId} // Pass setEditingPageId
            sidebarOpen={state.sidebarOpen}
          />
          {hasChildren &&
            isExpanded && ( // Render children only if parent is expanded
              <SortableContext items={childPages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div>{childPages.map((child) => renderPage(child, level + 1))}</div>
              </SortableContext>
            )}
        </div>
      )
    },
    [
      state.pages,
      state.favorites,
      state.currentPageId,
      expandedPages,
      dragOverId,
      dropPosition,
      toggleExpanded,
      handleDeletePage,
      handleRestorePage,
      handleDuplicatePage,
      handleRenamePage,
      setShowPageDialog,
      setDialogParentId,
      expandParentPages,
      editingPageId,
      setEditingPageId, // Add to dependencies
      state.sidebarOpen,
    ],
  )

  const topLevelPageIds = useMemo(() => topLevelPages.map((p) => p.id), [topLevelPages])
  const favoritePageIds = useMemo(() => favoritePages.map((p) => p.id), [favoritePages])
  const activePageForOverlay = useMemo(() => {
    if (!state.activeDragId) return null
    return state.pages.find((p) => p.id === state.activeDragId)
  }, [state.activeDragId, state.pages])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div
        className={cn(
          "bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-200 ease-in-out z-20", // Added z-index
          state.sidebarOpen ? "w-full md:w-2/12" : "w-0 md:w-12 overflow-hidden", // Mini-sidebar on md+, full hide on small
        )}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className={cn("relative flex-1 ml-2", !state.sidebarOpen && "hidden")}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Favorites */}
            {favoritePages.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <Star className="h-3 w-3" />
                  <span className={cn(!state.sidebarOpen && "hidden")}>Favorites</span>
                </div>
                <SortableContext items={favoritePageIds} strategy={verticalListSortingStrategy}>
                  {favoritePages.map((page) => renderPage(page))}
                </SortableContext>
              </div>
            )}
            {/* Pages */}
            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <span className={cn(!state.sidebarOpen && "hidden")}>Pages</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-4 w-4 p-0", !state.sidebarOpen && "hidden")} // Hide plus button when collapsed
                  onClick={() => setShowPageDialog(true)}
                  title="Add page"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <SortableContext items={topLevelPageIds} strategy={verticalListSortingStrategy}>
                {topLevelPages.map((page) => renderPage(page))}
              </SortableContext>
            </div>
            {/* Trash Link */}
            <div className="mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 px-2"
                onClick={() => dispatch({ type: "SET_CURRENT_VIEW", payload: "trash" })}
              >
                <Trash2 className="h-4 w-4" />
                <span className={cn(!state.sidebarOpen && "hidden")}>Trash ({trashPages.length})</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2"
            onClick={() => dispatch({ type: "SET_CURRENT_VIEW", payload: "settings" })}
          >
            <Settings className="h-4 w-4" />
            <span className={cn(!state.sidebarOpen && "hidden")}>Settings</span>
          </Button>
        </div>
        {/* Create Page Dialog */}
        <PageCreationDialog
          open={showPageDialog}
          onOpenChange={setShowPageDialog}
          parentPageId={dialogParentId}
          onComplete={(newPageId) => {
            if (dialogParentId) {
              setExpandedPages((prev) => new Set([...prev, dialogParentId]))
              dispatch({
                type: "ADD_PAGE_REFERENCE_TO_PARENT",
                payload: {
                  parentPageId: dialogParentId,
                  referencePageId: newPageId,
                },
              })
              dispatch({ type: "SET_CURRENT_PAGE", payload: dialogParentId }) // Navigate to parent
            } else {
              dispatch({ type: "SET_CURRENT_PAGE", payload: newPageId }) // Navigate to new page
            }
            expandParentPages(newPageId)
            setDialogParentId(undefined)
          }}
        />
      </div>
      <DragOverlay>
        {activePageForOverlay ? (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 shadow-lg"
            style={{ paddingLeft: `${8 + (activePageForOverlay.parentId ? 1 : 0) * 16}px` }} // Simple indent for overlay
          >
            <span className="text-sm mr-1">{activePageForOverlay.icon || "📄"}</span>
            <span className="flex-1 text-sm whitespace-normal break-words">{activePageForOverlay.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
