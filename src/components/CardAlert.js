import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export default function CardAlert() {
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/alert");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAlertMessage(data.alert);
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <Card variant="outlined" sx={{ m: 1.5, p: 1.5 }}>
      <CardContent>
        <AutoAwesomeRoundedIcon fontSize="small" />
        <Typography gutterBottom sx={{ fontWeight: 600 }}>
          {alertMessage ? "Security Alert" : "No Alerts"}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {alertMessage || "You're all set!"}
        </Typography>
        {alertMessage && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => setAlertMessage(null)}
          >
            Dismiss
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
