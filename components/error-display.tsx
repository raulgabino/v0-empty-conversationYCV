"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoHome?: () => void
  showHomeButton?: boolean
}

export function ErrorDisplay({
  title = "Error",
  message,
  onRetry,
  onGoHome,
  showHomeButton = true,
}: ErrorDisplayProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
          )}
          {showHomeButton && onGoHome && (
            <Button onClick={onGoHome} variant="outline" className="flex-1 bg-transparent">
              <Home className="mr-2 h-4 w-4" />
              Inicio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
