import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Box, Pagination, Paper, TableBody, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { PageLayout } from "../../components/PageLayout";
import { StyledTable, TableHeaderCell, TableDataRow, StyledTableCellData, StyledTableCellBold } from "./activityLogWidget";
import { apiClient } from "../../api";
import { useNavigate } from "react-router-dom";
import log from '../../utils/logger';

type ActivityLogUserRow = {
  username: string;
  role: string;
  taskPerformed: string;
  timestamp: string;
};

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLogUserRow[]>([]);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchActivities = async () => {
      log.info("Fetching Activity Logs...");
      try {
        const res = await apiClient.get("/api/activity-log");
        log.info("Activity Logs fetched successfully");
        const rows = Array.isArray(res.data) ? res.data : [];
        setActivities(
          rows.map((r: any) => ({
            username: String(r.username || ""),
            role: String(r.role || ""),
            taskPerformed: String(r.taskPerformed || ""),
timestamp: String(r.timestamp || "")
          }))
        );
      } catch (error) {
        log.error("Failed to fetch activities:", error);
        setActivities([]);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((row) => {
      const usernameMatches =
        !usernameFilter ||
        row.username.toLowerCase().includes(usernameFilter.toLowerCase().trim());

      const dateMatches =
        !dateFilter ||
        String(row.timestamp || "").includes(dateFilter);

      return usernameMatches && dateMatches;
    });
  }, [activities, usernameFilter, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [usernameFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / itemsPerPage));
  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredActivities.slice(start, start + itemsPerPage);
  }, [filteredActivities, page]);

  return (
    <PageLayout
      title="activity log"
      icon={<HistoryIcon sx={{ fontSize: 26 }} />}
      noCard
      headerRight={
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            type="date"
            placeholder="Date"
            variant="outlined"
            size="small"
            sx={{ backgroundColor: "white" }}
            value={dateFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setDateFilter(e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="text"
            placeholder="Search username"
            variant="outlined"
            size="small"
            sx={{ backgroundColor: "white" }}
            value={usernameFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setUsernameFilter(e.target.value);
            }}
          />
        </Box>
      }
    >
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
        }}
      >
        <StyledTable>
        <TableHead>
  <TableRow>
    <TableHeaderCell>S.No.</TableHeaderCell>
    <TableHeaderCell>User Name</TableHeaderCell>
    <TableHeaderCell>Role</TableHeaderCell>
    <TableHeaderCell>Task Performed</TableHeaderCell>
    <TableHeaderCell>Timestamp</TableHeaderCell>
  </TableRow>
</TableHead>

<TableBody>
  {paginatedActivities.map((row, idx) => (
    <Tooltip title="See in detail" placement="top" key={`${row.username}-${idx}`}>
      <TableDataRow
        onClick={() => navigate(`/activity-log/${row.username}`)}
        sx={{ cursor: "pointer" }}
      >
        <StyledTableCellData>{(page - 1) * itemsPerPage + idx + 1}</StyledTableCellData>
        <StyledTableCellBold>{row.username}</StyledTableCellBold>
        <StyledTableCellData>{row.role}</StyledTableCellData>
        <StyledTableCellData>{row.taskPerformed}</StyledTableCellData>
        <StyledTableCellData>{row.timestamp}</StyledTableCellData>
      </TableDataRow>
    </Tooltip>
  ))}
</TableBody>
        </StyledTable>
      </TableContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          mt: 3,
        }}
      >
        <Typography sx={{ fontSize: "13px", color: "#666" }}>
          Showing {filteredActivities.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} -{" "}
          {Math.min(page * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activity logs
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_event: ChangeEvent<unknown>, value: number) => setPage(value)}
          siblingCount={0}
          boundaryCount={1}
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: "14px",
              minWidth: "32px",
              height: "32px",
              margin: "0 2px",
              border: "1px solid #d3d3d3",
              borderRadius: "4px",
              color: "#424242",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
              "&.Mui-selected": {
                backgroundColor: "#6b1010",
                color: "#ffffff",
                borderColor: "#2c2c2c",
                "&:hover": {
                  backgroundColor: "#8b1515",
                },
              },
            },
            "& .MuiPaginationItem-previousNext": {
              fontSize: "16px",
            },
          }}
        />
      </Box>
    </PageLayout>
  );
}

