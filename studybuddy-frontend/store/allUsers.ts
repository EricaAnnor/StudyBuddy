import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";

type isFriendFormat = "accepted" | "rejected" | "blocked" | "not_friend" | "pending";

interface user {
  user_id: string;
  username: string;
  email: string;
  major: string | null;
  bio: string | null;
  profile_pic: string | null;
  isFriend: isFriendFormat;
  isFriendRequest:boolean
}

interface usersResponse {
  users: user[];
}

export const allUsersThunk = createAsyncThunk<usersResponse, void, { rejectValue: string }>(
  "allUsersThunk",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/allusers");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Error fetching friends");
    }
  }
);

// interface OnlineResults {
//   online: boolean;
//   time: number; // seconds from server
//   user_id: string;
// }

// export const UpdatePresence = createAsyncThunk<OnlineResults, string, { rejectValue: string }>(
//   "UpdatePresence",
//   async (user_id, { rejectWithValue }) => {
//     try {
//       const response = await api.get(`/checkpresence/${user_id}`);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data || "error fetching data");
//     }
//   }
// );

// interface User extends user {
//   isOnline: boolean;
//   lastSeenMs: number | null; // store milliseconds, not string
// }

interface sliceState {
  loading: boolean;
  error: string;
  users: user[];
}

const initialState: sliceState = {
  loading: false,
  error: "",
  users: [],
};

const allUsersSlice = createSlice({
  name: "allUsersSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // .addCase(UpdatePresence.fulfilled, (state, action: PayloadAction<OnlineResults>) => {
      //   const friend = state.users.find((f) => f.user_id === action.payload.user_id);
      //   if (friend) {
      //     friend.isOnline = action.payload.online;
      //     // Convert seconds to ms - REMOVED Math.min() clamping
      //     const ts = (action.payload.time ?? 0) * 1000;
      //     friend.lastSeenMs = ts;
          
      //     // Debug logging to help troubleshoot
      //     console.log('UpdatePresence for user:', action.payload.user_id, {
      //       online: action.payload.online,
      //       serverTime: action.payload.time,
      //       timestampMs: ts,
      //       currentTime: Date.now(),
      //       formattedTime: new Date(ts).toISOString()
      //     });
      //   }
      // })
      .addCase(allUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(allUsersThunk.fulfilled, (state, action: PayloadAction<usersResponse>) => {
        state.loading = false;
        state.error = "";

        const prevById = new Map(state.users.map((u) => [u.user_id, u]));

        state.users = action.payload.users
        // .map((u) => {
        //   const prev = prevById.get(u.user_id);
        //   return {
        //     ...u,
        //     isOnline: prev?.isOnline ?? false,
        //     lastSeenMs: prev?.lastSeenMs ?? null,
        //   };
        // });
      })
      .addCase(allUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default allUsersSlice.reducer;

export function formatLastSeen(timestampMs: number | null | undefined): string {
  if (!timestampMs) return "never seen";

  const now = Date.now();
  const ts = timestampMs;
  
  // Handle future timestamps - if timestamp is in future, show as "just now"
  if (ts > now) {
    console.log('Future timestamp detected:', { ts, now, futureBy: ts - now });
    return "just now";
  }
  
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek < 5) return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
  return new Date(ts).toLocaleDateString();
}