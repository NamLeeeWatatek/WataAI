
export type PayloadAction<T = any> = {
  payload: T
  type: string
}

export type AsyncThunk<Returned, ThunkArg = void> = any

export interface SliceOptions<State, Reducers> {
  name: string
  initialState: State
  reducers: Reducers
  extraReducers?: (builder: any) => void
}

