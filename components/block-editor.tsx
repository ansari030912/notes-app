"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/context/app-context"
import type { Block, BlockProperties, BlockType } from "@/types"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronRight,
  Code,
  FileText,
  GripVertical,
  ImageIcon,
  Italic,
  Maximize2,
  Music,
  Palette,
  Plus,
  Smile,
  Strikethrough,
  Table,
  Trash2,
  Type,
  Underline,
  Video,
  X,
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { DatabaseBlock } from "./database-block"
import { PageCreationDialog } from "./page-creation-dialog"
import { TableBlock } from "./table-block"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface BlockEditorProps {
  block: Block
  index: number
  pageId: string
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onAddBlock: (type: BlockType) => void
}

const FONTS = [
  { name: "Default", value: "inherit" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Lato", value: "'Lato', sans-serif" },
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Merriweather", value: "'Merriweather', serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
]

const TEXT_SIZES = [
  { name: "Extra Small", value: "0.75rem" },
  { name: "Small", value: "0.875rem" },
  { name: "Normal", value: "1rem" },
  { name: "Large", value: "1.125rem" },
  { name: "Extra Large", value: "1.25rem" },
  { name: "2X Large", value: "1.5rem" },
  { name: "3X Large", value: "1.875rem" },
  { name: "4X Large", value: "2.25rem" },
]

const MEDIA_SIZES = [
  { name: "Small", value: "25%" },
  { name: "Medium", value: "50%" },
  { name: "Large", value: "75%" },
  { name: "Full Width", value: "100%" },
]

const emojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "🥲",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "🥴",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "🥸",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "☹️",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "😧",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "😣",
  "😞",
  "😓",
  "😩",
  "😫",
  "🥱",
  "😤",
  "😡",
  "😠",
  "🤬",
  "😈",
  "👿",
  "💀",
  "☠️",
  "💩",
  "🤡",
  "👹",
  "👺",
  "👻",
]

export function BlockEditor({ block, index, pageId, onUpdate, onDelete, onAddBlock }: BlockEditorProps) {
  const { state, dispatch } = useApp()
  const [isHovered, setIsHovered] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showMediaSizeMenu, setShowMediaSizeMenu] = useState(false)
  const [showMediaAlignMenu, setShowMediaAlignMenu] = useState(false)
  const [showPageDialog, setShowPageDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedSelectionRange = useRef<Range | null>(null) // Ref to store selection range
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { block: block, type: "block", pageId: pageId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get referenced page if this is a page block
  const referencedPage =
    block.type === "page" && block.data?.pageId ? state.pages.find((p) => p.id === block.data?.pageId) : null

  // Initialize contentEditable div's innerHTML on mount or when block.id changes
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== block.content) {
      contentEditableRef.current.innerHTML = block.content
      // For new empty blocks, ensure cursor is at the end
      if (block.content === "") {
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(contentEditableRef.current)
        range.collapse(false) // Collapse to the end
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [block.id]) // Run only once per block, or when block.id changes (new block)

  // Restore selection after content updates (which trigger re-renders)
  // This useEffect is crucial now that dangerouslySetInnerHTML is removed.
  // It ensures that if block.content changes from an external source (e.g., undo/redo, or another block's update),
  // the contentEditable div's innerHTML is updated and cursor is restored.
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== block.content) {
      // Save current scroll position
      const scrollTop = contentEditableRef.current.scrollTop

      contentEditableRef.current.innerHTML = block.content
      restoreCurrentSelection()

      // Restore scroll position
      contentEditableRef.current.scrollTop = scrollTop
    }
  }, [block.content]) // This effect will now be responsible for syncing block.content to DOM

  // Auto-resize contentEditable div based on content
  useEffect(() => {
    if (
      contentEditableRef.current &&
      (block.type === "text" ||
        block.type.includes("heading") ||
        block.type.includes("list") ||
        block.type === "code" ||
        block.type === "quote")
    ) {
      contentEditableRef.current.style.height = "auto"
      contentEditableRef.current.style.height = contentEditableRef.current.scrollHeight + "px"
    }
  }, [block.content, block.type]) // Still depends on block.content for resizing

  // Auto-focus new empty blocks
  useEffect(() => {
    if (contentEditableRef.current && block.content === "" && block.type === "text") {
      contentEditableRef.current.focus()
    }
  }, [block.content, block.type])

  // Update bold/italic state based on selection
  useEffect(() => {
    const updateFormattingState = () => {
      if (contentEditableRef.current) {
        setIsBold(document.queryCommandState("bold"))
        setIsItalic(document.queryCommandState("italic"))
      }
    }
    document.addEventListener("selectionchange", updateFormattingState)
    return () => document.removeEventListener("selectionchange", updateFormattingState)
  }, [])

  // Save and restore selection logic
  const saveCurrentSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelectionRange.current = selection.getRangeAt(0)
    } else {
      savedSelectionRange.current = null
    }
  }

  const restoreCurrentSelection = () => {
    if (savedSelectionRange.current && contentEditableRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        try {
          selection.addRange(savedSelectionRange.current)
        } catch (error) {
          // This can happen if the DOM structure changes significantly
          console.warn("Could not restore selection range:", error)
          // Fallback: place cursor at the end
          const range = document.createRange()
          range.selectNodeContents(contentEditableRef.current)
          range.collapse(false)
          selection.addRange(range)
        }
      }
      // Do NOT clear savedSelectionRange.current here. It should persist until a new selection is made.
      // It's cleared when a new selection is saved.
    }
  }

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    saveCurrentSelection() // Save selection before updating React state
    onUpdate({ content: e.currentTarget.innerHTML })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Create a URL for the file to display it
    const fileUrl = URL.createObjectURL(file)

    // Update the block with file information
    onUpdate({
      data: {
        file: file,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    })

    setIsUploading(false)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeMedia = () => {
    onUpdate({
      data: null,
    })
  }

  const getAcceptedFileTypes = () => {
    switch (block.type) {
      case "image":
        return "image/*"
      case "video":
        return "video/*"
      case "audio":
        return "audio/*"
      default:
        return "*/*"
    }
  }

  const handleTextSelect = (e: React.MouseEvent) => {
    // Removed all toolbar-related logic from here
    // Selection is now handled natively by contentEditable and preserved by save/restore logic
  }

  const updateProperties = (properties: Partial<BlockProperties>) => {
    onUpdate({
      properties: { ...block.properties, ...properties },
    })
  }

  const getBlockStyle = () => {
    const props = block.properties || {}
    const baseStyle = {
      color: props.color,
      backgroundColor: props.backgroundColor,
      textDecoration:
        [props.underline ? "underline" : "", props.strikethrough ? "line-through" : ""].filter(Boolean).join(" ") ||
        "none",
      textAlign: props.alignment as any,
      fontFamily: props.fontFamily || "inherit",
      paddingLeft: props.indent ? "2rem" : undefined,
      textTransform: props.textTransform || "none",
      minHeight: "auto",
      height: "auto",
    }

    // Set proper font sizes and line heights for different block types
    switch (block.type) {
      case "heading1":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "2rem",
          fontWeight: "bold",
          lineHeight: props.lineHeight || "1.3", // Increased default line-height
        }
      case "heading2":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1.75rem",
          fontWeight: "600",
          lineHeight: props.lineHeight || "1.4", // Increased default line-height
        }
      case "heading3":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1.5rem",
          fontWeight: "500",
          lineHeight: props.lineHeight || "1.5", // Increased default line-height
        }
      case "heading4":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1.25rem",
          fontWeight: "500",
          lineHeight: props.lineHeight || "1.6", // Increased default line-height
        }
      case "heading5":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1.125rem",
          fontWeight: "500",
          lineHeight: props.lineHeight || "1.7", // Increased default line-height
        }
      case "heading6":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1rem",
          fontWeight: "500",
          lineHeight: props.lineHeight || "1.8", // Increased default line-height
        }
      case "code":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "0.875rem",
          lineHeight: props.lineHeight || "1.6",
          backgroundColor: props.backgroundColor || "#1f2937",
          color: props.color || "#f9fafb",
          fontFamily: "'Courier New', monospace",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "none",
          outline: "none",
          minHeight: "auto",
          height: "auto",
        }
      case "quote":
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1rem",
          lineHeight: props.lineHeight || "1.6",
          fontStyle: "italic", // Keep for quote as it's a block-level style
          backgroundColor: props.backgroundColor || "#f3f4f6",
          color: props.color || "#374151",
          borderLeft: "4px solid #d1d5db",
          paddingLeft: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          minHeight: "auto",
          height: "auto",
        }
      default:
        return {
          ...baseStyle,
          fontSize: props.fontSize || "1rem",
          lineHeight: props.lineHeight || "1.8", // Increased default line-height for general text
        }
    }
  }

  const getMediaStyle = () => {
    const props = block.properties || {}
    return {
      width: props.mediaWidth || "100%",
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin:
        props.mediaAlignment === "center" ? "0 auto" : props.mediaAlignment === "right" ? "0 0 0 auto" : "0 auto 0 0",
    }
  }

  const getMediaContainerStyle = () => {
    const props = block.properties || {}
    return {
      textAlign: props.mediaAlignment || "left",
      width: "100%",
    }
  }

  const getPlaceholder = () => {
    switch (block.type) {
      case "heading1":
        return "Heading 1"
      case "heading2":
        return "Heading 2"
      case "heading3":
        return "Heading 3"
      case "heading4":
        return "Heading 4"
      case "heading5":
        return "Heading 5"
      case "heading6":
        return "Heading 6"
      case "quote":
        return "Quote"
      case "code":
        return "Code"
      case "bullet-list":
        return "List item"
      case "numbered-list":
        return "List item"
      default:
        return "Type '/' for commands, Shift+Enter for new line, or select text for formatting" // Updated placeholder
    }
  }

  const getClassName = () => {
    const baseClass = "w-full bg-transparent border-none outline-none resize-none overflow-hidden whitespace-pre-wrap"
    switch (block.type) {
      case "heading1":
        return `${baseClass} text-3xl font-bold leading-tight`
      case "heading2":
        return `${baseClass} text-2xl font-semibold leading-tight`
      case "heading3":
        return `${baseClass} text-xl font-medium leading-tight`
      case "heading4":
        return `${baseClass} text-lg font-medium leading-tight`
      case "heading5":
        return `${baseClass} text-base font-medium leading-tight`
      case "heading6":
        return `${baseClass} text-sm font-medium leading-tight`
      case "quote":
        return `${baseClass} italic`
      case "code":
        return `${baseClass} font-mono text-white`
      case "bullet-list":
        return `${baseClass} relative`
      case "numbered-list":
        return `${baseClass} relative`
      default:
        return baseClass
    }
  }

  const createNewBlock = (type: BlockType) => {
    if (type === "paragraph") {
      // Add a new text block after current block
      onAddBlock("text")
      return
    }
    if (type === "table") {
      onUpdate({
        type: "table",
        data: {
          headers: ["Column 1", "Column 2", "Column 3"],
          rows: [
            ["", "", ""],
            ["", "", ""],
          ],
        },
      })
    } else if (type === "database") {
      onUpdate({
        type: "database",
        data: {
          columns: [
            { id: "name", name: "Name", type: "text" },
            {
              id: "status",
              name: "Status",
              type: "select",
              options: ["Not Started", "In Progress", "Done"],
            },
          ],
          rows: [{ id: "1", data: { name: "", status: "Not Started" } }],
          views: [
            { id: "table", name: "Table", type: "table" },
            { id: "kanban", name: "Kanban", type: "kanban" },
          ],
        },
      })
    } else if (type === "page") {
      // Open page creation dialog
      setShowPageDialog(true)
    } else if (type === "divider") {
      // Convert current block to divider - no auto text block
      dispatch({
        type: "CONVERT_BLOCK_INLINE",
        payload: {
          pageId,
          blockId: block.id,
          type,
          keepContent: false,
        },
      })
    } else if (["image", "video", "audio"].includes(type)) {
      // Convert to media block - no auto text block
      dispatch({
        type: "CONVERT_BLOCK_INLINE",
        payload: {
          pageId,
          blockId: block.id,
          type,
          keepContent: false,
        },
      })
    } else if (["heading1", "heading2", "heading3", "heading4", "heading5", "heading6"].includes(type)) {
      // Convert to heading - no auto text block
      dispatch({
        type: "CONVERT_BLOCK_INLINE",
        payload: {
          pageId,
          blockId: block.id,
          type,
          keepContent: true,
        },
      })
    } else {
      // Convert current block to the selected type
      dispatch({
        type: "CONVERT_BLOCK_INLINE",
        payload: {
          pageId,
          blockId: block.id,
          type,
          keepContent: true,
        },
      })
    }
    setShowBlockMenu(false)
  }

  const navigateToPage = (pageId: string) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: pageId })
  }

  const insertEmoji = (emoji: string) => {
    const contentEditable = contentEditableRef.current
    if (contentEditable) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(emoji))
        range.collapse(false) // Collapse selection to the end of the inserted emoji
        onUpdate({ content: contentEditable.innerHTML }) // Sync state
      } else {
        // Fallback if no selection, append to content
        onUpdate({ content: block.content + emoji })
      }
    } else {
      // Fallback if contentEditableRef is not available
      onUpdate({ content: block.content + emoji })
    }
    setShowEmojiMenu(false)
  }

  const renderBlockContent = () => {
    const handleInternalKeyDown = (e: React.KeyboardEvent) => {
      // Handle list operations
      if (block.type === "bullet-list" || block.type === "numbered-list") {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          // If the content is empty and not the first item, convert to paragraph
          if (contentEditableRef.current && contentEditableRef.current.innerHTML.trim() === "") {
            dispatch({
              type: "CONVERT_BLOCK_INLINE",
              payload: {
                pageId,
                blockId: block.id,
                type: "text",
                keepContent: true,
              },
            })
            return
          }
          // Add a new list item
          dispatch({
            type: "ADD_LIST_ITEM",
            payload: {
              pageId,
              blockId: block.id,
              indent: e.ctrlKey, // Ctrl+Enter to indent
            },
          })
          return
        }
        // Tab to indent, Shift+Tab to outdent
        if (e.key === "Tab") {
          e.preventDefault()
          const indent = !e.shiftKey
          onUpdate({
            properties: { ...block.properties, indent: indent },
          })
          return
        }
      }
      // For regular blocks - only add new block when user presses Enter
      if (e.key === "Enter" && !e.shiftKey) {
        if (contentEditableRef.current && contentEditableRef.current.innerHTML.trim() === "") {
          e.preventDefault()
          onAddBlock("text")
        }
      }
      // Handle backspace - go to previous block if current is empty
      if (e.key === "Backspace" && contentEditableRef.current && contentEditableRef.current.innerHTML.trim() === "") {
        e.preventDefault()
        onDelete()
      }
      // Slash commands
      if (e.key === "/" && contentEditableRef.current && contentEditableRef.current.innerHTML.trim() === "") {
        e.preventDefault()
        setShowBlockMenu(true)
      }
    }

    switch (block.type) {
      case "table":
        return (
          <div className="relative">
            <TableBlock data={block.data} onUpdate={(data) => onUpdate({ data })} onExit={() => onAddBlock("text")} />
            {/* Delete button for table */}
            <div
              className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isHovered ? "opacity-100" : ""
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                onClick={onDelete}
                title="Delete table"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case "database":
        return (
          <div className="relative">
            <DatabaseBlock
              data={block.data}
              onUpdate={(data) => onUpdate({ data })}
              onExit={() => onAddBlock("text")}
            />
            {/* Delete button for database */}
            <div
              className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isHovered ? "opacity-100" : ""
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                onClick={onDelete}
                title="Delete database"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case "divider":
        return <hr className="border-gray-300 dark:border-gray-600 my-4" />
      case "image":
        if (block.data?.url) {
          return (
            <div className="relative group" style={getMediaContainerStyle()}>
              <img
                src={block.data.url || "/placeholder.svg"}
                alt={block.data.name || "Uploaded image"}
                className="rounded-lg"
                style={getMediaStyle()}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                  onClick={removeMedia}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        }
        return (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
            onClick={handleMediaClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload an image</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, GIF, WebP</p>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering handleMediaClick
                onDelete()
              }}
              title="Delete block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      case "video":
        if (block.data?.url) {
          return (
            <div className="relative group" style={getMediaContainerStyle()}>
              <video src={block.data.url} controls className="rounded-lg" style={getMediaStyle()}>
                Your browser does not support the video tag.
              </video>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                  onClick={removeMedia}
                  title="Remove video"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        }
        return (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
            onClick={handleMediaClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload a video</p>
                <p className="text-xs text-gray-400 mt-1">Supports MP4, WebM, AVI, MOV</p>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering handleMediaClick
                onDelete()
              }}
              title="Delete block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      case "audio":
        if (block.data?.url) {
          return (
            <div className="relative group" style={getMediaContainerStyle()}>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4" style={getMediaStyle()}>
                <audio src={block.data.url} controls className="w-full">
                  Your browser does not support the audio tag.
                </audio>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                    onClick={removeMedia}
                    title="Remove audio"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        }
        return (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
            onClick={handleMediaClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleFileUpload}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <Music className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload an audio file</p>
                <p className="text-xs text-gray-400 mt-1">Supports MP3, WAV, OGG, M4A</p>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering handleMediaClick
                onDelete()
              }}
              title="Delete block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      case "page":
        if (referencedPage) {
          return (
            <div
              className="flex items-center justify-between gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
              onClick={() => navigateToPage(referencedPage.id)}
            >
              <div className="flex items-center gap-2">
                <div className="text-2xl">{referencedPage.icon || "📄"}</div>
                <div className="font-medium whitespace-normal break-words">{referencedPage.title}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent navigating to page
                    onDelete() // Delete the page reference block
                  }}
                  title="Delete page reference"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-between gap-2 p-2 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Page not found</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              onClick={onDelete}
              title="Delete this block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      case "bullet-list":
        return (
          <div className="flex">
            <div className="flex-shrink-0 w-6 text-center">•</div>
            <div
              ref={contentEditableRef}
              contentEditable="true"
              onInput={handleContentChange}
              onKeyDown={handleInternalKeyDown} // Use internal handler for contentEditable
              onMouseUp={handleTextSelect}
              // Placeholder attribute does not work on contentEditable divs
              className={getClassName()}
              style={getBlockStyle()}
            />
          </div>
        )
      case "numbered-list":
        const currentPageBlocks = state.pages.find((p) => p.id === pageId)?.content || []
        let displayNumber = 1
        // Iterate backward to find the start of the current numbered list sequence
        for (let i = index - 1; i >= 0; i--) {
          if (currentPageBlocks[i].type === "numbered-list") {
            displayNumber++
          } else {
            // Break if a non-numbered-list block is encountered
            break
          }
        }
        return (
          <div className="flex">
            <div className="flex-shrink-0 w-6 text-right mr-2">{displayNumber}.</div>
            <div
              ref={contentEditableRef}
              contentEditable="true"
              onInput={handleContentChange}
              onKeyDown={handleInternalKeyDown}
              onMouseUp={handleTextSelect}
              className={getClassName()}
              style={getBlockStyle()}
            />
          </div>
        )
      default:
        return (
          <div
            ref={contentEditableRef}
            contentEditable="true"
            onInput={handleContentChange}
            onKeyDown={handleInternalKeyDown} // Use internal handler for contentEditable
            onMouseUp={handleTextSelect}
            // Placeholder attribute does not work on contentEditable divs
            className={getClassName()}
            style={getBlockStyle()}
          />
        )
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-2">
          {/* Block Controls */}
          <div
            className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isHovered ? "opacity-100" : ""
            } ${isDragging ? "opacity-100" : ""}`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-3 w-3" />
            </Button>
            <DropdownMenu open={showBlockMenu} onOpenChange={setShowBlockMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                <DropdownMenuItem onClick={() => createNewBlock("paragraph")}>
                  <span className="mr-2">¶</span> Paragraph
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("text")}>
                  <span className="mr-2">📝</span> Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading1")}>
                  <span className="mr-2">H1</span> Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading2")}>
                  <span className="mr-2">H2</span> Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading3")}>
                  <span className="mr-2">H3</span> Heading 3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading4")}>
                  <span className="mr-2">H4</span> Heading 4
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading5")}>
                  <span className="mr-2">H5</span> Heading 5
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("heading6")}>
                  <span className="mr-2">H6</span> Heading 6
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("bullet-list")}>
                  <span className="mr-2">•</span> Bullet List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("numbered-list")}>
                  <span className="mr-2">1.</span> Numbered List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("quote")}>
                  <span className="mr-2">💬</span> Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("code")}>
                  <Code className="h-4 w-4 mr-2" /> Code
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("divider")}>
                  <span className="mr-2">—</span> Divider
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("table")}>
                  <Table className="h-4 w-4 mr-2" /> Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("page")}>
                  <FileText className="h-4 w-4 mr-2" /> Sub Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("image")}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("video")}>
                  <Video className="h-4 w-4 mr-2" /> Video
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createNewBlock("audio")}>
                  <Music className="h-4 w-4 mr-2" /> Audio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Block Content */}
          <div className="flex-1 min-w-0">{renderBlockContent()}</div>
          {/* Style Controls */}
          {!["table", "database", "divider", "page"].includes(block.type) && (
            <div
              className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                isHovered ? "opacity-100" : ""
              }`}
            >
              {/* Media Controls */}
              {["image", "video", "audio"].includes(block.type) && block.data?.url && (
                <>
                  {/* Media Size Control */}
                  <DropdownMenu open={showMediaSizeMenu} onOpenChange={setShowMediaSizeMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium mb-2">Media Size</div>
                        {MEDIA_SIZES.map((size) => (
                          <DropdownMenuItem
                            key={size.value}
                            onClick={() => updateProperties({ mediaWidth: size.value })}
                          >
                            {size.name}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Media Alignment */}
                  <DropdownMenu open={showMediaAlignMenu} onOpenChange={setShowMediaAlignMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {block.properties?.mediaAlignment === "center" ? (
                          <AlignCenter className="h-3 w-3" />
                        ) : block.properties?.mediaAlignment === "right" ? (
                          <AlignRight className="h-3 w-3" />
                        ) : (
                          <AlignLeft className="h-3 w-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <DropdownMenuItem onClick={() => updateProperties({ mediaAlignment: "left" })}>
                        <AlignLeft className="h-4 w-4 mr-2" /> Left
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ mediaAlignment: "center" })}>
                        <AlignCenter className="h-4 w-4 mr-2" /> Center
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ mediaAlignment: "right" })}>
                        <AlignRight className="h-4 w-4 mr-2" /> Right
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {/* Text Controls */}
              {!["image", "video", "audio"].includes(block.type) && (
                <>
                  {/* Bold */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${isBold ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                    onClick={() => document.execCommand("bold", false, undefined)}
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  {/* Italic */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${isItalic ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                    onClick={() => document.execCommand("italic", false, undefined)}
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  {/* Underline */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${block.properties?.underline ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                    onClick={() =>
                      updateProperties({
                        underline: !block.properties?.underline,
                      })
                    }
                  >
                    <Underline className="h-3 w-3" />
                  </Button>
                  {/* Strikethrough */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${block.properties?.strikethrough ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                    onClick={() =>
                      updateProperties({
                        strikethrough: !block.properties?.strikethrough,
                      })
                    }
                  >
                    <Strikethrough className="h-3 w-3" />
                  </Button>
                  {/* Text Size */}
                  <DropdownMenu open={showSizeMenu} onOpenChange={setShowSizeMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="text-xs font-bold">T</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium mb-2">Text Size</div>
                        {TEXT_SIZES.map((size) => (
                          <DropdownMenuItem key={size.value} onClick={() => updateProperties({ fontSize: size.value })}>
                            <span style={{ fontSize: size.value }}>{size.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Text Case */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="text-xs font-bold">Aa</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <DropdownMenuItem onClick={() => updateProperties({ textTransform: "none" })}>
                        Normal Case
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ textTransform: "uppercase" })}>
                        UPPERCASE
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ textTransform: "lowercase" })}>
                        lowercase
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ textTransform: "capitalize" })}>
                        Capitalize
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Text Alignment */}
                  <DropdownMenu open={showAlignMenu} onOpenChange={setShowAlignMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {block.properties?.alignment === "center" ? (
                          <AlignCenter className="h-3 w-3" />
                        ) : block.properties?.alignment === "right" ? (
                          <AlignRight className="h-3 w-3" />
                        ) : block.properties?.alignment === "justify" ? (
                          <AlignJustify className="h-3 w-3" />
                        ) : (
                          <AlignLeft className="h-3 w-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <DropdownMenuItem onClick={() => updateProperties({ alignment: "left" })}>
                        <AlignLeft className="h-4 w-4 mr-2" /> Left
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ alignment: "center" })}>
                        <AlignCenter className="h-4 w-4 mr-2" /> Center
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ alignment: "right" })}>
                        <AlignRight className="h-4 w-4 mr-2" /> Right
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProperties({ alignment: "justify" })}>
                        <AlignJustify className="h-4 w-4 mr-2" /> Justify
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Font Selector */}
                  <DropdownMenu open={showFontMenu} onOpenChange={setShowFontMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Type className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {FONTS.map((font) => (
                          <button
                            key={font.value}
                            className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            style={{ fontFamily: font.value }}
                            onClick={() => updateProperties({ fontFamily: font.value })}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Emoji Picker */}
                  <DropdownMenu open={showEmojiMenu} onOpenChange={setShowEmojiMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Smile className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <div className="p-2">
                        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-lg"
                              onClick={() => insertEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Color Picker */}
                  <DropdownMenu open={showStyleMenu} onOpenChange={setShowStyleMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Palette className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[70vh] overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium mb-2">Text Color</div>
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"].map(
                            (color) => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border-2 border-gray-200"
                                style={{ backgroundColor: color }}
                                onClick={() => updateProperties({ color })}
                              />
                            ),
                          )}
                        </div>
                        <div className="text-xs font-medium mb-2">Background</div>
                        <div className="flex gap-1 flex-wrap">
                          {[
                            "transparent",
                            "#fef3c7",
                            "#fecaca",
                            "#fed7d7",
                            "#d1fae5",
                            "#dbeafe",
                            "#e9d5ff",
                            "#fce7f3",
                          ].map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border-2 border-gray-200"
                              style={{ backgroundColor: color }}
                              onClick={() => updateProperties({ backgroundColor: color })}
                            />
                          ))}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Page Creation Dialog */}
      <PageCreationDialog
        open={showPageDialog}
        onOpenChange={setShowPageDialog}
        parentPageId={pageId}
        blockId={block.id}
        onComplete={(newPageId) => {
          // Navigate to the new page when created from block editor
          dispatch({ type: "SET_CURRENT_PAGE", payload: newPageId })
        }}
        currentBlock={block} // Add this line
      />
    </>
  )
}
