"use client"

import { MainContent } from "@/components/main-content"
import { Sidebar } from "@/components/sidebar"
import { useApp } from "@/context/app-context"
import { TrashView } from "@/components/trash-view" // Import TrashView
import { SettingsDialog } from "@/components/settings-dialog" // Import SettingsDialog

export default function Home() {
  const { state, dispatch } = useApp()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {state.currentView === "pages" && <MainContent />}
      {state.currentView === "trash" && <TrashView />}
      {state.currentView === "settings" && (
        <SettingsDialog open={true} onOpenChange={() => dispatch({ type: "SET_CURRENT_VIEW", payload: "pages" })} />
      )}
    </div>
  )
}
