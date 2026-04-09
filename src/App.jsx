import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router";
import { useEffect } from 'react'
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import BaseLayout from "./layouts/BaseLayout";
import Dashboard from "./pages/Dashboard";
import CultureFitScorer from "./pages/culture";
import Videos from "./pages/Videos";
import VideoPlayer from "./components/videos/VideoPlayer";
import Liked from "./pages/Liked";
import Trending from "./pages/Trending";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import { useAppStore } from "../src/store/appStore";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  } 

  return children
}

function RootRedirect() {
  const { isAuthenticated } = useAppStore()
  
  if (isAuthenticated()) {
    return <Landing />
  }
  
  return <Landing />
}

export default function App() {
  const { initialize, isInitialized } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/app" element={
          <ProtectedRoute>
            <BaseLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="videos" element={<Videos />} />
          <Route path="video/:videoId" element={<VideoPlayer />} />
          <Route path="liked" element={<Liked />} /> 
          <Route path="culture" element={<CultureFitScorer />} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}