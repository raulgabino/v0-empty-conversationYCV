"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { validateVibeText } from "@/lib/validation"

interface VibeInputProps {
  onSubmit: (text: string) => void
  isLoading?: boolean
}

const VIBE_SUGGESTIONS = [
  "plan tranqui con café y parque",
  "quiero arte y cultura",
  "día relajado para fotos",
  "explorar museos y historia",
  "ambiente chill para caminar",
  "descubrir lugares icónicos",
]

export function VibeInput({ onSubmit, isLoading = false }: VibeInputProps) {
  const [text, setText] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = () => {
    const validation = validateVibeText(text)
    if (!validation.valid) {
      setValidationError(validation.error || "Texto inválido")
      return
    }

    setValidationError(null)
    onSubmit(text.trim())
  }

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion)
    setValidationError(null)
  }

  const handleTextChange = (value: string) => {
    setText(value)
    if (validationError) {
      setValidationError(null)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-card-foreground">¿Qué traes de vibra hoy?</h2>
          <p className="text-muted-foreground">
            Cuéntanos qué tipo de experiencia buscas y te armaremos el plan perfecto
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ej: plan tranqui con café y parque para fotos..."
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`min-h-[100px] resize-none ${validationError ? "border-destructive" : ""}`}
              disabled={isLoading}
            />
            {validationError && <p className="text-sm text-destructive">{validationError}</p>}
            <p className="text-xs text-muted-foreground">{text.length}/500 caracteres</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">O elige una sugerencia:</p>
            <div className="flex flex-wrap gap-2">
              {VIBE_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading || !!validationError}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando tu plan...
              </>
            ) : (
              "Armar plan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
