import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BoardFilterState } from "../../types";

const initialState: BoardFilterState = {
  searchQuery: "",
  priorityFilter: "all",
  assigneeFilter: "all",
  dueDateFilter: "all",
  activeTaskId: null,
  isActivityOpen: false,
  isAnalyticsOpen: false,
  selectedProjectId: null,
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    setSelectedProjectId: (state, action: PayloadAction<string | null>) => {
      state.selectedProjectId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPriorityFilter: (
      state,
      action: PayloadAction<BoardFilterState["priorityFilter"]>,
    ) => {
      state.priorityFilter = action.payload;
    },
    setAssigneeFilter: (state, action: PayloadAction<string>) => {
      state.assigneeFilter = action.payload;
    },
    setDueDateFilter: (
      state,
      action: PayloadAction<BoardFilterState["dueDateFilter"]>,
    ) => {
      state.dueDateFilter = action.payload;
    },
    setActiveTaskId: (state, action: PayloadAction<string | null>) => {
      state.activeTaskId = action.payload;
    },
    toggleActivityDrawer: (
      state,
      action: PayloadAction<boolean | undefined>,
    ) => {
      state.isActivityOpen =
        action.payload !== undefined ? action.payload : !state.isActivityOpen;
    },
    toggleAnalyticsModal: (
      state,
      action: PayloadAction<boolean | undefined>,
    ) => {
      state.isAnalyticsOpen =
        action.payload !== undefined ? action.payload : !state.isAnalyticsOpen;
    },
    resetFilters: (state) => {
      state.searchQuery = "";
      state.priorityFilter = "all";
      state.assigneeFilter = "all";
      state.dueDateFilter = "all";
    },
  },
});

export const {
  setSelectedProjectId,
  setSearchQuery,
  setPriorityFilter,
  setAssigneeFilter,
  setDueDateFilter,
  setActiveTaskId,
  toggleActivityDrawer,
  toggleAnalyticsModal,
  resetFilters,
} = boardSlice.actions;

export default boardSlice.reducer;
