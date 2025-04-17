import React, { useEffect, useRef, useState } from "react";
import {
  Stack, Badge, ClickAwayListener, Divider, IconButton, List,
  ListItemButton, ListItemAvatar, ListItemText, Paper, Popper, Tooltip,
  Typography, Avatar, Box,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { CheckCircleOutlined, NotificationsActive } from "@mui/icons-material";
import ColorModeSelect from "../shared-theme/ColorModeSelect";

export default function Header() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    let socket;

    const connectWebSocket = () => {
      socket = new WebSocket("ws://localhost:8000/ws/alert");

      socket.onopen = () => console.log("✅ WebSocket Connected");

      socket.onmessage = (event) => {
        console.log("📩 WebSocket Message Received:", event.data);
        
        try {
          const data = JSON.parse(event.data);

          if (data.message && data.timestamp) {
            setNotifications((prev) => [
              { message: data.message, time: data.timestamp },
              ...prev,
            ]);
            setRead((prev) => prev + 1);
          } else {
            console.warn("⚠️ Unexpected WebSocket data format:", data);
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
      };

      socket.onclose = () => {
        console.log("⚠️ WebSocket Disconnected, retrying in 5 seconds...");
        setTimeout(connectWebSocket, 5000);
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  return (
    <Stack direction="row" 
      sx={{
        display: { xs: "none", md: "flex" },
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        maxWidth: "100%",
        pt: 1,
      }}
      spacing={2}
    >
      {/* Notification Icon */}
      <Box sx={{ position: "relative", display: "inline-block",align:"right" }}>
        <IconButton ref={anchorRef} color="inherit" onClick={handleToggle}>
          <Badge badgeContent={read} color="primary">
            <NotificationsRoundedIcon />
          </Badge>
        </IconButton>

        {/* Notification Popper */}
        <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" disablePortal sx={{ zIndex: 1201 }}>
          <Paper sx={{ width: 350, height: 400, maxWidth: "100%", mt: 1.5 }}>
            <ClickAwayListener onClickAway={handleClose}>
              <Box sx={{ p: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1 }}>
                  <Typography variant="h6" sx={{ pl: 1 }} align="left">
                    Notifications
                  </Typography>
                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={() => { setNotifications([]); setRead(0); }} color="success">
                      <CheckCircleOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>
                <List>
                  {notifications.length > 0 ? (
                    notifications.map((alert, index) => (
                      <React.Fragment key={index}>
                        <ListItemButton>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "error.lighter" }}>
                              <NotificationsActive />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={alert.message} secondary={alert.time} />
                        </ListItemButton>
                        <Divider />
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography sx={{ textAlign: "center", p: 2, color: "text.secondary" }}>
                      No new notifications
                    </Typography>
                  )}
                </List>
              </Box>
            </ClickAwayListener>
          </Paper>
        </Popper>
      </Box>
      <ColorModeSelect sx={{ position: "fixed", top: "1rem", right: "1rem" }} />
    </Stack>
  );
}
