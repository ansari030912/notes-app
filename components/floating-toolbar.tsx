"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/context/app-context"
import type { BlockType } from "@/types"
import { Bold, Italic, Underline, Strikethrough, Type, Code, Quote, List, ListOrdered, FileText } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface FloatingToolbarProps {
  blockId: string
  onUpdateBlock: (updates: { properties?: any }) => void
  onConvertBlock: (type: BlockType) => void
  position: { x: number; y: number }
}

export function FloatingToolbar({ blockId, onUpdateBlock, onConvertBlock, position }: FloatingToolbarProps) {
  const { state, dispatch } = useApp()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  const selectedBlock = state.pages.find((p) => p.id === state.currentPageId)?.content.find((b) => b.id === blockId)

  const selectedText = state.selectedText

  useEffect(() => {
    if (selectedText && selectedText.blockId === blockId) {
      setIsVisible(true)
      // Position the toolbar
      if (toolbarRef.current) {
        const toolbarWidth = toolbarRef.current.offsetWidth
        const toolbarHeight = toolbarRef.current.offsetHeight
        const x = position.x - toolbarWidth / 2
        const y = position.y - toolbarHeight - 10 // 10px above selection
        toolbarRef.current.style.left = `${x}px`
        toolbarRef.current.style.top = `${y}px`
      }
    } else {
      setIsVisible(false)
    }
  }, [selectedText, blockId, position])

  const applyFormatting = useCallback(
    (style: "bold" | "italic" | "underline" | "strikethrough") => {
      if (!selectedText || !selectedBlock) return

      const { start, end, text } = selectedText
      const currentContent = selectedBlock.content
      let newContent = currentContent

      // Simple markdown-like formatting
      const prefix = {
        bold: "**",
        italic: "*",
        underline: "__",
        strikethrough: "~~",
      }[style]

      const formattedText = `${prefix}${text}${prefix}`
      newContent = currentContent.slice(0, start) + formattedText + currentContent.slice(end)

      onUpdateBlock({ content: newContent })
      dispatch({ type: "SET_SELECTED_TEXT", payload: null }) // Clear selection after applying
    },
    [selectedText, selectedBlock, onUpdateBlock, dispatch],
  )

  const handleConvert = useCallback(
    (type: BlockType) => {
      onConvertBlock(type)
      dispatch({ type: "SET_SELECTED_TEXT", payload: null })
    },
    [onConvertBlock, dispatch],
  )

  if (!isVisible || !selectedBlock || !selectedText) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1 flex items-center gap-1"
      style={{
        transform: "translate(-50%, -100%)", // Center horizontally, move up
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      <Button variant="ghost" size="sm" onClick={() => applyFormatting("bold")}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => applyFormatting("italic")}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => applyFormatting("underline")}>
        <Underline className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => applyFormatting("strikethrough")}>
        <Strikethrough className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleConvert("text")}>
            <span className="mr-2">¶</span> Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("heading1")}>
            <span className="mr-2">H1</span> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("heading2")}>
            <span className="mr-2">H2</span> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("heading3")}>
            <span className="mr-2">H3</span> Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("bullet-list")}>
            <List className="h-4 w-4 mr-2" /> Bullet List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("numbered-list")}>
            <ListOrdered className="h-4 w-4 mr-2" /> Numbered List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("quote")}>
            <Quote className="h-4 w-4 mr-2" /> Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("code")}>
            <Code className="h-4 w-4 mr-2" /> Code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("page")}>
            <FileText className="h-4 w-4 mr-2" /> Page Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
