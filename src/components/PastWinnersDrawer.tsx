import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Recipe {
  id: string
  title: string
  rating_avg: number
  rating_count: number
  created_at: string
}

interface PastWinnersDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function PastWinnersDrawer({ isOpen, onClose }: PastWinnersDrawerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTopRecipes()
    }
  }, [isOpen])

  const loadTopRecipes = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('rating_avg', 4)
        .order('rating_avg', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading top recipes:', error)
        return
      }

      setRecipes(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-slate-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50">
        <div className="p-8 border-b border-slate-200/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Top Recipes</h2>
                <p className="text-slate-500 text-sm">
                  Your highest-rated family favorites
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-500">Loading your top recipes...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium mb-2">No top recipes yet</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Start rating your recipes to see your family favorites here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe, index) => (
                <div
                  key={recipe.id}
                  className="border border-slate-200/50 rounded-2xl p-6 hover:bg-slate-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-lg mb-2">{recipe.title}</h3>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {renderStars(recipe.rating_avg)}
                            <span className="text-sm text-slate-600 font-medium">
                              {recipe.rating_avg.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">
                            {recipe.rating_count} rating{recipe.rating_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs rounded-full font-medium border border-yellow-200/50">
                        ⭐ Winner
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
