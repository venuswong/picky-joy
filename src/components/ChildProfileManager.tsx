import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface ChildProfile {
  id: string
  name: string
  age: number | null
  preferences: string[]
  allergies: string[]
  created_at: string
}

interface ChildProfileManagerProps {
  isOpen: boolean
  onClose: () => void
  onProfileSelect?: (profile: ChildProfile) => void
}

export function ChildProfileManager({ isOpen, onClose, onProfileSelect }: ChildProfileManagerProps) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [preferences, setPreferences] = useState('')
  const [allergies, setAllergies] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadProfiles()
    }
  }, [isOpen])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading profiles:', error)
        return
      }

      setProfiles(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setAge('')
    setPreferences('')
    setAllergies('')
    setEditingProfile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const profileData = {
        name: name.trim(),
        age: age ? parseInt(age) : null,
        preferences: preferences.trim() ? preferences.split(',').map(p => p.trim()) : [],
        allergies: allergies.trim() ? allergies.split(',').map(a => a.trim()) : []
      }

      if (editingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('child_profiles')
          .update(profileData)
          .eq('id', editingProfile.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('child_profiles')
          .insert({
            ...profileData,
            user_id: session.user.id
          })

        if (error) throw error
      }

      await loadProfiles()
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (profile: ChildProfile) => {
    setEditingProfile(profile)
    setName(profile.name)
    setAge(profile.age?.toString() || '')
    setPreferences(profile.preferences.join(', '))
    setAllergies(profile.allergies.join(', '))
    setShowForm(true)
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('child_profiles')
        .delete()
        .eq('id', profileId)

      if (error) throw error

      await loadProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (profile: ChildProfile) => {
    if (onProfileSelect) {
      onProfileSelect(profile)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Family Members</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage your family members to personalize recipe suggestions.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Child's name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Age in years"
                  min="1"
                  max="18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Preferences
                </label>
                <input
                  type="text"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="pasta, chicken, smooth textures (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies & Restrictions
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="nuts, dairy, gluten (comma separated)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProfile ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading profiles...</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No family members added yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add your first family member to get personalized recipe suggestions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{profile.name}</h3>
                            {profile.age && (
                              <span className="text-sm text-gray-500">({profile.age} years)</span>
                            )}
                          </div>
                          
                          {profile.preferences.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-500">Likes:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {profile.preferences.map((pref, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                  >
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {profile.allergies.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-500">Allergies:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {profile.allergies.map((allergy, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                                  >
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          {onProfileSelect && (
                            <button
                              onClick={() => handleSelect(profile)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Select
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(profile)}
                            className="px-3 py-1 text-gray-600 border border-gray-300 text-sm rounded hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            className="px-3 py-1 text-red-600 border border-red-300 text-sm rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  + Add Family Member
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
