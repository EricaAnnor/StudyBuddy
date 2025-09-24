import React, { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { conversationThunk, updateLastFetched } from "@/store/recents"
import { updateChat } from "@/store/chatSlice"
// import { UpdatePresence } from "@/store/allUsers"

export default function Recents() {
    const dispatch = useAppDispatch()
    const check = useAppSelector((state) => state.conversationReducer.lastFetched)
    const recents = useAppSelector((state) => state.conversationReducer.conversations)
    const curTab = useAppSelector((state) => state.chatReducer.cur_tab)
    const selectedChat = useAppSelector((state) => state.chatReducer.chat_id)
    // const users = useAppSelector((state) => state.allUsersReducer.users)
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch conversations if 5 min have passed
    useEffect(() => {
        if (curTab === "recent" && (Date.now() - check) >= (5 * 60 * 1000)) {
            dispatch(conversationThunk())
            dispatch(updateLastFetched())
        }
    }, [curTab, check, dispatch])

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return "/placeholder.svg"
        // If it already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath
        // Otherwise, prepend the base URL
        return `http://localhost:8000${imagePath}`
    }

    // Filter conversations by search
    const filteredRecents = recents.filter((recent) =>
        recent.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Rotate presence updates
    // useEffect(() => {
    //     let currentIndex = 0

    //     if (filteredRecents[0] && filteredRecents[0].conv_type === "one_on_one") {
    //         dispatch(UpdatePresence(filteredRecents[0]._id.conversation_id))
    //     }

    //     const interval = setInterval(() => {
    //         currentIndex = (currentIndex + 1) % filteredRecents.length
    //         const friend = filteredRecents[currentIndex]
    //         if (friend && friend.conv_type === "one_on_one") {
    //             dispatch(UpdatePresence(friend._id.conversation_id))
    //         }
    //     }, 5000)

    //     return () => clearInterval(interval)
    // }, [dispatch, filteredRecents])

    return (
        <div className="flex-1 overflow-y-auto">
            {filteredRecents.map((user) => {
                // const isOnline = users.find(
                //     (f) => f.user_id === user._id.conversation_id
                // )?.isOnline

                return (
                    <div
                        key={user._id.conversation_id}
                        onClick={() =>
                            dispatch(
                                updateChat({
                                    chat_id: user._id.conversation_id,
                                    chat_type: user.conv_type,
                                    friend_name: user.name,
                                    friend_pic: user.profile_pic,
                                })
                            )
                        }
                        className={`p-4 border-b border-gray-700/30 cursor-pointer transition-all duration-200 ${selectedChat === user._id.conversation_id
                            ? "bg-purple-500/10 "
                            : "hover:bg-gray-800/20"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Avatar with online dot */}
                            <div className="relative">
                                <div className="w-11 h-11 bg-purple-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-purple-500 transition-colors -mt-0.5">
                                    {getImageUrl(user.profile_pic) ? (
                                        <img
                                            src={getImageUrl(user.profile_pic) || "/placeholder.svg"}
                                            alt="Profile avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-base font-medium">
                                            {user.name.trim()[0] ? user.name.trim()[0] : "JD"}
                                        </span>
                                    )}
                                </div>
                                {/* {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                                )} */}
                            </div>

                            {/* User info + message preview */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-white font-medium truncate">
                                        {user.name}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {user.last_message_time}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400 truncate">
                                        {user.last_message}
                                    </p>
                                    {user.unread_count > 0 && (
                                        <div className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {user.unread_count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
