import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Breadcrumbs,
  Link,
  Chip,
  useTheme,
  alpha,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  CreateNewFolder,
  ExpandMore,
  ChevronRight,
  MoreVert,
  Edit,
  Delete,
  DriveFileMove,
  Search,
  Add,
  Home,
  KeyboardArrowDown,
  KeyboardArrowRight,
  FolderSpecial,
  Star,
  Archive,
  DeleteOutline
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addFolder, deleteFolder, renameFolder, fetchTreeData } from '../../redux/treeSlice';
import { setSelectedFolderId, fetchFolderFiles } from '../../redux/folderSlice';

const EnhancedFolderNavigation = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { treeData, status } = useSelector((state) => state.tree);
  const { selectedFolderId } = useSelector((state) => state.folder);

  // State management
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1', '3'])); // Default expanded
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameDialog, setRenameDialog] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTreeData());
    }
  }, [dispatch, status]);

  // Folder operations
  const handleFolderClick = (folderId, event) => {
    event.stopPropagation();
    dispatch(setSelectedFolderId(folderId));
    dispatch(fetchFolderFiles(folderId));
    setSelectedFolder(folderId);
  };

  const handleFolderExpand = (folderId, event) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (event, folder) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
    setSelectedFolder(folder);
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleNewFolder = () => {
    setNewFolderDialog(true);
    handleContextMenuClose();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        labelText: newFolderName.trim(),
        icon: Folder,
        files: [],
        children: []
      };

      dispatch(addFolder({ 
        parentId: selectedFolder?.id || 'root', 
        newFolder 
      }));

      setSnackbar({
        open: true,
        message: `Folder "${newFolderName}" created successfully`,
        severity: 'success'
      });

      setNewFolderName('');
      setNewFolderDialog(false);
    }
  };

  const handleRenameFolder = () => {
    setFolderToRename(selectedFolder);
    setNewFolderName(selectedFolder?.labelText || '');
    setRenameDialog(true);
    handleContextMenuClose();
  };

  const handleRename = () => {
    if (newFolderName.trim() && folderToRename) {
      dispatch(renameFolder({
        folderId: folderToRename.id,
        newName: newFolderName.trim()
      }));

      setSnackbar({
        open: true,
        message: `Folder renamed to "${newFolderName}"`,
        severity: 'success'
      });

      setNewFolderName('');
      setRenameDialog(false);
      setFolderToRename(null);
    }
  };

  const handleDeleteFolder = () => {
    if (selectedFolder) {
      dispatch(deleteFolder(selectedFolder.id));
      
      setSnackbar({
        open: true,
        message: `Folder "${selectedFolder.labelText}" deleted`,
        severity: 'info'
      });
    }
    handleContextMenuClose();
  };

  // Filter folders based on search
  const filterFolders = (folders, query) => {
    if (!query) return folders;
    
    const filtered = [];
    for (const folder of folders) {
      if (folder.labelText.toLowerCase().includes(query.toLowerCase())) {
        filtered.push(folder);
      } else if (folder.children) {
        const filteredChildren = filterFolders(folder.children, query);
        if (filteredChildren.length > 0) {
          filtered.push({
            ...folder,
            children: filteredChildren
          });
        }
      }
    }
    return filtered;
  };

  const filteredTreeData = filterFolders(treeData, searchQuery);

  // Render folder tree recursively
  const renderFolder = (folder, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const fileCount = folder.files ? folder.files.length : 0;

    return (
      <Box key={folder.id}>
        {/* Folder Item */}
                  <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.75,
              px: 1.5,
              ml: level * 2,
              borderRadius: 2,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: isSelected 
                ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(33, 150, 243, 0.1) 100%)'
                : 'transparent',
              border: isSelected 
                ? '2px solid #1976d2' 
                : '2px solid transparent',
              boxShadow: isSelected 
                ? '0 4px 12px rgba(25, 118, 210, 0.25)' 
                : 'none',
              '&:hover': {
                backgroundColor: isSelected 
                  ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(33, 150, 243, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(255, 152, 0, 0.05) 100%)',
                transform: 'translateX(6px) scale(1.02)',
                boxShadow: isSelected 
                  ? '0 6px 20px rgba(25, 118, 210, 0.3)' 
                  : '0 2px 8px rgba(76, 175, 80, 0.2)',
              },
              '&::before': isSelected ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '60%',
                backgroundColor: '#1976d2',
                borderRadius: '0 2px 2px 0',
                boxShadow: '2px 0 6px rgba(25, 118, 210, 0.4)',
              } : {}
            }}
          onClick={(e) => handleFolderClick(folder.id, e)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => handleFolderExpand(folder.id, e)}
              sx={{ mr: 0.5, p: 0.25 }}
            >
              {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24, mr: 0.5 }} />
          )}

          {/* Folder Icon */}
          <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
            {isExpanded && hasChildren ? (
              <FolderOpen sx={{ 
                color: isSelected ? '#1976d2' : '#ff9800',
                fontSize: '1.4rem',
                filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                transition: 'all 0.3s ease'
              }} />
            ) : (
              <Folder sx={{ 
                color: isSelected ? '#1976d2' : '#4caf50',
                fontSize: '1.4rem',
                filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                transition: 'all 0.3s ease'
              }} />
            )}
          </Box>

          {/* Folder Name */}
          <Typography
            variant="body2"
            sx={{
              flexGrow: 1,
              fontWeight: isSelected ? 700 : 600,
              color: isSelected ? '#1565c0 !important' : '#212121 !important',
              fontSize: '0.95rem',
              letterSpacing: isSelected ? '0.02em' : 'normal',
              textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {folder.labelText}
          </Typography>

          {/* File Count Badge */}
          {fileCount > 0 && (
            <Chip
              label={fileCount}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isSelected 
                  ? '#1976d2' 
                  : 'rgba(255, 87, 34, 0.15)',
                color: isSelected 
                  ? '#ffffff' 
                  : '#d84315',
                border: isSelected 
                  ? 'none' 
                  : '1px solid rgba(255, 87, 34, 0.3)',
                mr: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  backgroundColor: isSelected ? '#1565c0' : 'rgba(255, 87, 34, 0.25)',
                  boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)'
                }
              }}
            />
          )}
        </Box>

        {/* Children */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box>
              {folder.children.map(child => renderFolder(child, level + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2 !important', fontSize: '1.25rem' }}>
            📁 Folders
          </Typography>
          <Tooltip title="Create New Folder">
            <IconButton 
              size="small" 
              onClick={() => setNewFolderDialog(true)}
              sx={{ 
                color: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                '&:hover': { 
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <CreateNewFolder />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.grey[500], fontSize: '1rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'rgba(245, 245, 245, 0.8)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(245, 245, 245, 1)',
                border: '1px solid rgba(25, 118, 210, 0.4)',
              },
              '&.Mui-focused': {
                backgroundColor: '#ffffff',
                border: '2px solid #1976d2',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
              }
            }
          }}
        />
      </Box>

      {/* Folder Tree */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {status === 'loading' ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666666 !important' }}>
              Loading folders...
            </Typography>
          </Box>
        ) : filteredTreeData.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666666 !important' }}>
              {searchQuery ? 'No folders found' : 'No folders available'}
            </Typography>
          </Box>
        ) : (
          filteredTreeData.map(folder => renderFolder(folder))
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              boxShadow: theme.shadows[8],
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`
            }
          }
        }}
      >
        <MenuItem onClick={handleNewFolder}>
          <ListItemIcon>
            <CreateNewFolder />
          </ListItemIcon>
          <ListItemText>New Folder</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRenameFolder}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteFolder} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon>
            <Delete sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onClose={() => setNewFolderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog} onClose={() => setRenameDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!newFolderName.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default EnhancedFolderNavigation;