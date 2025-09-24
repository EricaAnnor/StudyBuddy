import { createSlice ,PayloadAction} from "@reduxjs/toolkit";


type chatType = "one_on_one" | "group" | "no chat"

type curTab = "recent" | "friends" | "groups"

interface chatState{
    chat_id:string|null
    chat_type:chatType 
    cur_tab:curTab
    friend_name:string
    friend_pic:string | null
}

const initialState:chatState = {
    chat_id:null,
    chat_type:"no chat",
    cur_tab:"recent",
    friend_name:"",
    friend_pic:null


}

interface UpdateChatPayload {
  chat_id: string 
  chat_type: chatType
  friend_name: string
  friend_pic: string|null
}

const chatSlice = createSlice({
    name:"chatSlice",
    initialState,

    reducers:{
        updateChat: (state,action:PayloadAction<UpdateChatPayload>)=>{
            state.chat_id = action.payload.chat_id
            state.chat_type = action.payload.chat_type
            state.friend_name = action.payload.friend_name
            state.friend_pic = action.payload.friend_pic
        },

        updateTab: (state,action) =>{
            state.cur_tab = action.payload.cur_tab
        }
    }

})

export const {updateChat,updateTab} = chatSlice.actions
export default chatSlice.reducer