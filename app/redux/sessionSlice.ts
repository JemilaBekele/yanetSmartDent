// redux/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  username: string;
  role: string;
}

interface SessionState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: SessionState = {
  user: null,
  status: 'loading',
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    setLoading(state) {
      state.status = 'loading';
    },
  },
});

export const { setUser, setLoading } = sessionSlice.actions;
export default sessionSlice.reducer;
