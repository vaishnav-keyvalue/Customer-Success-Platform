import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Mock user data generator
const generateMockUserData = (userId) => {
  const userNames = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
    'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Amanda Rodriguez'
  ]
  
  const userData = {
    id: userId,
    name: userNames[userId % userNames.length],
    email: `user${userId}@example.com`,
    phone: `+1 (555) ${String(userId).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: ['Active', 'Inactive', 'Suspended'][Math.floor(Math.random() * 3)],
    totalNotifications: Math.floor(Math.random() * 500) + 50,
    successfulNotifications: Math.floor(Math.random() * 400) + 30,
    failedNotifications: Math.floor(Math.random() * 100) + 5,
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  return userData
}

// Mock recent notifications for this user
const generateMockUserNotifications = (userId, count = 10) => {
  const platforms = ['Mobile', 'WhatsApp', 'Email', 'SMS']
  const outcomes = ['Success', 'Failed', 'None']
  const notificationTypes = [
    'Send the payment failed alert and complete the transaction',
    'Account verification reminder',
    'Password reset confirmation',
    'Welcome message for new user',
    'Subscription renewal notification',
    'Security alert for suspicious activity',
    'Payment confirmation receipt',
    'Account suspension warning',
    'Feature update announcement',
    'Maintenance schedule notification'
  ]
  
  return Array.from({ length: count }, (_, index) => ({
    id: `${userId}-${index + 1}`,
    notificationName: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    details: `Detailed information about this notification for user ${userId}. This includes additional context and metadata about the notification delivery and response.`
  }))
}

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Success':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircleIcon }
      case 'Failed':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: XCircleIcon }
      case 'None':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: ClockIcon }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: ClockIcon }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </span>
  )
}

// Platform badge component
const PlatformBadge = ({ platform }) => {
  const getPlatformConfig = (platform) => {
    switch (platform) {
      case 'Mobile':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
      case 'WhatsApp':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
      case 'Email':
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
      case 'SMS':
        return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    }
  }

  const config = getPlatformConfig(platform)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
      {platform}
    </span>
  )
}

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [userNotifications, setUserNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const loadUserData = async () => {
      setLoading(true)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockUserData = generateMockUserData(parseInt(id))
      const mockNotifications = generateMockUserNotifications(parseInt(id), 15)
      
      setUserData(mockUserData)
      setUserNotifications(mockNotifications)
      setLoading(false)
    }

    loadUserData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <UserIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The user you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/notification-list')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Notifications
          </button>
        </div>
      </div>
    )
  }

  const successRate = ((userData.successfulNotifications / userData.totalNotifications) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/notification-list')}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
              <p className="text-gray-600">User ID: {userData.id}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  {userData.email}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  {userData.phone}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Joined {new Date(userData.joinDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                userData.status === 'Active' ? 'bg-green-100 text-green-800' :
                userData.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {userData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{userData.totalNotifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{userData.successfulNotifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{userData.failedNotifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
            <p className="text-sm text-gray-500 mt-1">Latest notifications sent to this user</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {notification.notificationName}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {notification.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PlatformBadge platform={notification.platform} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={notification.outcome} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDetail
