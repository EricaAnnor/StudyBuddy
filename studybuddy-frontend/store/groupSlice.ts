import { createSlice,createAsyncThunk,PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";


interface Group{
    group_id:string;
    profile_pic:string | null
    owner:string
    group_name:string
    description:string
}

interface GroupResponse{
    user_groups:Group[]
}


export const groupthunk = createAsyncThunk<GroupResponse,void,{rejectValue:string}>(
    "groupthunk",

    async (_,{rejectWithValue}) =>{

        try{
            const response = await api("/groupmembers")
            console.log("groupthunk started");
            console.log("groupthunk got response", response);


            return response.data

        }catch (error:any){
            return rejectWithValue(error.response?.data || "error fetching groups")
        }



    }
)


interface sliceState{
    loading:boolean
    error:string
    groups:Group[]
    lastFetched:number
}

const initialState:sliceState = {
    loading:false,
    error: "",
    groups: [],
    lastFetched: 0
}

const groupslice = createSlice({
    name: "groupslice",

    initialState,

    reducers:{
        updateLastFetched:(state)=>{
            state.lastFetched = Date.now()
        }

    },

    extraReducers:(builder)=>{
        builder
            .addCase(groupthunk.pending,(state) => {
                state.loading = true
                state.error = ""
                

            })

            .addCase(groupthunk.fulfilled,(state,action:PayloadAction<GroupResponse>) =>{
                state.loading = false
                state.error = ""
                state.groups = action.payload.user_groups
                state.lastFetched = Date.now()
            })

            .addCase(groupthunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

    }


})

export const {updateLastFetched} = groupslice.actions

export default groupslice.reducer;