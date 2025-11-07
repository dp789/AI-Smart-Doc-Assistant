import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Fab,
  Zoom,
  Backdrop,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Upload,
  CreateNewFolder,
  Refresh,
  Settings,
  FileUpload,
  FolderOpen
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import ResizablePanels from '../ResizablePanels';
import EnhancedFolderNavigation from './EnhancedFolderNavigation';
import EnhancedFileDisplay from './EnhancedFileDisplay';
import './EnhancedFileListDemo.css';

const EnhancedFileListDemo = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State management
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const { selectedFolderId } = useSelector((state) => state.folder);
  const { treeData } = useSelector((state) => state.tree);

  // Get current folder info for display
  const getCurrentFolder = () => {
    const findFolder = (folders, id) => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return selectedFolderId ? findFolder(treeData, selectedFolderId) : null;
  };

  const currentFolder = getCurrentFolder();

  // Mobile drawer toggle
  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Speed dial actions
  const speedDialActions = [
    {
      icon: <FileUpload />,
      name: 'Upload File',
      action: () => {
        console.log('Upload file');
        // Implement file upload
      }
    },
    {
      icon: <CreateNewFolder />,
      name: 'New Folder',
      action: () => {
        console.log('New folder');
        // Implement new folder creation
      }
    },
    {
      icon: <Refresh />,
      name: 'Refresh',
      action: () => {
        console.log('Refresh');
        // Implement refresh
      }
    }
  ];

  // Folder navigation panel
  const folderPanel = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: theme.palette.background.paper
    }}>
      <EnhancedFolderNavigation />
    </Box>
  );

  // File display panel
  const filePanel = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: theme.palette.background.paper
    }}>
      <EnhancedFileDisplay />
    </Box>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <Box 
        className="enhanced-file-list-demo"
        sx={{ 
          height: '100vh', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: theme.palette.background.default
        }}>
        {/* Mobile App Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                📁 Smart Docs
              </Typography>
              {currentFolder && (
                <Typography variant="caption" color="text.secondary">
                  {currentFolder.labelText}
                </Typography>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileDrawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: '80vw',
              maxWidth: 320,
              backgroundColor: theme.palette.background.paper
            },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Folders
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ height: 'calc(100% - 73px)' }}>
            {folderPanel}
          </Box>
        </Drawer>

        {/* Mobile File Display */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {filePanel}
        </Box>

        {/* Mobile Speed Dial */}
        <SpeedDial
          ariaLabel="File actions"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            '& .MuiSpeedDial-fab': {
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }
          }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.action();
                setSpeedDialOpen(false);
              }}
              sx={{
                '& .MuiSpeedDialAction-fab': {
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }
              }}
            />
          ))}
        </SpeedDial>

        {/* Backdrop for speed dial */}
        <Backdrop
          open={speedDialOpen}
          onClick={() => setSpeedDialOpen(false)}
          sx={{ zIndex: theme.zIndex.speedDial - 1 }}
        />
      </Box>
    );
  }

  // Desktop/Tablet layout
  return (
    <Box 
      className="enhanced-file-list-demo"
      sx={{ 
        height: '100vh', 
        width: '100%',
        backgroundColor: theme.palette.background.default,
        position: 'relative'
      }}>
      {/* Debug Badge */}
            <Box sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #4caf50 0%, #2196f3 100%)',
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: 3,
        fontSize: '0.9rem',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        letterSpacing: '0.02em'
      }}>
        <FolderOpen sx={{ fontSize: '1.1rem' }} />
        Enhanced File Manager
      </Box>
      
      <ResizablePanels
        leftPanel={folderPanel}
        rightPanel={filePanel}
        initialLeftWidth={isTablet ? 35 : 30}
        minLeftWidth={20}
        maxLeftWidth={50}
        className="enhanced-file-list-demo"
      />

      {/* Desktop Floating Action Button */}
      <Zoom in timeout={300}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: theme.shadows[8],
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: theme.shadows[12],
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={() => console.log('Quick upload')}
        >
          <Upload />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default EnhancedFileListDemo;