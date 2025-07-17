"use client";

import type React from "react";
import { createContext, useReducer, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AppState, AppAction, Page, Block } from "@/types";

const initialPages: Page[] = [
  {
    id: "1",
    title: "Fillinx Solutions",
    icon: "👋",
    content: [
      {
        id: uuidv4(),
        type: "heading1",
        content: "Welcome to Page Creation",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "text",
        content: "This is your first page. You can start typing here.",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "text",
        content:
          "Try typing '/' for commands or select text and press Ctrl+M for formatting.",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "heading2",
        content: "Features:",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "bullet-list",
        content: "Nested pages and subpages",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "bullet-list",
        content: "Text formatting (bold, italic, underline, strikethrough)",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "bullet-list",
        content: "Drag and drop to reorder blocks and pages",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "bullet-list",
        content: "Favorites and Trash",
        properties: {},
      },
      {
        id: uuidv4(),
        type: "text",
        content: "Feel free to explore and create your own notes!",
        properties: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isFolder: false,
  },
  {
    id: "2",
    title: "My Projects",
    icon: "📁",
    content: [
      {
        id: uuidv4(),
        type: "text",
        content: "This is a project folder.",
        properties: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isFolder: true,
  },
  {
    id: "3",
    title: "Meeting Notes",
    icon: "📝",
    parentId: "2",
    content: [
      {
        id: uuidv4(),
        type: "text",
        content: "Notes from the weekly meeting.",
        properties: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isFolder: false,
  },
  {
    id: "4",
    title: "Ideas",
    icon: "💡",
    parentId: "2",
    content: [
      {
        id: uuidv4(),
        type: "text",
        content: "Brainstorming new features.",
        properties: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isFolder: false,
  },
];

const initialState: AppState = {
  pages: initialPages,
  currentPageId: "1",
  favorites: [],
  currentView: "pages", // Default view
  activeDragId: null, // Initialize activeDragId
  selectedText: null,
  theme: "system", // Default theme
  sidebarOpen: true, // Sidebar open by default
  contentWidth: "half", // Default content width
  selectedTrashPageIds: [], // Initialize selected trash pages
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INITIALIZE_STATE":
      return action.payload;
    case "ADD_PAGE": {
      const newPage = action.payload;
      return {
        ...state,
        pages: [...state.pages, newPage],
      };
    }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPageId: action.payload };
    case "TOGGLE_FAVORITE": {
      const pageId = action.payload;
      const newFavorites = state.favorites.includes(pageId)
        ? state.favorites.filter((id) => id !== pageId)
        : [...state.favorites, pageId];
      return { ...state, favorites: newFavorites };
    }
    case "DELETE_PAGE": {
      const pageIdToDelete = action.payload;
      const pagesToMarkDeleted: string[] = [pageIdToDelete];

      // If deleting a folder, mark all its children as deleted too
      const findChildren = (parentId: string) => {
        state.pages.forEach((page) => {
          if (page.parentId === parentId && !page.isDeleted) {
            pagesToMarkDeleted.push(page.id);
            if (page.isFolder) {
              findChildren(page.id);
            }
          }
        });
      };
      findChildren(pageIdToDelete);

      return {
        ...state,
        pages: state.pages.map((page) =>
          pagesToMarkDeleted.includes(page.id)
            ? { ...page, isDeleted: true }
            : page
        ),
        currentPageId: pagesToMarkDeleted.includes(state.currentPageId || "")
          ? null
          : state.currentPageId,
        selectedTrashPageIds: [], // Clear selection when a page is moved to trash
      };
    }
    case "RESTORE_PAGE": {
      const pageIdToRestore = action.payload;
      const pagesToRestore: string[] = [pageIdToRestore];

      // If restoring a child, restore its parent folders too
      const findParents = (childId: string) => {
        const childPage = state.pages.find((p) => p.id === childId);
        if (childPage && childPage.parentId) {
          if (!pagesToRestore.includes(childPage.parentId)) {
            pagesToRestore.push(childPage.parentId);
          }
          findParents(childPage.parentId);
        }
      };
      findParents(pageIdToRestore);

      return {
        ...state,
        pages: state.pages.map((page) =>
          pagesToRestore.includes(page.id)
            ? { ...page, isDeleted: false }
            : page
        ),
        selectedTrashPageIds: state.selectedTrashPageIds.filter(
          (id) => id !== pageIdToRestore
        ), // Remove from selection
      };
    }
    case "DUPLICATE_PAGE": {
      const pageIdToDuplicate = action.payload;
      const pageToDuplicate = state.pages.find(
        (p) => p.id === pageIdToDuplicate
      );

      if (!pageToDuplicate) return state;

      const duplicatePage: Page = {
        ...pageToDuplicate,
        id: uuidv4(),
        title: `${pageToDuplicate.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Duplicate content blocks with new IDs
        content: pageToDuplicate.content.map((block) => ({
          ...block,
          id: uuidv4(),
          data:
            block.type === "page" && block.data?.pageId
              ? { ...block.data }
              : undefined, // Keep page reference data
        })),
      };

      return {
        ...state,
        pages: [...state.pages, duplicatePage],
      };
    }
    case "SET_ACTIVE_DRAG_ID":
      return { ...state, activeDragId: action.payload };
    case "REORDER_BLOCKS": {
      const { pageId, fromIndex, toIndex } = action.payload;
      const pageIndex = state.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return state;

      const newPages = [...state.pages];
      const currentPage = { ...newPages[pageIndex] };
      const newContent = [...currentPage.content];
      const [movedBlock] = newContent.splice(fromIndex, 1);
      newContent.splice(toIndex, 0, movedBlock);

      currentPage.content = newContent;
      newPages[pageIndex] = currentPage;
      return { ...state, pages: newPages };
    }
    case "UPDATE_BLOCK": {
      const { pageId, blockId, updates } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                content: page.content.map((block) =>
                  block.id === blockId ? { ...block, ...updates } : block
                ),
              }
            : page
        ),
      };
    }
    case "ADD_BLOCK": {
      const { pageId, afterBlockId, type } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) => {
          if (page.id === pageId) {
            const newBlock: Block = {
              id: uuidv4(),
              type,
              content: "",
              properties: {},
            };
            const newContent = [...page.content];
            if (afterBlockId) {
              const blockIndex = newContent.findIndex(
                (block) => block.id === afterBlockId
              );
              if (blockIndex !== -1) {
                newContent.splice(blockIndex + 1, 0, newBlock);
              } else {
                newContent.push(newBlock); // Fallback: add to end if afterBlockId not found
              }
            } else {
              newContent.push(newBlock); // Add to end if no afterBlockId
            }
            return { ...page, content: newContent };
          }
          return page;
        }),
      };
    }
    case "DELETE_BLOCK": {
      const { pageId, blockId } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                content: page.content.filter((block) => block.id !== blockId),
              }
            : page
        ),
      };
    }
    case "CONVERT_BLOCK_INLINE": {
      const { pageId, blockId, type, keepContent } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                content: page.content.map((block) =>
                  block.id === blockId
                    ? {
                        ...block,
                        type,
                        content: keepContent ? block.content : "",
                        properties: {}, // Reset properties on type change
                        data: type === "page" ? { pageId: "" } : undefined, // Initialize data for page block
                      }
                    : block
                ),
              }
            : page
        ),
      };
    }
    case "ADD_LIST_ITEM": {
      const { pageId, blockId, indent } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) => {
          if (page.id === pageId) {
            const blockIndex = page.content.findIndex(
              (block) => block.id === blockId
            );
            if (blockIndex === -1) return page;

            const currentBlock = page.content[blockIndex];
            const newBlock: Block = {
              id: uuidv4(),
              type: currentBlock.type,
              content: "",
              properties: {
                ...currentBlock.properties,
                indent: indent || currentBlock.properties?.indent,
              },
            };
            const newContent = [...page.content];
            newContent.splice(blockIndex + 1, 0, newBlock);
            return { ...page, content: newContent };
          }
          return page;
        }),
      };
    }
    case "SET_CURRENT_VIEW":
      return {
        ...state,
        currentView: action.payload,
        selectedTrashPageIds: [],
      }; // Clear selection on view change
    case "SET_SELECTED_TEXT":
      return { ...state, selectedText: action.payload };
    case "ADD_PAGE_REFERENCE": {
      const { pageId, blockId, referencePageId } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                content: page.content.map((block) =>
                  block.id === blockId
                    ? {
                        ...block,
                        type: "page",
                        data: { pageId: referencePageId },
                        content: "", // Page blocks don't have content in textarea
                      }
                    : block
                ),
              }
            : page
        ),
      };
    }
    case "ADD_PAGE_REFERENCE_TO_PARENT": {
      const { parentPageId, referencePageId } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) => {
          if (page.id === parentPageId) {
            const newBlock: Block = {
              id: uuidv4(),
              type: "page",
              content: "",
              data: { pageId: referencePageId },
              properties: {},
            };
            // Append the new page reference block to the end of the parent page's content
            return {
              ...page,
              content: [...page.content, newBlock],
            };
          }
          return page;
        }),
      };
    }
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "TOGGLE_CONTENT_WIDTH":
      return {
        ...state,
        contentWidth: state.contentWidth === "half" ? "full" : "half",
      };
    case "TOGGLE_SELECT_TRASH_PAGE": {
      const pageId = action.payload;
      const newSelected = state.selectedTrashPageIds.includes(pageId)
        ? state.selectedTrashPageIds.filter((id) => id !== pageId)
        : [...state.selectedTrashPageIds, pageId];
      return { ...state, selectedTrashPageIds: newSelected };
    }
    case "SELECT_ALL_TRASH_PAGES": {
      const selectAll = action.payload;
      const allTrashPageIds = state.pages
        .filter((p) => p.isDeleted)
        .map((p) => p.id);
      return {
        ...state,
        selectedTrashPageIds: selectAll ? allTrashPageIds : [],
      };
    }
    case "PERMANENTLY_DELETE_PAGE": {
      const pageIdToDelete = action.payload;
      return {
        ...state,
        pages: state.pages.filter((page) => page.id !== pageIdToDelete),
        selectedTrashPageIds: state.selectedTrashPageIds.filter(
          (id) => id !== pageIdToDelete
        ),
        currentPageId:
          state.currentPageId === pageIdToDelete ? null : state.currentPageId,
      };
    }
    case "PERMANENTLY_DELETE_SELECTED_TRASH": {
      const idsToDelete = action.payload;
      return {
        ...state,
        pages: state.pages.filter((page) => !idsToDelete.includes(page.id)),
        selectedTrashPageIds: state.selectedTrashPageIds.filter(
          (id) => !idsToDelete.includes(id)
        ),
        currentPageId: idsToDelete.includes(state.currentPageId || "")
          ? null
          : state.currentPageId,
      };
    }
    case "PERMANENTLY_DELETE_ALL_TRASH": {
      return {
        ...state,
        pages: state.pages.filter((page) => !page.isDeleted),
        selectedTrashPageIds: [],
        currentPageId: state.pages.some(
          (p) => p.id === state.currentPageId && p.isDeleted
        )
          ? null
          : state.currentPageId,
      };
    }
    case "RESTORE_SELECTED_TRASH": {
      const idsToRestore = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          idsToRestore.includes(page.id) ? { ...page, isDeleted: false } : page
        ),
        selectedTrashPageIds: state.selectedTrashPageIds.filter(
          (id) => !idsToRestore.includes(id)
        ),
      };
    }
    case "RESTORE_ALL_TRASH": {
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.isDeleted ? { ...page, isDeleted: false } : page
        ),
        selectedTrashPageIds: [],
      };
    }
    case "UPDATE_PAGE_PARENT": {
      const { pageId, newParentId } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId ? { ...page, parentId: newParentId } : page
        ),
      };
    }
    case "UPDATE_PAGE_TITLE": {
      const { pageId, newTitle } = action.payload;
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.id === pageId
            ? { ...page, title: newTitle, updatedAt: new Date() }
            : page
        ),
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Optional: Persist state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("v0-notes-app-state");
    if (savedState) {
      // Re-parse dates correctly
      const parsedState = JSON.parse(savedState, (key, value) => {
        if (key === "createdAt" || key === "updatedAt") {
          return new Date(value);
        }
        return value;
      });
      dispatch({ type: "INITIALIZE_STATE", payload: parsedState });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("v0-notes-app-state", JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
