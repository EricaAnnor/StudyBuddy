import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";

interface UserUpdate {
    username?: string | null;
    email?: string | null;
    major?: string | null;
    bio?: string | null;
    profile_pic?: string | null;
}


interface UserResponse {
    user_id: string;
    username: string;
    email: string;
    major: string | null;
    bio: string | null;
    profile_pic: string | null;
}

interface Response {
    user: UserResponse
}


export const editThunk = createAsyncThunk<UserResponse, UserUpdate, { rejectValue: string }>(
    "editThunk",

    async (credentials: UserUpdate, { rejectWithValue }) => {

        try {

            const response = await api.patch(
                "/user/update",
                credentials,

            );

            return response.data
        }

        catch (error: any) {
            return rejectWithValue(error.response?.data || "error updating user")
        }
    }


)




export const userThunk = createAsyncThunk<Response, void, { rejectValue: string }>(
    "userThunk",

    async (_, { rejectWithValue }) => {

        try {


            const response = await api.get(
                "/user",

            );

            return response.data
        }

        catch (error: any) {
            return rejectWithValue(error.response?.data || "error updating user")
        }
    }


)

interface UserState {
    loading: boolean;
    user: UserResponse | null;
    error: string | null;
}

const initialState: UserState = {
    loading: false,
    user: null,
    error: null
};


const userSlice = createSlice({
    name: "userSlice",
    initialState,

    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(userThunk.pending, (state) => {
                state.loading = true
                state.error = ""


            })

            .addCase(userThunk.fulfilled, (state, action: PayloadAction<Response>) => {
                state.loading = false
                state.error = ""
                state.user = action.payload.user
            })

            .addCase(userThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(editThunk.fulfilled, (state, action: PayloadAction<UserResponse>) => {
                state.user = action.payload
            })
            .addCase(editThunk.rejected, (state, action) => {
                state.error = action.payload || "error updating "
            })

    }



})

export default userSlice.reducer;

