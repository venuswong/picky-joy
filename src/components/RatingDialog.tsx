import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface RatingDialogProps {
  isOpen: boolean
  onClose: () => void
  recipeId: string
  recipeTitle: string
}

export function RatingDialog({ isOpen, onClose, recipeId, recipeTitle }: RatingDialogProps) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (stars === 0) return

    setSubmitting(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Insert rating
      const { error: ratingError } = await supabase
        .from('ratings')
        .insert({
          recipe_id: recipeId,
          user_id: user.user.id,
          rating: stars,
          comment: comment.trim() || null
        })

      if (ratingError) {
        console.error('Error saving rating:', ratingError)
        return
      }

      // Update recipe rating averages
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('recipe_id', recipeId)

      if (ratings) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        const ratingCount = ratings.length

        await supabase
          .from('recipes')
          .update({
            rating_avg: avgRating,
            rating_count: ratingCount
          })
          .eq('id', recipeId)
      }

      onClose()
      setStars(0)
      setComment('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <span className="text-yellow-600 text-xl">⭐</span>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Rate this Recipe
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      How did "{recipeTitle}" turn out?
                    </p>
                    
                    <div className="flex justify-center sm:justify-start space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStars(star)}
                          className={`text-2xl ${stars >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional: Share your experience with this recipe..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={stars === 0 || submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
