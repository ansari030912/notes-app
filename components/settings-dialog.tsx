"use client"

import { useApp } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { useCallback, useEffect } from "react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { state, dispatch } = useApp()
  const { setTheme, theme } = useTheme()

  // Sync internal app state theme with next-themes
  useEffect(() => {
    if (theme && state.theme !== theme) {
      dispatch({ type: "SET_THEME", payload: theme as "light" | "dark" | "system" })
    }
  }, [theme, state.theme, dispatch])

  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value)
      dispatch({ type: "SET_THEME", payload: value as "light" | "dark" | "system" })
    },
    [setTheme, dispatch],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your application settings.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="text-right">
              Theme
            </Label>
            <RadioGroup
              value={state.theme}
              onValueChange={handleThemeChange}
              className="col-span-3 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">System</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content-width" className="text-right">
              Content Width
            </Label>
            <RadioGroup
              value={state.contentWidth}
              onValueChange={(value) => dispatch({ type: "TOGGLE_CONTENT_WIDTH" })} // Toggle action
              className="col-span-3 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="half" id="half" />
                <Label htmlFor="half">Half</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
