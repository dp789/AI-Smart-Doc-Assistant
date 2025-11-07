import { configureStore } from '@reduxjs/toolkit';
import folderReducer from './folderSlice';
import treeReducer from './treeSlice';

const store = configureStore({
  reducer: {
    folder: folderReducer,
    tree : treeReducer
  }
});

export default store;
