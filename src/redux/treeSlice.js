import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import FolderIcon from '@mui/icons-material/Folder';
import { insertFolder } from '../utils/helper';

export const fetchTreeData = createAsyncThunk(
    'tree/fetchTreeData',
    async () => {
        // const response = await axios.get('/api/folders'); // your backend endpoint
        // return response.data; // should be treeData array
        return treeData;
    }
);

const treeSlice = createSlice({
    name: 'tree',
    initialState: {
        treeData: [],
        status: 'idle',
        error: null
    },
    reducers: {
        addFolder: (state, action) => {
            const { parentId, newFolder } = action.payload;

            // Optional: Add to root if parentId is "root"
            if (!parentId || parentId === 'root') {
                state.treeData.push(newFolder);
            } else {
                state.treeData = insertFolder(state.treeData, parentId, newFolder);
            }
        },
        deleteFolder: (state, action) => {
            const folderId = action.payload;
            
            const deleteFolderById = (folders) => {
                return folders.filter(folder => {
                    if (folder.id === folderId) {
                        return false;
                    }
                    if (folder.children) {
                        folder.children = deleteFolderById(folder.children);
                    }
                    return true;
                });
            };
            
            state.treeData = deleteFolderById(state.treeData);
        },
        renameFolder: (state, action) => {
            const { folderId, newName } = action.payload;
            
            const renameFolderById = (folders) => {
                return folders.map(folder => {
                    if (folder.id === folderId) {
                        return { ...folder, labelText: newName };
                    }
                    if (folder.children) {
                        return { ...folder, children: renameFolderById(folder.children) };
                    }
                    return folder;
                });
            };
            
            state.treeData = renameFolderById(state.treeData);
        },
        moveFolder: (state, action) => {
            const { folderId, newParentId } = action.payload;
            // Implementation for moving folders between parents
            // This would involve removing from current parent and adding to new parent
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTreeData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTreeData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.treeData = action.payload;
            })
            .addCase(fetchTreeData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    }
});

export const { addFolder, deleteFolder, renameFolder, moveFolder } = treeSlice.actions;
export default treeSlice.reducer;


const treeData = [
    {
        id: '1',
        labelText: 'All Mail',
        icon: FolderIcon,
        files: [
            {
                id: 1,
                fileName: 'Report.pdf',
                uploadSource: 'Gmail',
                uploadStatus: 'done',
                uploadDate: '2025-08-01'
            },
            {
                id: 2,
                fileName: 'Invoice.xlsx',
                uploadSource: 'Gmail',
                uploadStatus: 'done',
                uploadDate: '2025-08-02'
            }
        ]
    },
    {
        id: '2',
        labelText: 'Trash',
        icon: FolderIcon,
        files: [
            {
                id: 3,
                fileName: 'Old File.txt',
                uploadSource: 'Local',
                uploadStatus: 'deleted',
                uploadDate: '2025-07-25'
            }
        ]
    },
    {
        id: '3',
        labelText: 'Categories',
        icon: FolderIcon,
        children: [
            {
                id: '5',
                labelText: 'Social',
                icon: FolderIcon,
                files: [
                    {
                        id: 4,
                        fileName: 'Facebook_Post.pdf',
                        uploadSource: 'Facebook',
                        uploadStatus: 'done',
                        uploadDate: '2025-08-03'
                    },
                    {
                        id: 5,
                        fileName: 'Instagram_Image.jpg',
                        uploadSource: 'Instagram',
                        uploadStatus: 'done',
                        uploadDate: '2025-08-04'
                    }
                ]
            },
            {
                id: '6',
                labelText: 'Updates',
                icon: FolderIcon,
                files: []
            }
        ]
    },
    {
        id: '4',
        labelText: 'History',
        icon: FolderIcon,
        files: [
            {
                id: 6,
                fileName: 'Log.json',
                uploadSource: 'System',
                uploadStatus: 'archived',
                uploadDate: '2025-07-01'
            }
        ]
    }
]