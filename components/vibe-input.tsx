"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Lightbulb } from "lucide-react"
import { validateVibeText } from "@/lib/validation"
import { SuggestionService } from "@/lib/suggestion-service"

interface VibeInputProps {
  onSubmit: (text: string) => void
  isLoading?: boolean
  selectedCity?: string
}

export function VibeInput({ onSubmit, isLoading = false, selectedCity }: VibeInputProps) {
  const [text, setText] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const smartSuggestions = useMemo(() => {
    if (!selectedCity) return []
    return SuggestionService.generateSmartSuggestions(selectedCity)
  }, [selectedCity])

  const filteredSuggestions = useMemo(() => {
    return SuggestionService.filterSuggestionsByInput(smartSuggestions, text)
  }, [smartSuggestions, text])

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

          {selectedCity && filteredSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {text.trim() ? "Sugerencias relacionadas:" : "Ideas para tu ciudad:"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    disabled={isLoading}
                    className="text-xs hover:bg-primary/10 hover:border-primary/20"
                  >
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

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
