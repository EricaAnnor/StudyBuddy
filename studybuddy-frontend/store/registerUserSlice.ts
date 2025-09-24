import { createSlice,createAsyncThunk,PayloadAction } from "@reduxjs/toolkit";
import axios from "axios"


export const registerUserThunk = createAsyncThunk(
    "registerUser",

    async (userData:any,{rejectWithValue}) => {
        try{
            console.log("Payload being sent:", userData); // 👈 log before sending
            const response = await axios.post(
                'http://0.0.0.0:8000/studybuddy/v1/user',
                userData
            );

            return response.data
        }
        catch (error:any){
            return rejectWithValue(error.response?.data)
        }


    }
)

interface RegisterState{
    user:any;
    loading:boolean;
    error: string | null;
};


const initialState: RegisterState = {
  user: null,
  loading: false,
  error: null,
};



const registerUserSlice = createSlice({
  name: 'registerUser',

  initialState,

  reducers: {
    resetRegisterState: () => initialState, 
  },

  extraReducers: (builder) => {

    builder
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUserThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload;
      })

      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.log("Rejected:",action.payload)
      });
  },
});

export const { resetRegisterState } = registerUserSlice.actions;
export default registerUserSlice.reducer;