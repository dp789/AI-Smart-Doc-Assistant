import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, Chip, Button, Tooltip, Menu, MenuItem, CircularProgress, Alert } from "@mui/material";
import { CheckCircle, Error, CloudUpload, Computer, Language, Psychology, AccountTree, Close, MoreVert, DeleteSweep, MarkEmailRead, Refresh } from "@mui/icons-material";
import { useNotifications } from "../hooks/useNotifications";

const NotificationPanel = ({ anchorEl, open, onClose }) => {
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, refresh, forceRefresh } = useNotifications();

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // Force refresh when notification panel opens
  useEffect(() => {
    if (open) {
      console.log("🔔 Notification panel opened - force refreshing...");
      forceRefresh();
    }
  }, [open, forceRefresh]);

  const getNotificationIcon = (notification) => {
    switch (notification.notification_type) {
      case "upload_success":
        switch (notification.ingestion_source) {
          case 1:
            return <CloudUpload sx={{ color: "#4caf50" }} />;
          case 2: 
            return <Language sx={{ color: "#4caf50" }} />;
          case 3: 
            return <Computer sx={{ color: "#4caf50" }} />;
          default:
            return <CheckCircle sx={{ color: "#4caf50" }} />;
        }
      case "upload_error":
        return <Error sx={{ color: "#f44336" }} />;
      case "ai_analysis":
        return <Psychology sx={{ color: "#2196f3" }} />;
      case "workflow_complete":
        return <AccountTree sx={{ color: "#9c27b0" }} />;
      default:
        return <CheckCircle sx={{ color: "#4caf50" }} />;
    }
  };

  const getNotificationColor = (notification) => {
    if (notification.is_read) return "transparent";

    switch (notification.notification_type) {
      case "upload_success":
        return "#e8f5e8";
      case "upload_error":
        return "#ffebee";
      case "ai_analysis":
        return "#e3f2fd";
      case "workflow_complete":
        return "#f3e5f5";
      default:
        return "#f5f5f5";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSourceLabel = (ingestionSource) => {
    switch (ingestionSource) {
      case 1:
        return "SharePoint";
      case 2:
        return "Web Scraped";
      case 3:
        return "Local Upload";
      default:
        return "Unknown";
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    handleMenuClose();
  };

  const handleClearAll = async () => {
    await deleteAllNotifications();
    handleMenuClose();
  };

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered...");
    await forceRefresh();
    handleMenuClose();
  };

  const renderNotificationDetails = (notification) => {
    const details = [];

    details.push(`Source: ${getSourceLabel(notification.ingestion_source)}`);

    // Parse metadata if available
    if (notification.metadata) {
      const metadata = typeof notification.metadata === "string" ? JSON.parse(notification.metadata) : notification.metadata;

      if (metadata.fileSize) {
        details.push(`Size: ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    return details.join(" • ");
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1,
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "1px solid #e0e0e0",
          minWidth: 380,
          maxWidth: 450,
          maxHeight: 600,
          overflow: "hidden",
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem", backgroundColor: "#0e3254", color: "white", padding: "5px" }}>
            Notifications
          </Typography>
          {unreadCount > 0 && <Chip label={unreadCount} size="small" color="primary" sx={{ height: 20, fontSize: "0.75rem", backgroundColor: "green", color: "white" }} />}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="More options">
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { borderRadius: 2, minWidth: 160 },
            }}
          >
            <MenuItem onClick={handleRefresh}>
              <Refresh fontSize="small" sx={{ mr: 1 }} />
              Refresh
            </MenuItem>
            <MenuItem onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              <MarkEmailRead fontSize="small" sx={{ mr: 1 }} />
              Mark all read
            </MenuItem>
            <MenuItem onClick={handleClearAll} disabled={notifications.length === 0}>
              <DeleteSweep fontSize="small" sx={{ mr: 1 }} />
              Clear all
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading notifications...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" size="small">
            {error}
          </Alert>
        </Box>
      )}

      {/* Notifications List */}
      {!loading && !error && (
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Psychology sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Upload some files to see notifications here
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 2,
                      cursor: "pointer",
                      backgroundColor: getNotificationColor(notification),
                      borderLeft: notification.is_read ? "none" : "4px solid #2196f3",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{getNotificationIcon(notification)}</ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.is_read ? 500 : 600,
                              fontSize: "0.875rem",
                              color: notification.is_read ? "#666" : "#333",
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#999", fontSize: "0.7rem", ml: 1 }}>
                            {formatTimestamp(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.8rem",
                              color: notification.is_read ? "#888" : "#555",
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          {renderNotificationDetails(notification) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#aaa",
                                fontSize: "0.7rem",
                              }}
                            >
                              {renderNotificationDetails(notification)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteNotification(notification.id);
                        }}
                        sx={{
                          opacity: 0.6,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" onClick={onClose} sx={{ textTransform: "none", fontSize: "0.875rem", backgroundColor: "black", color: "white", alignItems:"flex-end" }}>
            Close
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationPanel;
