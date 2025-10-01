// store/slices/signupSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  step: 0,
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    saveProgress: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearProgress: () => initialState,
  },
});

export const { saveProgress, clearProgress } = signupSlice.actions;
export default signupSlice.reducer;
