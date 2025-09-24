"use client"

import { useState, useRef,useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Plus, UserCheck, Clock, Search, Users } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { allUsersThunk } from "@/store/allUsers"

// User interface for the all users component
type isFriendFormat = "accepted" | "rejected" | "blocked" | "not_friend" | "pending";

interface User {
  user_id: string;
  username: string;
  email: string;
  major: string | null;
  bio: string | null;
  profile_pic: string | null;
  isFriend: isFriendFormat;
  isFriendRequest: boolean
}

interface AllUsersProps {
  isOpen: boolean
  onClose: () => void
}



export default function AllUsers({ isOpen, onClose }: AllUsersProps) {

  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showAllRequests, setShowAllRequests] = useState(false)

  const users = useAppSelector((state) => state.allUsersReducer.users)
  const me = useAppSelector((state) => state.loginUser.user?.user_id)
  const dispatch = useAppDispatch()
  const usersRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    dispatch(allUsersThunk()); // fetch immediately

    usersRef.current = setInterval(() => {
      dispatch(allUsersThunk());
    }, 30_000);

    return () => {
      if (usersRef.current) clearInterval(usersRef.current);
    };
  }, []);



  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.major?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.bio?.toLowerCase().includes(searchTerm.toLowerCase()),
  )



  const receivedRequestsAll = filteredUsers.filter((user) => user.isFriendRequest === true)
  const receivedRequests = showAllRequests ? receivedRequestsAll : receivedRequestsAll.slice(0, 7)
  const otherUsers = users.filter((user) => user.isFriendRequest === false)

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return "/placeholder.svg"
    // If it already starts with http, return as is
    if (imagePath.startsWith('http')) return imagePath
    // Otherwise, prepend the base URL
    return `http://localhost:8000${imagePath}`
  }

  const renderFriendButton = (user: User) => {
    switch (user.isFriend || user.isFriendRequest) {
      case "not_friend":
        return (
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Friend
          </Button>
        )
      case "pending":
        if (user.isFriendRequest === false) {

          return (
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-400 hover:bg-gray-800/50 cursor-not-allowed"
              disabled
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </Button>
          )
        }
        else {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                Decline
              </Button>
            </div>
          )

        }
      case "accepted":
        return (
          <Button size="sm" variant="ghost" className="text-green-400 hover:bg-gray-800/50 cursor-not-allowed" disabled>
            <UserCheck className="w-4 h-4 mr-1" />
            Friends
          </Button>
        )

    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/50 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <h2 className="text-xl font-bold text-white">All StudyBuddy Users</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Create Group
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, major, or bio..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-violet-400 mb-3 flex items-center">
                  Friend Requests ({receivedRequestsAll.length})
                  {!showAllRequests && receivedRequestsAll.length > 7 && (
                    <span className="text-xs text-gray-500 ml-2">Showing first 7</span>
                  )}
                </h3>
                <div className="space-y-3">
                  {receivedRequests.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-4 p-4 bg-violet-900/20 hover:bg-violet-900/30 rounded-lg border border-violet-700/30 transition-colors"
                    >
                      {/* Profile picture */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {user.profile_pic ? (
                          <img
                            src={getImageUrl(user.profile_pic) || "/placeholder.svg"}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-lg font-medium">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{user.username}</h3>
                        <p className="text-sm text-gray-400 truncate">{user.major || "No major specified"}</p>
                        {user.bio && <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>}
                      </div>

                      {/* Friend action button */}
                      <div className="flex-shrink-0">{renderFriendButton(user)}</div>
                    </div>
                  ))}
                </div>
                {!showAllRequests && receivedRequestsAll.length > 7 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllRequests(true)}
                      className="text-violet-400 hover:text-violet-300 hover:bg-violet-900/20 transition-colors"
                    >
                      Load More ({receivedRequestsAll.length - 7} more)
                    </Button>
                  </div>
                )}
                {showAllRequests && receivedRequestsAll.length > 7 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllRequests(false)}
                      className="text-violet-400 hover:text-violet-300 hover:bg-violet-900/20 transition-colors"
                    >
                      Show Less
                    </Button>
                  </div>
                )}
              </div>
            )}

            {otherUsers.length > 0 && (
              <div>
                {receivedRequests.length > 0 && (
                  <h3 className="text-sm font-medium text-gray-400 mb-3 mt-6">Other Users</h3>
                )}
                <div className="space-y-3">
                  {otherUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-4 p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/30 transition-colors"
                    >
                      {/* Profile picture */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {user.profile_pic ? (
                          <img
                            src={getImageUrl(user.profile_pic) || "/placeholder.svg"}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-lg font-medium">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{user.username}</h3>
                        <p className="text-sm text-gray-400 truncate">{user.major || "No major specified"}</p>
                        {user.bio && <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>}
                      </div>

                      {/* Friend action button */}
                      <div className="flex-shrink-0">{renderFriendButton(user)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Users.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/50 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Study Group</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-400 text-center py-8">Create Group functionality coming soon!</p>
          </div>
        </div>
      )}
    </div>
  )
}
