import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

// Mock data generator
const generateMockNotifications = (count = 1000) => {
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
  
  const names = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
    'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Amanda Rodriguez',
    'Christopher Lee', 'Jessica White', 'Daniel Thompson', 'Ashley Clark', 'Matthew Lewis',
    'Nicole Hall', 'Joshua Allen', 'Stephanie Young', 'Andrew King', 'Rebecca Wright'
  ]

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    userName: names[Math.floor(Math.random() * names.length)],
    notificationName: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    userId: Math.floor(Math.random() * 1000) + 1
  }))
}

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Success':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
      case 'Failed':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
      case 'None':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
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

function NotificationList() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [outcomeFilter, setOutcomeFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })
  const [showFilters, setShowFilters] = useState(false)

  // Generate mock data on component mount
  useEffect(() => {
    const mockData = generateMockNotifications(1000)
    setNotifications(mockData)
    setLoading(false)
  }, [])

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = searchTerm === '' || 
        notification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.notificationName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPlatform = platformFilter === 'All' || notification.platform === platformFilter
      const matchesOutcome = outcomeFilter === 'All' || notification.outcome === outcomeFilter
      
      return matchesSearch && matchesPlatform && matchesOutcome
    })

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue)
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [notifications, searchTerm, platformFilter, outcomeFilter, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = processedData.slice(startIndex, endIndex)

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle row click
  const handleRowClick = (userId) => {
    navigate(`/user/${userId}`)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setPlatformFilter('All')
    setOutcomeFilter('All')
    setCurrentPage(1)
  }

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpIcon className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 text-blue-600" />
      : <ArrowDownIcon className="h-4 w-4 text-blue-600" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Notification List</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/churn-management')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Churn Management
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Hi, Customer Name 👋
          </h2>
          <p className="text-gray-600 mt-1">
            Here are your recent notifications and alerts
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username or notification name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Filters and View Options */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>

            {(platformFilter !== 'All' || outcomeFilter !== 'All' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Platforms</option>
                    <option value="Mobile">Mobile</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                {/* Outcome Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome
                  </label>
                  <select
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Outcomes</option>
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of {processedData.length} notifications
          </p>
          {processedData.length === 0 && (
            <p className="text-sm text-gray-500">
              No notifications found matching your criteria
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('userName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  User Name {getSortIcon('userName')}
                </th>
                <th
                  onClick={() => handleSort('notificationName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Notification Name {getSortIcon('notificationName')}
                </th>
                <th
                  onClick={() => handleSort('platform')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Platform {getSortIcon('platform')}
                </th>
                <th
                  onClick={() => handleSort('outcome')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Outcome {getSortIcon('outcome')}
                </th>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Timestamp {getSortIcon('timestamp')}
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map(notification => (
                <tr key={notification.id} onClick={() => handleRowClick(notification.userId)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {notification.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notification.notificationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <PlatformBadge platform={notification.platform} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge status={notification.outcome} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(notification.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        handleRowClick(notification.userId);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default NotificationList
