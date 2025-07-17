export type BlockType =
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "bullet-list"
  | "numbered-list"
  | "quote"
  | "code"
  | "divider"
  | "image"
  | "video"
  | "audio"
  | "table"
  | "database"
  | "page"
  | "paragraph"

export type BlockProperties = {
  color?: string
  backgroundColor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  alignment?: "left" | "center" | "right" | "justify"
  fontFamily?: string
  fontSize?: string
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
  indent?: boolean
  mediaWidth?: string
  mediaAlignment?: "left" | "center" | "right"
}

export type BlockData = {
  file?: File
  url?: string
  name?: string
  size?: number
  type?: string
  headers?: string[]
  rows?: string[][]
  columns?: { id: string; name: string; type: string; options?: string[] }[]
  views?: { id: string; name: string; type: string }[]
  pageId?: string // For page reference blocks
}

export type Block = {
  id: string
  type: BlockType
  content: string
  properties?: BlockProperties
  data?: BlockData
}

export type Page = {
  id: string
  title: string
  icon: string
  parentId?: string
  content: Block[]
  createdAt: Date
  updatedAt: Date
  isFolder: boolean
  isDeleted?: boolean
}

export type AppState = {
  pages: Page[]
  currentPageId: string | null
  favorites: string[]
  currentView: "pages" | "trash" | "settings" // Changed from settingsOpen/trashOpen booleans
  activeDragId: string | null // New: ID of the currently dragged item (page or block)
  selectedText: {
    blockId: string
    start: number
    end: number
    text: string
  } | null
  theme: "light" | "dark" | "system"
  sidebarOpen: boolean
  contentWidth: "full" | "half"
  selectedTrashPageIds: string[] // New state for selected trash pages
}

export type AppAction =
  | { type: "INITIALIZE_STATE"; payload: AppState }
  | { type: "ADD_PAGE"; payload: Page }
  | { type: "SET_CURRENT_PAGE"; payload: string }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "DELETE_PAGE"; payload: string }
  | { type: "RESTORE_PAGE"; payload: string }
  | { type: "DUPLICATE_PAGE"; payload: string }
  | { type: "SET_ACTIVE_DRAG_ID"; payload: string | null } // Updated: for dnd-kit active item
  | {
      type: "REORDER_BLOCKS"
      payload: { pageId: string; fromIndex: number; toIndex: number }
    }
  | {
      type: "UPDATE_BLOCK"
      payload: { pageId: string; blockId: string; updates: Partial<Block> }
    }
  | {
      type: "ADD_BLOCK"
      payload: { pageId: string; afterBlockId?: string; type: BlockType }
    }
  | { type: "DELETE_BLOCK"; payload: { pageId: string; blockId: string } }
  | {
      type: "CONVERT_BLOCK_INLINE"
      payload: { pageId: string; blockId: string; type: BlockType; keepContent: boolean }
    }
  | {
      type: "ADD_LIST_ITEM"
      payload: { pageId: string; blockId: string; indent: boolean }
    }
  | { type: "SET_CURRENT_VIEW"; payload: "pages" | "trash" | "settings" } // Updated action
  | { type: "SET_SELECTED_TEXT"; payload: { blockId: string; start: number; end: number; text: string } | null }
  | {
      type: "ADD_PAGE_REFERENCE"
      payload: { pageId: string; blockId: string; referencePageId: string }
    }
  | {
      type: "ADD_PAGE_REFERENCE_TO_PARENT"
      payload: { parentPageId: string; referencePageId: string }
    }
  | { type: "SET_THEME"; payload: "light" | "dark" | "system" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_CONTENT_WIDTH" }
  | { type: "TOGGLE_SELECT_TRASH_PAGE"; payload: string } // New: Toggle selection for a single trash page
  | { type: "SELECT_ALL_TRASH_PAGES"; payload: boolean } // New: Select/deselect all trash pages
  | { type: "PERMANENTLY_DELETE_PAGE"; payload: string } // New: Permanently delete a single page
  | { type: "PERMANENTLY_DELETE_SELECTED_TRASH"; payload: string[] } // New: Permanently delete selected trash pages
  | { type: "PERMANENTLY_DELETE_ALL_TRASH" } // New: Permanently delete all trash pages
  | { type: "RESTORE_SELECTED_TRASH"; payload: string[] } // New: Restore selected trash pages
  | { type: "RESTORE_ALL_TRASH" } // New: Restore all trash pages
  | { type: "UPDATE_PAGE_PARENT"; payload: { pageId: string; newParentId?: string } } // New: Update page parent
  | { type: "UPDATE_PAGE_TITLE"; payload: { pageId: string; newTitle: string } } // New: Update page title
