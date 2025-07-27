import { useState } from 'react'

export function AdminView() {
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowAdmin(!showAdmin)}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Admin View</span>
      </button>

      {showAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
                  <p className="text-sm text-gray-500">User activity and statistics</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdmin(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 How to View All Users and Messages</h3>
                <p className="text-blue-700 mb-4">
                  To see all users and their message statistics, use these SQL queries in your Supabase SQL Editor:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">1. All Users with Message Counts:</h4>
                    <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`SELECT 
  u.email,
  u.id as user_id,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
  MIN(m.created_at) as first_message,
  MAX(m.created_at) as last_message
FROM auth.users u
LEFT JOIN messages m ON u.id = m.user_id
GROUP BY u.id, u.email
ORDER BY total_messages DESC;`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">2. All Messages with User Emails:</h4>
                    <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`SELECT 
  m.id,
  m.role,
  m.content,
  m.created_at,
  u.email,
  u.id as user_id
FROM messages m
JOIN auth.users u ON m.user_id = u.id
ORDER BY m.created_at DESC;`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">3. Recent Activity (Last 7 Days):</h4>
                    <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`SELECT 
  u.email,
  m.role,
  m.content,
  m.created_at
FROM messages m
JOIN auth.users u ON m.user_id = u.id
WHERE m.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.email, m.created_at DESC;`}
                    </pre>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">🔐 Security Note:</h4>
                  <p className="text-yellow-700 text-sm">
                    These queries require access to the `auth.users` table. In production, you should implement proper admin authentication and authorization before exposing user data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
