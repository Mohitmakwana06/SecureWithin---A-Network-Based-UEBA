import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";

const columns = [
  "id",
  "timestamp",
  "client_name",
  "host_id",
  "os_platform",
  "network_transport",
  "network_type",
  "source_bytes",
  "destination_ip",
  "event_action",
  "event_duration",
  "source_mac",
  "flow_id",
  "server_domain",
];

const ClientTable = ({ clientId }) => {
  const [data, setData] = useState([]);
  const [start, setStart] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  // Fetch logs from the API
  const fetchLogs = async (startIndex = 0, reset = false) => {
    if (!clientId) {
      console.error("No clientId provided:", clientId);
      setError("No Client ID provided. Please check the configuration.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching logs for client: ${clientId} with startIndex: ${startIndex}`);

      const response = await fetch(
        `http://localhost:8000/clients/${clientId}/refresh?start=${startIndex}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const clientDetails = await response.json();
      console.log("Fetched Data:", clientDetails);

      if (!clientDetails || !Array.isArray(clientDetails.logs)) {
        throw new Error("Invalid logs format received from API.");
      }

      const newLogs = clientDetails.logs || [];
      setData((prevLogs) => (reset ? newLogs : [...prevLogs, ...newLogs]));
      setStart(startIndex + newLogs.length);
      setHasMoreLogs(newLogs.length === 100); // Assume 100 logs per page
    } catch (error) {
      console.error("Fetching error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger log fetching when clientId changes
  useEffect(() => {
    if (clientId) {
      console.log("Fetching logs for clientId:", clientId);
      fetchLogs(0, true); // Reset logs on clientId change
    } else {
      console.warn("No clientId provided. Skipping log fetch.");
    }
  }, [clientId]);

  return (
    <Card sx={{ paddingBottom: 2 }}>
      <CardContent>
        {/* Title */}
        <Typography variant="h6" gutterBottom>
          Logs for Client {clientId || "Unknown"}
        </Typography>

        {/* Refresh Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => fetchLogs(0, true)}
          disabled={isLoading}
          sx={{ marginBottom: 2 }}
        >
          {isLoading ? "Refreshing..." : "Refresh Logs"}
        </Button>

        {/* Error Message */}
        {error && (
          <Typography variant="body1" color="error" sx={{ marginBottom: 2 }}>
            Error: {error}
          </Typography>
        )}

        {/* Loading Indicator */}
        {isLoading && data.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <CircularProgress />
          </div>
        )}

        {/* Logs Table */}
        {Array.isArray(data) && data.length > 0 ? (
          <TableContainer component={Paper} sx={{ marginTop: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={index}>{column.replace(/_/g, " ")}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {row[column] !== undefined ? String(row[column]) : "N/A"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !isLoading && (
            <Typography variant="body1" color="textSecondary" sx={{ marginTop: 2 }}>
              No logs available for this client.
            </Typography>
          )
        )}

        {/* Load More Button */}
        {hasMoreLogs && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => fetchLogs(start)}
            disabled={isLoading || !hasMoreLogs}
            sx={{ marginTop: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Load More Logs"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientTable;