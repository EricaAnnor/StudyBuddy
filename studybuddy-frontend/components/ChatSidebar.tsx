"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Clock, UserPlus } from "lucide-react"
import { useAppDispatch,useAppSelector } from "@/store/hooks"
import Groups from "./group"
import Friends from "./friends"
import Recents from "./recents"
import { updateTab } from "@/store/chatSlice";


// TypeScript interface for user data structure
interface User {
  id: number
  name: string
  description: string
  avatar: string
  isOnline: boolean
  lastMessage: string
  unreadCount: number
  timestamp: string
  isGroup?: boolean
}

// Props interface for the ChatSidebar component
// interface ChatSidebarProps {
//   users: User[]
//   selectedChat: User
//   onSelectChat: (user: User) => void
// }

export default function ChatSidebar(){
  // State for active tab (Recents, Friends, Groups)
  // const [activeTab, setActiveTab] = useState<"recents" | "friends" | "groups">("recents")
  const [searchQuery, setSearchQuery] = useState("")
  const curTab = useAppSelector((state) => state.chatReducer.cur_tab);
  const dispatch = useAppDispatch()

  


  // Filter users based on active tab and search query
  const renderTabContent = () => {
    switch (curTab) {
      case "groups":
        return <Groups />;
      case "friends":
        return <Friends />;
      case "recent":
      default:
        return <Recents />;
    }
  };

  return (
    <div className="w-80 flex flex-col h-full">
      {/* Search bar for finding chats */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-500 rounded-lg focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 transition-all"
          />
        </div>
      </div>

      {/* Tab navigation for Recents, Friends, Groups */}
      <div className="flex border-b border-gray-700/50">
        <Button
          variant="ghost"
          onClick={() => dispatch(updateTab({ cur_tab:"recent" }))}
          className={`flex-1 rounded-none py-3 transition-all ${
            curTab === "recent"
              ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/5"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Recents
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch(updateTab({ cur_tab:"friends" }))}
          className={`flex-1 rounded-none py-3 transition-all ${
            curTab === "friends"
              ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/5"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Friends
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch(updateTab({ cur_tab:"groups" }))}
          className={`flex-1 rounded-none py-3 transition-all ${
            curTab === "groups"
              ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/5"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Groups
        </Button>
      </div>

      {/* Scrollable list of conversations/contacts */}
      <div>{renderTabContent()}</div>

      {/*  */}
    </div>
  )
}


