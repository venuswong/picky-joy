import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { RatingDialog } from './RatingDialog'

interface Recipe {
  id: string
  title: string
  ingredients: string[]
  instructions: string
  nutrition_info?: any
}

interface RecipeExtractorProps {
  messageContent: string
  onRecipeExtracted?: (recipe: Recipe) => void
}

export function RecipeExtractor({ messageContent, onRecipeExtracted }: RecipeExtractorProps) {
  const [showRating, setShowRating] = useState(false)
  const [extractedRecipe, setExtractedRecipe] = useState<Recipe | null>(null)

  const extractRecipe = (content: string): Recipe | null => {
    // Look for recipe patterns in the AI response
    const recipePatterns = [
      // Pattern 1: **Recipe Name**: [Name]
      {
        titleRegex: /\*\*Recipe Name\*\*:\s*([^\n]+)/i,
        ingredientsRegex: /\*\*Ingredients\*\*:\s*([\s\S]*?)(?=\*\*Instructions\*\*|\*\*Tips\*\*|$)/i,
        instructionsRegex: /\*\*Instructions\*\*:\s*([\s\S]*?)(?=\*\*Tips\*\*|$)/i
      },
      // Pattern 2: Recipe: [Name]
      {
        titleRegex: /Recipe:\s*([^\n]+)/i,
        ingredientsRegex: /Ingredients:\s*([\s\S]*?)(?=Instructions:|Steps:|$)/i,
        instructionsRegex: /(?:Instructions|Steps):\s*([\s\S]*?)(?=Tips:|$)/i
      },
      // Pattern 3: [Name] Recipe
      {
        titleRegex: /^([^:\n]+?)\s*Recipe/i,
        ingredientsRegex: /Ingredients:\s*([\s\S]*?)(?=Instructions:|Steps:|$)/i,
        instructionsRegex: /(?:Instructions|Steps):\s*([\s\S]*?)(?=Tips:|$)/i
      }
    ]

    for (const pattern of recipePatterns) {
      const titleMatch = content.match(pattern.titleRegex)
      const ingredientsMatch = content.match(pattern.ingredientsRegex)
      const instructionsMatch = content.match(pattern.instructionsRegex)

      if (titleMatch && ingredientsMatch) {
        const title = titleMatch[1].trim()
        const ingredientsText = ingredientsMatch[1].trim()
        const instructionsText = instructionsMatch ? instructionsMatch[1].trim() : ''

        // Parse ingredients into array
        const ingredients = ingredientsText
          .split(/[•\-\*]/)
          .map(item => item.trim())
          .filter(item => item.length > 0)

        // Parse instructions into array
        const instructions = instructionsText
          .split(/[•\-\*]/)
          .map(item => item.trim())
          .filter(item => item.length > 0)

        if (ingredients.length > 0) {
          return {
            id: Date.now().toString(), // Temporary ID
            title,
            ingredients,
            instructions: instructions.length > 0 ? instructions.join('\n') : instructionsText
          }
        }
      }
    }

    return null
  }

  const handleExtractAndSave = async () => {
    const recipe = extractRecipe(messageContent)
    if (!recipe) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // Save recipe to database
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: session.user.id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrition_info: recipe.nutrition_info || null
        })
        .select()
        .single()

      if (error) throw error

      const savedRecipe = {
        ...recipe,
        id: data.id
      }

      setExtractedRecipe(savedRecipe)
      setShowRating(true)

      if (onRecipeExtracted) {
        onRecipeExtracted(savedRecipe)
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  }

  const hasRecipe = extractRecipe(messageContent) !== null

  if (!hasRecipe) return null

  return (
    <>
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-yellow-800">🍽️ Recipe Detected!</h4>
            <p className="text-sm text-yellow-700 mt-1">
              I found a recipe in this response. Would you like to save it and rate it later?
            </p>
          </div>
          <button
            onClick={handleExtractAndSave}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
          >
            Save Recipe
          </button>
        </div>
      </div>

      {extractedRecipe && (
        <RatingDialog
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          recipeId={extractedRecipe.id}
          recipeTitle={extractedRecipe.title}
        />
      )}
    </>
  )
}
