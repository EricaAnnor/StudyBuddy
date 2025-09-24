import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/apiIntercept";

interface UserInput {
    images: File[];
}

interface DocInput {
    documents: File[];
}

interface Res {
    filename: string;
    url: string;
}

interface Result {
    uploaded_files: Res[];
    failed_files: { filename: string; error: string }[];
}

export const uploadFileThunk = createAsyncThunk<Result, UserInput, { rejectValue: string }>(

    "uploadFileThunk", async (images, { rejectWithValue }) => {
        const formdata = new FormData();

        images.images.forEach((element) => {
            formdata.append("images", element);
        });

        try {
            const response = await api.post("files/message/image", formdata, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data as Result;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Error uploading document");
        }
    });

export const uploadDocThunk = createAsyncThunk<Result, DocInput, { rejectValue: string }>(

    "upload/document", async (documents, { rejectWithValue }) => {
        const formdata = new FormData();

        documents.documents.forEach((element) => {
            formdata.append("documents", element);
        });

        try {
            const response = await api.post("files/message/document", formdata, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data as Result;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Error uploading document");
        }
    });

interface UploadState {
    loading: boolean;
    success: boolean;
    error: string | null;
    uploadedFiles: Res[];
    failedFiles: { filename: string; error: string }[];
}

const initialState: UploadState = {
    loading: false,
    success: false,
    error: null,
    uploadedFiles: [],
    failedFiles: [],
};

const uploadSlice = createSlice({
    name: "upload",
    initialState,
    reducers: {
        resetUploadState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.uploadedFiles = [];
            state.failedFiles = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadFileThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(uploadFileThunk.fulfilled, (state, action: PayloadAction<Result>) => {
                state.loading = false;
                state.success = true;
                state.uploadedFiles = action.payload.uploaded_files;
                state.failedFiles = action.payload.failed_files;
            })
            .addCase(uploadFileThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(uploadDocThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(uploadDocThunk.fulfilled, (state, action: PayloadAction<Result>) => {
                state.loading = false;
                state.success = true;
                state.uploadedFiles = action.payload.uploaded_files;
                state.failedFiles = action.payload.failed_files;
            })
            .addCase(uploadDocThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    },
});

export const { resetUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
