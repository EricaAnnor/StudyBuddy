"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Settings, Bell, Menu, X, Users, Edit } from "lucide-react"
import ChatSidebar from "@/components/ChatSidebar"
import ChatRoom from "@/components/ChatRoom"
import EditProfile from "@/components/EditProfile"
import AllUsers from "@/components/AllUsers"

// Mock data for demonstration
const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    description: "Math Study Group Leader",
    avatar: "/woman-student.png",
    isOnline: true,
    lastMessage: "Let's review calculus tomorrow",
    unreadCount: 2,
    timestamp: "2 min ago",
  },
  {
    id: 2,
    name: "Mike Chen",
    description: "Computer Science Major",
    avatar: "/asian-male-student.png",
    isOnline: true,
    lastMessage: "Thanks for the coding help!",
    unreadCount: 0,
    timestamp: "5 min ago",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    description: "Biology Study Partner",
    avatar: "/latina-student.png",
    isOnline: false,
    lastMessage: "See you at the library",
    unreadCount: 1,
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    name: "Physics Study Group",
    description: "12 members",
    avatar: "/physics-group-icon.png",
    isOnline: true,
    lastMessage: "New assignment posted",
    unreadCount: 5,
    timestamp: "30 min ago",
    isGroup: true,
  },
]

export default function DashboardPage() {
  // State management for the main chat interface
  const [selectedChat, setSelectedChat] = useState(mockUsers[0])
  const [message, setMessage] = useState("")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAllUsersOpen, setIsAllUsersOpen] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const handleProfileSave = (profile: any) => {
    console.log("[v0] Profile saved:", profile)
    // Here you would typically send the data to your backend
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm shadow-lg px-4 md:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* StudyBuddy logo with mobile menu button */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button - only visible on small screens */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-2"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-white text-base md:text-lg font-bold">StudyBuddy</span>
          </div>

          {/* Right side icons - responsive sizing */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAllUsersOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-1.5 md:p-2"
              title="All Users"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-1.5 md:p-2"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-1.5 md:p-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <div
              className="w-6 h-6 md:w-7 md:h-7 bg-purple-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-purple-500 transition-colors relative group"
              onClick={() => setIsEditProfileOpen(true)}
              title="Edit Profile"
            >
              <span className="text-white text-xs font-medium">JD</span>
              <Edit className="absolute inset-0 w-3 h-3 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        {/* Sidebar - responsive positioning */}
        <div
          className={`
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          fixed md:relative z-40 md:z-0
          w-80 md:w-auto h-full md:h-auto
          top-0 md:top-auto left-0 md:left-auto
          pt-16 md:pt-4 p-4
          bg-gray-900/50 backdrop-blur-sm rounded-none md:rounded-xl 
          shadow-xl border-r md:border border-gray-800/50
        `}
        >
          {isEditProfileOpen ? (
            <EditProfile
              isOpen={isEditProfileOpen}
              onClose={() => setIsEditProfileOpen(false)}
              onSave={handleProfileSave}
              isEditing={isEditingProfile}
              setIsEditing={setIsEditingProfile}
              currentProfile={{
                username: "john_doe",
                email: "john@studybuddy.com",
                major: "Computer Science",
                bio: "Love learning and helping others succeed in their studies!",
                profile_pic: "",
              }}
            />
          ) : (
            <ChatSidebar
              users={mockUsers}
              selectedChat={selectedChat}
              onSelectChat={(chat) => {
                setSelectedChat(chat)
                setIsMobileSidebarOpen(false)
              }}
            />
          )}
        </div>

        {/* Chat room - responsive flex */}
        <div className="flex-1 p-4 md:pr-4 md:py-4 md:pl-0">
          <div className="h-full bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/50">
            <ChatRoom selectedChat={selectedChat} message={message} onMessageChange={setMessage} />
          </div>
        </div>
      </div>

      {/* Modal components */}
      <AllUsers isOpen={isAllUsersOpen} onClose={() => setIsAllUsersOpen(false)} />
    </div>
  )
}
