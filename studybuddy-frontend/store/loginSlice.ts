import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import qs from "qs";

interface UserResponse {
    user_id: string;
    username: string;
    email: string;
    major: string | null;
    bio: string | null;
    profile_pic: string | null;
}

interface TokenResponse {
    access_token: string;
    access_type: string;
    user: UserResponse;
}

interface RefreshResponse {
    access_token: string;
    access_type: string;
    user: UserResponse;

}

export const loginUserThunk = createAsyncThunk<TokenResponse, any, { rejectValue: string }>(
    "login",
    async (credentials, { rejectWithValue }) => {
        try {
            const res = await axios.post<TokenResponse>('http://0.0.0.0:8000/studybuddy/v1/login', qs.stringify(credentials), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Error logging in");
        }
    }
);



export const refreshThunk = createAsyncThunk<RefreshResponse, void, { rejectValue: string }>(
    "refresh",

    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post("http://0.0.0.0:8000/studybuddy/v1/refresh", {},
                {
                    withCredentials: true,
                }
            )

            return response.data
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data || "Error getting refresh token");
        }

    }
)

interface LoginState {
    loading: boolean;
    access_token: string;
    user: UserResponse | null;
    error: string | null;
}

const initialState: LoginState = {
    loading: false,
    access_token: "",
    user: null,
    error: null
};

const loginUserSlice = createSlice({
    name: "loginSlice",
    initialState,
    reducers: {
        logoutState: (state) => {
            state.loading = false;
            state.access_token = "";
            state.user = null;
            state.error = null;
        },

        setToken: (state, action: PayloadAction<RefreshResponse>) => {
            state.access_token = action.payload.access_token
            state.user = action.payload.user
            localStorage.setItem("access_token", action.payload.access_token);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUserThunk.fulfilled, (state, action: PayloadAction<TokenResponse>) => {
                state.loading = false;
                state.access_token = action.payload.access_token;
                state.user = action.payload.user;
                state.error = null;
                localStorage.setItem("access_token", action.payload.access_token);
            })
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.loading = false;
                state.access_token = ""
                state.error = action.payload || "Error logging in";
                localStorage.removeItem("access_token");
            })

            .addCase(refreshThunk.fulfilled, (state, action: PayloadAction<RefreshResponse>) => {
                state.access_token = action.payload.access_token
                localStorage.setItem("access_token", action.payload.access_token);
                state.user = action.payload.user;

            })
            .addCase(refreshThunk.rejected, (state, action) => {
                state.loading = false;
                state.access_token = ""
                state.error = action.payload || "Error logging in";
                localStorage.removeItem("access_token");
            })
         
    }
});

export const { logoutState, setToken } = loginUserSlice.actions;

export default loginUserSlice.reducer;
