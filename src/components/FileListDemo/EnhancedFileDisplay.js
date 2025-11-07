import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Divider,
  Breadcrumbs,
  Link,
  InputAdornment,
  FormControl,
  Select,
  ButtonGroup,
  Checkbox,
  Tooltip,
  useTheme,
  alpha,
  Skeleton,
  Zoom,
  Fade
} from '@mui/material';
import {
  Search,
  ViewList,
  ViewModule,
  Sort,
  FilterList,
  MoreVert,
  Download,
  Delete,
  Edit,
  Share,
  Star,
  StarBorder,
  Visibility,
  CloudUpload,
  Refresh,
  SelectAll,
  Description,
  Image,
  VideoFile,
  AudioFile,
  Archive,
  PictureAsPdf,
  InsertDriveFile,
  Home,
  ChevronRight,
  FileUpload,
  Clear
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolderFiles, setSelectedFolderId } from '../../redux/folderSlice';

const EnhancedFileDisplay = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { files, selectedFolderId, status } = useSelector((state) => state.folder);
  const { treeData } = useSelector((state) => state.tree);

  // State management
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(null);

  // File type icons mapping
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { sx: { fontSize: '2rem' } };

    switch (extension) {
      case 'pdf':
        return <PictureAsPdf {...iconProps} sx={{ ...iconProps.sx, color: '#ef4444' }} />;
      case 'doc':
      case 'docx':
        return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#2563eb' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image {...iconProps} sx={{ ...iconProps.sx, color: '#10b981' }} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <VideoFile {...iconProps} sx={{ ...iconProps.sx, color: '#7c3aed' }} />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <AudioFile {...iconProps} sx={{ ...iconProps.sx, color: '#f59e0b' }} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive {...iconProps} sx={{ ...iconProps.sx, color: '#6b7280' }} />;
      default:
        return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: '#64748b' }} />;
    }
  };

  const getFileTypeColor = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '#ef4444';
      case 'doc':
      case 'docx': return '#2563eb';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg': return '#10b981';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv': return '#7c3aed';
      case 'mp3':
      case 'wav':
      case 'flac': return '#f59e0b';
      case 'zip':
      case 'rar':
      case '7z': return '#6b7280';
      default: return '#64748b';
    }
  };

  // Get current folder name for breadcrumbs
  const getCurrentFolderPath = () => {
    const findFolderPath = (folders, targetId, path = []) => {
      for (const folder of folders) {
        const currentPath = [...path, folder];
        if (folder.id === targetId) {
          return currentPath;
        }
        if (folder.children) {
          const result = findFolderPath(folder.children, targetId, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    if (!selectedFolderId) return [];
    return findFolderPath(treeData, selectedFolderId) || [];
  };

  const folderPath = getCurrentFolderPath();

  // Filter, search, and sort files
  const processedFiles = useMemo(() => {
    let result = [...(files || [])];

    // Search filter
    if (searchQuery) {
      result = result.filter(file =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.uploadSource.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(file => {
        const extension = file.fileName.split('.').pop()?.toLowerCase();
        switch (filterType) {
          case 'documents':
            return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension);
          case 'images':
            return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp'].includes(extension);
          case 'videos':
            return ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension);
          case 'audio':
            return ['mp3', 'wav', 'flac', 'aac'].includes(extension);
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.fileName.toLowerCase();
          bVal = b.fileName.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.uploadDate);
          bVal = new Date(b.uploadDate);
          break;
        case 'source':
          aVal = a.uploadSource.toLowerCase();
          bVal = b.uploadSource.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, searchQuery, filterType, sortBy, sortOrder]);

  // File selection handlers
  const handleFileSelect = (fileId, event) => {
    event.stopPropagation();
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === processedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(processedFiles.map(file => file.id)));
    }
  };

  const handleContextMenu = (event, file) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, file });
  };

  // File actions
  const handleFileAction = (action, file) => {
    switch (action) {
      case 'download':
        console.log('Downloading:', file.fileName);
        // Implement download logic
        break;
      case 'delete':
        console.log('Deleting:', file.fileName);
        // Implement delete logic
        break;
      case 'share':
        console.log('Sharing:', file.fileName);
        // Implement share logic
        break;
      case 'view':
        console.log('Viewing:', file.fileName);
        // Implement view logic
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} width="60%" sx={{ mx: 'auto' }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <List>
          {[...Array(6)].map((_, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="40%" />}
                secondary={<Skeleton variant="text" width="60%" />}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  // Grid view component
  const renderGridView = () => (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {processedFiles.map((file, index) => {
        const isSelected = selectedFiles.has(file.id);
        const isHovered = hoveredFile === file.id;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
            <Zoom in timeout={200 + index * 50}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered 
                    ? `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}` 
                    : isSelected 
                      ? `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}` 
                      : theme.shadows[2],
                  border: isSelected 
                    ? '3px solid #1976d2' 
                    : isHovered 
                      ? '2px solid rgba(156, 39, 176, 0.5)'
                      : '2px solid transparent',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(156, 39, 176, 0.05) 100%)'
                    : 'inherit',
                  '&::before': isSelected ? {
                    content: '""',
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    backgroundColor: '#1976d2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: 'bold',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)'
                  } : {}
                }}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                  {/* Selection Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleFileSelect(file.id, e)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      opacity: isSelected || isHovered ? 1 : 0,
                      transition: 'all 0.3s ease',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      '& .MuiSvgIcon-root': {
                        color: isSelected ? '#1976d2' : '#757575',
                        filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        transform: 'scale(1.3)'
                      }
                    }}
                  />

                  {/* File Icon */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    {getFileIcon(file.fileName)}
                  </Box>

                  {/* File Name */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#212121 !important'
                    }}
                    title={file.fileName}
                  >
                    {file.fileName}
                  </Typography>

                  {/* File Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Chip
                      label={file.uploadSource}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getFileTypeColor(file.fileName), 0.15),
                        color: getFileTypeColor(file.fileName),
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 600,
                        border: `1px solid ${alpha(getFileTypeColor(file.fileName), 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(getFileTypeColor(file.fileName), 0.25),
                          transform: 'scale(1.05)',
                          boxShadow: `0 2px 8px ${alpha(getFileTypeColor(file.fileName), 0.3)}`
                        }
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{
                        color: '#666666 !important',
                        fontWeight: 500,
                        fontSize: '0.8rem'
                      }}
                    >
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Action Buttons */}
                <Fade in={isHovered || isSelected}>
                  <CardActions sx={{ justifyContent: 'center', pt: 0, gap: 1 }}>
                    <Tooltip title="View">
                      <IconButton 
                        size="small" 
                        onClick={() => handleFileAction('view', file)}
                        sx={{
                          backgroundColor: 'rgba(33, 150, 243, 0.15)',
                          color: '#2196f3',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.25)',
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                          }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton 
                        size="small" 
                        onClick={() => handleFileAction('download', file)}
                        sx={{
                          backgroundColor: 'rgba(76, 175, 80, 0.15)',
                          color: '#4caf50',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.25)',
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                          }
                        }}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton 
                        size="small" 
                        onClick={() => handleFileAction('share', file)}
                        sx={{
                          backgroundColor: 'rgba(255, 152, 0, 0.15)',
                          color: '#ff9800',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.25)',
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)'
                          }
                        }}
                      >
                        <Share />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More">
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleContextMenu(e, file)}
                        sx={{
                          backgroundColor: alpha(theme.palette.grey[600], 0.15),
                          color: theme.palette.grey[600],
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.grey[600], 0.25),
                            transform: 'scale(1.15)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.grey[600], 0.4)}`
                          }
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Fade>
              </Card>
            </Zoom>
          </Grid>
        );
      })}
    </Grid>
  );

  // List view component
  const renderListView = () => (
    <List sx={{ p: 1 }}>
      {processedFiles.map((file, index) => {
        const isSelected = selectedFiles.has(file.id);
        
        return (
          <Fade in timeout={200 + index * 50} key={file.id}>
            <Box>
              <ListItem
                sx={{
                  borderRadius: 3,
                  mb: 1,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: isSelected 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
                    : 'transparent',
                  border: isSelected 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : '2px solid transparent',
                  boxShadow: isSelected 
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` 
                    : 'none',
                  '&:hover': {
                    backgroundColor: isSelected 
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`
                      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.grey[100], 0.8)} 100%)`,
                    transform: 'translateX(8px) scale(1.01)',
                    boxShadow: isSelected 
                      ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.25)}` 
                      : `0 2px 8px ${alpha(theme.palette.grey[400], 0.15)}`
                  },
                  '&::before': isSelected ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '5px',
                    height: '70%',
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '0 3px 3px 0',
                    boxShadow: `2px 0 6px ${alpha(theme.palette.primary.main, 0.3)}`
                  } : {}
                }}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleFileSelect(file.id, e)}
                    sx={{
                      transition: 'all 0.3s ease',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      '& .MuiSvgIcon-root': {
                        color: isSelected ? theme.palette.primary.main : theme.palette.grey[600],
                        filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'scale(1.2)'
                      }
                    }}
                  />
                </ListItemIcon>
                
                <ListItemIcon sx={{ minWidth: 48 }}>
                  <Box sx={{
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                  }}>
                    {React.cloneElement(getFileIcon(file.fileName), { sx: { fontSize: '1.6rem' } })}
                  </Box>
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#1565c0 !important' : '#212121 !important',
                        fontSize: '1rem',
                        letterSpacing: isSelected ? '0.02em' : 'normal',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {file.fileName}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75 }}>
                      <Chip
                        label={file.uploadSource}
                        size="small"
                        sx={{
                          backgroundColor: alpha(getFileTypeColor(file.fileName), 0.15),
                          color: getFileTypeColor(file.fileName),
                          fontSize: '0.75rem',
                          height: 22,
                          fontWeight: 600,
                          border: `1px solid ${alpha(getFileTypeColor(file.fileName), 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(getFileTypeColor(file.fileName), 0.25),
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{
                          color: '#666666 !important',
                          fontWeight: 500,
                          fontSize: '0.8rem'
                        }}
                      >
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </Typography>
                      <Chip
                        label={file.uploadStatus}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.dark,
                          fontSize: '0.7rem',
                          height: 20,
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View">
                      <IconButton 
                        size="small" 
                        onClick={() => handleFileAction('view', file)}
                        sx={{
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.info.main, 0.2),
                            transform: 'scale(1.1)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`
                          }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton 
                        size="small" 
                        onClick={() => handleFileAction('download', file)}
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                            transform: 'scale(1.1)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`
                          }
                        }}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More">
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleContextMenu(e, file)}
                        sx={{
                          backgroundColor: alpha(theme.palette.grey[600], 0.1),
                          color: theme.palette.grey[600],
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.grey[600], 0.2),
                            transform: 'scale(1.1)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.grey[600], 0.3)}`
                          }
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </Box>
          </Fade>
        );
      })}
    </List>
  );

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
        {/* Breadcrumbs */}
        {folderPath.length > 0 && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                dispatch(setSelectedFolderId(null));
                // Optional: Clear files when going to home
                // dispatch(fetchFolderFiles(null));
              }}
              sx={{ 
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                padding: 0,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: '1rem' }} />
              Home
            </Link>
            {folderPath.map((folder, index) => (
              <Typography
                key={folder.id}
                variant="body2"
                color={index === folderPath.length - 1 ? 'text.primary' : 'text.secondary'}
                sx={{ fontWeight: index === folderPath.length - 1 ? 600 : 400 }}
              >
                {folder.labelText}
              </Typography>
            ))}
          </Breadcrumbs>
        )}

        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: '1rem' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250 }}
          />

          {/* Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Files</MenuItem>
              <MenuItem value="documents">Documents</MenuItem>
              <MenuItem value="images">Images</MenuItem>
              <MenuItem value="videos">Videos</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <MenuItem value="name-asc">Name A-Z</MenuItem>
              <MenuItem value="name-desc">Name Z-A</MenuItem>
              <MenuItem value="date-desc">Latest First</MenuItem>
              <MenuItem value="date-asc">Oldest First</MenuItem>
              <MenuItem value="source-asc">Source A-Z</MenuItem>
            </Select>
          </FormControl>

          {/* View Mode Toggle */}
          <ButtonGroup size="small">
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
            >
              <ViewModule />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('list')}
            >
              <ViewList />
            </Button>
          </ButtonGroup>

          {/* Select All */}
          {processedFiles.length > 0 && (
            <Button
              size="small"
              startIcon={<SelectAll />}
              onClick={handleSelectAll}
              variant="outlined"
            >
              {selectedFiles.size === processedFiles.length ? 'Clear' : 'Select All'}
            </Button>
          )}

          {/* Refresh */}
          <Tooltip title="Refresh">
            <IconButton 
              size="small" 
              onClick={() => selectedFolderId && dispatch(fetchFolderFiles(selectedFolderId))}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* File Count & Selected Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#666666 !important' }}>
            {processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </Typography>
          {selectedFiles.size > 0 && (
            <Typography variant="body2" sx={{ color: '#1976d2 !important' }}>
              {selectedFiles.size} selected
            </Typography>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {status === 'loading' ? (
          renderSkeleton()
        ) : processedFiles.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            p: 4,
            textAlign: 'center'
          }}>
            <FileUpload sx={{ fontSize: '4rem', color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: '#666666 !important' }}>
              {searchQuery ? 'No files found' : 'No files in this folder'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666 !important' }}>
              {searchQuery 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload files or select a different folder to get started'
              }
            </Typography>
          </Box>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
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
        <MenuItem onClick={() => handleFileAction('view', contextMenu?.file)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('download', contextMenu?.file)}>
          <ListItemIcon><Download /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('share', contextMenu?.file)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleFileAction('delete', contextMenu?.file)} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon><Delete sx={{ color: theme.palette.error.main }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default EnhancedFileDisplay;