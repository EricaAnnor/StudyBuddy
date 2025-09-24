import { configureStore } from "@reduxjs/toolkit";
import registerUserReducer  from "./registerUserSlice";
import loginUserReducer from "./loginSlice";
import groupReducer from "./groupSlice"
import chatReduce from "./chatSlice"
import friendsReduce from "./friendsSlice"
import conversationReduce from "./recents"
import allUsersReduce from "./allUsers"
import upload from "./fileUpload"
import user from "./profile"

export const store = configureStore({
  reducer: {
    registerUser: registerUserReducer,
    loginUser: loginUserReducer,
    userGroups:groupReducer,
    chatReducer:chatReduce,
    friendsReducer:friendsReduce,
    conversationReducer:conversationReduce,
    allUsersReducer:allUsersReduce,
    uploadReducer:upload,
    profileReducer:user

  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
