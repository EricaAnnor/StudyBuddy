import { createAsyncThunk,createSlice,PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";

interface UserResponse {
    user_id: string;
    username: string;
    email: string;
    major: string | null;
    bio: string | null;
    profile_pic: string | null;
}

interface FriendResponse{
    friends:UserResponse[]
}



export const friendsThunk = createAsyncThunk<FriendResponse,void,{rejectValue:string}>(
    "friendsThunk",

    async (_,{rejectWithValue}) =>{

        try{
            const response =  await api("/friends")

            return response.data
        }

        catch(error:any){
            return rejectWithValue(error.response?.data || "Error fetching friends")
        }
    }

)




interface sliceState{
    loading:boolean
    error:string
    friends:UserResponse[]
    lastFetched:number
  
}

const initialState:sliceState = {
    loading:false,
    error: "",
    friends: [],
    lastFetched: 0,

}

const Friendslice = createSlice({
    name: "friendslice",

    initialState,

    reducers:{
        updateLastFetched:(state)=>{
            state.lastFetched = Date.now()
        }

    },

    extraReducers:(builder)=>{
        builder
            .addCase(friendsThunk.pending,(state) => {
                state.loading = true
                state.error = ""
                

            })

            .addCase(friendsThunk.fulfilled,(state,action:PayloadAction<FriendResponse>) =>{
                state.loading = false;
                state.error = ""
                state.friends = action.payload.friends
                state.lastFetched = Date.now()
            })

            .addCase(friendsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

         

    }


})

export const {updateLastFetched} = Friendslice.actions

export default Friendslice.reducer;