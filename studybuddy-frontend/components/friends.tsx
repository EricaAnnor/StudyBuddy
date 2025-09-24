"use client"
import React, { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { friendsThunk, updateLastFetched } from "@/store/friendsSlice"
import { updateChat } from "@/store/chatSlice"

export default function Friends() {
    const dispatch = useAppDispatch()
    const check = useAppSelector((state) => state.friendsReducer.lastFetched)
    const friends = useAppSelector((state) => state.friendsReducer.friends)
    const curTab = useAppSelector((state) => state.chatReducer.cur_tab)
    const selectedChat = useAppSelector((state) => state.chatReducer.chat_id)
    // const users = useAppSelector((state) => state.allUsersReducer.users)

    const [searchQuery, setSearchQuery] = useState("")

    // Fetch friends list every 5 min when tab is "friends"
    useEffect(() => {
        if (curTab === "friends" && Date.now() - check >= 5 * 60 * 1000) {
            dispatch(friendsThunk())
            dispatch(updateLastFetched())
        }
    }, [curTab, check, dispatch])

    const filteredFriends = friends.filter((friend) =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Update presence every 30 sec
    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return "/placeholder.svg"
        // If it already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath
        // Otherwise, prepend the base URL
        return `http://localhost:8000${imagePath}`
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {filteredFriends.map((friend) => {

                return (
                    <div
                        key={friend.user_id}
                        onClick={() => {
                            dispatch(
                                updateChat({
                                    chat_id: friend.user_id,
                                    chat_type: "one_on_one",
                                    friend_name: friend.username,
                                    friend_pic: friend.profile_pic,
                                })
                            )
                        }}
                        className={`p-4 border-b border-gray-700/30 cursor-pointer transition-all duration-200 ${selectedChat === friend.user_id
                            ? "bg-purple-500/10 "
                            : "hover:bg-gray-800/20"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* User avatar with online status indicator */}
                            <div className="relative">
                                <div className="w-11 h-11 bg-purple-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-purple-500 transition-colors" >
                                    {getImageUrl(friend.profile_pic) ? (
                                        <img
                                            src={getImageUrl(friend.profile_pic) || "/placeholder.svg"}
                                            alt="Profile avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-xs font-medium">
                                            {friend.username.trim()[0] ? friend.username.trim()[0].trim()[0] : "JD"}
                                        </span>
                                    )}
                                </div>
                                {/* Online status dot */}
                                {/* {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                                )} */}
                            </div>

                            {/* User info and message preview */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-white font-medium truncate">{friend.username}</h3>
                                    <span className="text-xs text-gray-500">5:32pm</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400 truncate">{friend.bio}</p>
                                    {/* Unread message count badge (only for Recents tab) */}
                                    {/* {curTab === "recents" && user.unreadCount > 0 && (
                                        <div className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {user.unreadCount}
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
