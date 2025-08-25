import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import NotificationList from './components/NotificationList'
import UserDetail from './components/UserDetail'
import ChurnManagement from './components/ChurnManagement'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/notification-list" element={<NotificationList />} />
          <Route path="/churn-management" element={<ChurnManagement />} />
          <Route path="/user/:id" element={<UserDetail />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
