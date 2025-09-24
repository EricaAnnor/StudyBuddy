import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";
import { formatTime } from "@/lib/utils";

type conversationType = "one_on_one" | "group"

interface recent {
    _id: {
        conversation_id: string
    },
    last_message: string,
    last_message_time: number,
    last_sender_id: string,
    conv_type: conversationType,
    unread_count: number,
    name: string,
    profile_pic: string

}

interface recentResult {
    results: recent[]
}

export const conversationThunk = createAsyncThunk<recentResult, void, { rejectValue: string }>(
    "conversationThunk",

    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/recents")

            return response.data
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || "error fetching recents")
        }


    }


)

interface recents {
    _id: {
        conversation_id: string
    },
    last_message: string,
    last_message_time: string,
    last_sender_id: string,
    conv_type: conversationType,
    unread_count: number,
    name: string,
    profile_pic: string

}

interface conversation {
    error: string
    loading: boolean
    conversations: recents[],
    lastFetched: number

}

const initialState: conversation = {
    error: "",
    loading: false,
    conversations: [],
    lastFetched: 0
}

const conversationSlice = createSlice({
    name: "conversationSlice",
    initialState,
    reducers: {
        updateLastFetched: (state) => {
            state.lastFetched = Date.now()
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(conversationThunk.pending, (state) => {
                state.loading = true,
                    state.error = ""
            })

            .addCase(conversationThunk.fulfilled, (state, action: PayloadAction<recentResult>) => {
                state.conversations = action.payload.results.map(conv => ({
                    ...conv,
                    last_message_time: formatTime(conv.last_message_time) 
                }));
                state.loading = false
            })

            .addCase(conversationThunk.rejected, (state, action) => {
                state.error = action.payload as string
                state.loading = false

            })
    }
})

export const { updateLastFetched } = conversationSlice.actions
export default conversationSlice.reducer;

