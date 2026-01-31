"use client"

import * as React from "react"

import { errorEmitter } from "@/firebase/error-emitter"
import { useToast } from "@/hooks/use-toast"

export function FirebaseErrorListener() {
  const { toast } = useToast()

  React.useEffect(() => {
    const handlePermissionError = (error: Error) => {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Permission Error",
        description:
          "You do not have permission to perform this action. Check the console for details.",
      })
    }
    errorEmitter.on("permission-error", handlePermissionError)

    return () => {
      errorEmitter.off("permission-error", handlePermissionError)
    }
  }, [toast])

  return null
}
