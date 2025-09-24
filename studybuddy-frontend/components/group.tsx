'use client'

import React from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateChat } from "@/store/chatSlice";
import { useEffect, useState } from "react";
import { groupthunk } from "@/store/groupSlice";
import { updateLastFetched } from "@/store/groupSlice";


export default function Groups() {

    const dispatch = useAppDispatch()
    const check = useAppSelector((state) => state.userGroups.lastFetched)
    const curTab = useAppSelector((state) => state.chatReducer.cur_tab)
    const selectedChat = useAppSelector((state) => state.chatReducer.chat_id)
    const groups = useAppSelector((state) => state.userGroups.groups)
    // should I set this as a global state ?
    const [searchQuery, setSearchQuery] = useState("")

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return "/placeholder.svg"
        // If it already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath
        // Otherwise, prepend the base URL
        return `http://localhost:8000${imagePath}`
    }   

   

    useEffect(() => {


        if ((curTab == "groups") && ((Date.now() - check) >= (5 * 60 * 1000))) {
            dispatch(groupthunk())
            dispatch(updateLastFetched())

        }


    }, [curTab, check, dispatch])

    const filteredGroups = groups.filter((group) => {
        const matchesSearch = group.group_name.toLowerCase().includes(searchQuery.toLowerCase())


        return matchesSearch

    })

    



    return (

        // groups.map((group,index)=>{
        //     return <div className="border-4 border-indigo-500 " key={index}>
        //         <div onClick = {()=>{dispatch(updateChat({chat_id: group.group_id, chat_type:"group"}))}}>
        //             {group.group_name}
        //         </div>
        //         <div>
        //             {group.descriptions}
        //         </div>
        //     </div>
        // })

        <div className="flex-1 overflow-y-auto">
            {filteredGroups.map((group) => (
    //              const imgsrc = getImageUrl(user?.profile_pic)
    // const img_ = user?.username.trim()[0]
                <div
                    key={group.group_id}
                    onClick={() => { dispatch(updateChat({ chat_id: group.group_id, chat_type: "group", friend_name: group.group_name, friend_pic: group.profile_pic })) }}
                    className={`p-4 border-b border-gray-700/30 cursor-pointer transition-all duration-200 ${selectedChat === group.group_id ? "bg-purple-500/10 " : "hover:bg-gray-800/20"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {/* User avatar with online status indicator */}
                        <div className="relative">
                            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-purple-500 transition-colors" >
                                {getImageUrl(group.profile_pic) ? (
                                    <img
                                        src={getImageUrl(group.profile_pic) || "/placeholder.svg"}
                                        alt="Profile avatar"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-xs font-medium">
                                        {group.group_name.trim()[0] ? group.group_name.trim()[0] .trim()[0] : "JD"}
                                    </span>
                                )}
                            </div>
                            {/* Online status dot */}

                            {/* {user.isOnline && ( */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>

                        </div>

                        {/* User info and message preview */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-white font-medium truncate">{group.group_name}</h3>
                                {/* don't forget to add timestamp */}
                                <span className="text-xs text-gray-500">lastseen recently</span>
                            </div>

                            {/* Show description for Friends tab, last message for Recents */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400 truncate">
                                    {group.description}
                                </p>

                                {/* Unread message count badge (only for Recents tab) */}
                                {/* {activeTab === "recents" && user.unreadCount > 0 && (
                                    <div className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                        {user.unreadCount}
                                    </div>
                                )} */}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

}