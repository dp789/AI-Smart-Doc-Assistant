import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Simulated data per folder ID
const mockFolderFiles = {
  1: [{ id: 1, fileName: 'File A1', uploadSource: 'Email', uploadStatus: 'done', uploadDate: '2023-01-01' }],
  2: [{ id: 2, fileName: 'File B1', uploadSource: 'Dropbox', uploadStatus: 'done', uploadDate: '2023-01-02' }],
  3: [{ id: 3, fileName: 'File C1', uploadSource: 'Google Drive', uploadStatus: 'done', uploadDate: '2023-01-03' }],
  5: [{ id: 5, fileName: 'Social File', uploadSource: 'Twitter', uploadStatus: 'done', uploadDate: '2023-01-04' }],
  6: [{ id: 6, fileName: 'Update File', uploadSource: 'Slack', uploadStatus: 'done', uploadDate: '2023-01-05' }],
  7: [{ id: 7, fileName: 'Forum Post', uploadSource: 'Reddit', uploadStatus: 'done', uploadDate: '2023-01-06' }],
  8: [{ id: 8, fileName: 'Promo Doc', uploadSource: 'Ads', uploadStatus: 'done', uploadDate: '2023-01-07' }],
  4: [{ id: 4, fileName: 'History File', uploadSource: 'History', uploadStatus: 'done', uploadDate: '2023-01-08' }]
};

// Helper to find folder node by ID
const findFolderById = (tree, id) => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFolderById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Thunk to simulate fetching data
export const fetchFolderFiles = createAsyncThunk(
  'folder/fetchFolderFiles',
  async (folderId, { getState }) => {
    const tree = getState().tree.treeData;
    const folder = findFolderById(tree, folderId);
    const files = folder?.files || [];
    return { folderId, files };
  }
);


const folderSlice = createSlice({
  name: 'folder',
  initialState: {
    selectedFolderId: null,
    files: [],
    status: 'idle'
  },
  reducers: {
    setSelectedFolderId: (state, action) => {
      state.selectedFolderId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderFiles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFolderFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.files = action.payload.files;
      })
      .addCase(fetchFolderFiles.rejected, (state) => {
        state.status = 'failed';
      });
  }
});

export const { setSelectedFolderId } = folderSlice.actions;
export default folderSlice.reducer;
