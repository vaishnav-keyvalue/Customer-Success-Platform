import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

function ChurnManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('events')

  // State for Churn Events
  const [churnEvents, setChurnEvents] = useState([
    {
      id: 1,
      name: 'Low Engagement Score',
      description: 'User engagement score drops below 30%',
      condition: 'engagement_score < 0.3',
      priority: 'High',
      isActive: true
    },
    {
      id: 2,
      name: 'No Login 7 Days',
      description: 'User has not logged in for 7 consecutive days',
      condition: 'last_login > 7 days',
      priority: 'Medium',
      isActive: true
    },
    {
      id: 3,
      name: 'Failed Payment',
      description: 'Payment failure detected',
      condition: 'payment_status == "failed"',
      priority: 'High',
      isActive: false
    }
  ])

  // State for Rulebook Rules
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'High Risk Customer Alert',
      triggerEvent: 'Low Engagement Score',
      conditions: 'AND account_age > 30 days',
      actions: ['Send Email', 'Create Task', 'Notify Manager'],
      isActive: true,
      frequency: 'Once per week'
    },
    {
      id: 2,
      name: 'Re-engagement Campaign',
      triggerEvent: 'No Login 7 Days',
      conditions: 'AND subscription_active == true',
      actions: ['Send SMS', 'Send In-App', 'Schedule Call'],
      isActive: true,
      frequency: 'Once per month'
    },
    {
      id: 3,
      name: 'Payment Recovery',
      triggerEvent: 'Failed Payment',
      conditions: 'AND retry_count < 3',
      actions: ['Send Email', 'Send SMS'],
      isActive: false,
      frequency: 'Daily'
    }
  ])

  // State for Templates
  const [templates, setTemplates] = useState({
    email: [
      {
        id: 1,
        name: 'Re-engagement Email',
        subject: 'We miss you! Come back and see what\'s new',
        content: 'Hi {{customer_name}},\n\nWe noticed you haven\'t been active lately. We\'ve added some exciting new features that we think you\'ll love!\n\nBest regards,\nThe Team',
        variables: ['customer_name', 'last_login_date'],
        isActive: true
      },
      {
        id: 2,
        name: 'Payment Failed Email',
        subject: 'Action Required: Update Your Payment Information',
        content: 'Hi {{customer_name}},\n\nWe were unable to process your payment. Please update your payment information to continue enjoying our services.\n\nRegards,\nBilling Team',
        variables: ['customer_name', 'amount_due'],
        isActive: true
      }
    ],
    sms: [
      {
        id: 1,
        name: 'Quick Re-engagement SMS',
        content: 'Hi {{customer_name}}! We miss you. Check out our new features: {{app_link}}',
        variables: ['customer_name', 'app_link'],
        isActive: true
      },
      {
        id: 2,
        name: 'Payment Reminder SMS',
        content: 'Payment failed for {{service_name}}. Update payment: {{payment_link}}',
        variables: ['service_name', 'payment_link'],
        isActive: true
      }
    ],
    inapp: [
      {
        id: 1,
        name: 'Welcome Back Banner',
        title: 'Welcome back!',
        content: 'Discover new features added since your last visit',
        actionText: 'Explore Now',
        variables: ['last_login_date'],
        isActive: true
      },
      {
        id: 2,
        name: 'Account Alert',
        title: 'Account Attention Needed',
        content: 'Please review your account settings',
        actionText: 'Review Settings',
        variables: ['account_status'],
        isActive: false
      }
    ]
  })

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [templateType, setTemplateType] = useState('email')

  const tabs = [
    { id: 'events', name: 'Churn Events', icon: ExclamationTriangleIcon },
    { id: 'rules', name: 'Rulebook Rules', icon: CheckCircleIcon },
    { id: 'templates', name: 'Templates', icon: ChatBubbleLeftRightIcon }
  ]

  const priorityColors = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-green-100 text-green-800 border-green-200'
  }

  const templateIcons = {
    email: EnvelopeIcon,
    sms: ChatBubbleLeftRightIcon,
    inapp: DevicePhoneMobileIcon
  }

  const handleAddEvent = () => {
    setEditingItem(null)
    setShowEventModal(true)
  }

  const handleAddRule = () => {
    setEditingItem(null)
    setShowRuleModal(true)
  }

  const handleAddTemplate = (type) => {
    setTemplateType(type)
    setEditingItem(null)
    setShowTemplateModal(true)
  }

  const renderEventsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Churn Events</h3>
          <p className="text-sm text-gray-500">Define triggers that indicate potential customer churn</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Event
        </button>
      </div>

      <div className="grid gap-4">
        {churnEvents.map((event) => (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-medium text-gray-900">{event.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[event.priority]}`}>
                    {event.priority}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{event.description}</p>
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">Condition: </span>
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{event.condition}</code>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Rulebook Rules</h3>
          <p className="text-sm text-gray-500">Define automated actions triggered by churn events</p>
        </div>
        <button
          onClick={handleAddRule}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rule.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Trigger Event:</span>
                    <p className="text-gray-600 mt-1">{rule.triggerEvent}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Frequency:</span>
                    <p className="text-gray-600 mt-1">{rule.frequency}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Conditions:</span>
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm block mt-1">{rule.conditions}</code>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Actions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.actions.map((action, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Communication Templates</h3>
        <p className="text-sm text-gray-500">Manage templates for different communication channels</p>
      </div>

      {/* Template Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {Object.keys(templates).map((type) => {
            const Icon = templateIcons[type]
            return (
              <button
                key={type}
                onClick={() => setTemplateType(type)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  templateType === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="capitalize">{type} Templates</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-900 capitalize">{templateType} Templates</h4>
        <button
          onClick={() => handleAddTemplate(templateType)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      <div className="grid gap-4">
        {templates[templateType].map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h5 className="text-lg font-medium text-gray-900">{template.name}</h5>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 space-y-3">
                  {templateType === 'email' && template.subject && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Subject:</span>
                      <p className="text-gray-600 mt-1">{template.subject}</p>
                    </div>
                  )}
                  {templateType === 'inapp' && template.title && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Title:</span>
                      <p className="text-gray-600 mt-1">{template.title}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Content:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{template.content}</p>
                    </div>
                  </div>
                  {templateType === 'inapp' && template.actionText && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Action Button:</span>
                      <p className="text-gray-600 mt-1">{template.actionText}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Variables:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events':
        return renderEventsTab()
      case 'rules':
        return renderRulesTab()
      case 'templates':
        return renderTemplatesTab()
      default:
        return renderEventsTab()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
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
              <h1 className="text-2xl font-bold text-gray-900">Churn Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Customer Retention 🎯
          </h2>
          <p className="text-gray-600 mt-1">
            Configure churn events, rules, and communication templates to retain customers
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          
          <div className="p-6">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChurnManagement