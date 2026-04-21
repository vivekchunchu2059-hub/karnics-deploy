import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Box, Button, Pagination, Paper, TableBody, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { PageLayout } from "../../components/PageLayout";
import log from '../../utils/logger';
import { StyledTable, TableHeaderCell, TableDataRow, StyledTableCellData, StyledTableCellBold } from "./activityLogWidget";

type ActivityLogEvent = {
  username?: string;
  role?: string;
  taskPerformed?: string;
  timestamp?: string;
  details?: Array<{
    page?: string;
    before?: unknown;
    after?: unknown;
    timestamp?: string;
  }>;
};

type UserPagesEntry = {
  viewed: boolean;
  viewedAt: string | null;
  created: Array<{
    timestamp: string;
    sku?: string;
    invoiceNumber?: string;
    before?: unknown;
    after?: unknown;
  }>;
  updated: Array<{ before: unknown; after: unknown; timestamp: string }>;
  deleted: Array<{
    timestamp: string;
    sku?: string;
    invoiceNumber?: string;
    before?: unknown;
    after?: unknown;
  }>;
};

type UserPages = {
  username: string;
  role: string;
  pages: Record<string, UserPagesEntry>;
  lastActivity?: string;
};

type ActivityRow = {
  page: string;
  action: "Deleted" | "Updated" | "Created" | "Viewed" | "Downloaded";
  target: string;
  before: unknown;
  after: unknown;
  timestamp: string;
};

const stringifyCell = (val: unknown) => {
  if (val === undefined || val === null) return "-";
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
};

const getUpdatedFieldNamesSummary = (page: string, val: any) => {
  if (!val || typeof val !== "object" || Array.isArray(val)) return "-";

  const keys = Object.keys(val)
    .filter(Boolean)
    .filter((k) => k !== "sku" && k !== "invoiceNumber");

  if (page === "Inventory") {
    // Defensive: exclude sku even if present
    return keys.filter((k) => k !== "sku").join(", ") || "-";
  }

  if (page === "Invoice") {
    // Defensive: exclude invoiceNumber even if present
    return keys.filter((k) => k !== "invoiceNumber").join(", ") || "-";
  }

  return keys.join(", ") || "-";
};

export default function ActivityLogDetails() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserPages | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!username) return;

    const fetchDetails = async () => {
      log.info("Fetching Activity Log Details...");
        try {
        const res = await apiClient.get(`/api/activity-log/${encodeURIComponent(username)}`);
        log.info("Activity Log Details fetched successfully");
        const events: ActivityLogEvent[] = Array.isArray(res.data) ? res.data : [];

        const pages: Record<string, UserPagesEntry> = {};

        const ensurePage = (pageKey: string) => {
          if (!pages[pageKey]) {
            pages[pageKey] = {
              viewed: false,
              viewedAt: null,
              created: [],
              updated: [],
              deleted: [],
            };
          }
          return pages[pageKey];
        };

        events.forEach((evt) => {
          const task = String(evt.taskPerformed || "");
          const ts = evt.timestamp ? String(evt.timestamp) : "";
          const details = Array.isArray(evt.details) ? evt.details : [];
          const detailPage = details?.[0]?.page ? String(details[0].page) : "";

          const parts = task.split(/\s+/).filter(Boolean);
          const actionWord = (parts[0] || "").toLowerCase();
          const pageKeyFromTask = parts.slice(1).join(" ");
          const pageKey = detailPage || pageKeyFromTask;

          if (!pageKey) return;

          const pageEntry = ensurePage(pageKey);

          if (actionWord === "viewed") {
            pageEntry.viewed = true;
            pageEntry.viewedAt = ts || pageEntry.viewedAt;
          } else if (actionWord === "created") {
            const beforeVal = details?.[0]?.before ?? null;
            const afterVal = details?.[0]?.after ?? null;
            pageEntry.created.push({
              timestamp: ts,
              before: beforeVal,
              after: afterVal,
              sku: (afterVal as any)?.sku || (beforeVal as any)?.sku || undefined,
              invoiceNumber:
                (afterVal as any)?.invoiceNumber ||
                (beforeVal as any)?.invoiceNumber ||
                undefined,
            });
          } else if (actionWord === "updated") {
            const beforeVal = details?.[0]?.before;
            const afterVal = details?.[0]?.after;
            pageEntry.updated.push({
              before: beforeVal ?? null,
              after: afterVal ?? null,
              timestamp: ts,
            });
          } else if (actionWord === "deleted") {
            const beforeVal = details?.[0]?.before ?? null;
            const afterVal = details?.[0]?.after ?? null;
            pageEntry.deleted.push({
              timestamp: ts,
              before: beforeVal,
              after: afterVal,
              sku: (beforeVal as any)?.sku || (afterVal as any)?.sku || undefined,
              invoiceNumber:
                (beforeVal as any)?.invoiceNumber ||
                (afterVal as any)?.invoiceNumber ||
                undefined,
            });
          }
        });

        setUser({
          username: username,
          role: events?.[0]?.role ? String(events[0].role) : "",
          pages,
        });
      } catch (error) {
        log.error("Failed to fetch activity log details:", error);
        setUser(null);
      }
    };

    fetchDetails();
  }, [username]);

  const truncateStyle = useMemo(
    () => ({
      maxWidth: 260,
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    []
  );

  const rows = useMemo(() => {
    if (!user) return [];

    const combinedRows: ActivityRow[] = [];
    const getTarget = (page: string, entry: any) => {
      if (page === "Inventory") {
        return entry.sku || entry.after?.sku || entry.before?.sku || "-";
      }

      if (page === "Invoice") {
        return (
          entry.invoiceNumber ||
          entry.after?.invoiceNumber ||
          entry.before?.invoiceNumber ||
          "-"
        );
      }

      // For Customer/Profile updates: show which fields were updated (not JSON).
      const afterVal = entry?.after;
      const beforeVal = entry?.before;
      return getUpdatedFieldNamesSummary(page, afterVal ?? beforeVal);
    };

    Object.entries(user.pages || {}).forEach(([page, data]) => {
      if (data.viewed) {
        combinedRows.push({
          page,
          action: "Viewed",
          target: getTarget(page, data),
          before: "-",
          after: "-",
          timestamp: data.viewedAt || "-",
        });
      }

      data.created.forEach((c) => {
        combinedRows.push({
          page,
          action: "Created",
          target: getTarget(page, c),
          before: "-",
          after: c.after ?? (c.sku ? { sku: c.sku } : c.invoiceNumber ? { invoiceNumber: c.invoiceNumber } : "-"),
          timestamp: c.timestamp || "-",
        });
      });

      data.updated.forEach((u) => {
        combinedRows.push({
          page,
          action: "Updated",
          target: getTarget(page, u),
          before: u.before,
          after: u.after,
          timestamp: u.timestamp || "-",
        });
      });

      data.deleted.forEach((d) => {
        combinedRows.push({
          page,
          action: "Deleted",
          target: getTarget(page, d),
          before: d.before ?? (d.sku ? { sku: d.sku } : d.invoiceNumber ? { invoiceNumber: d.invoiceNumber } : "-"),
          after: "-",
          timestamp: d.timestamp || "-",
        });
      });
    });

    return combinedRows;
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, page]);

  return (
    <PageLayout title="activity log details" icon={<span />} noCard>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

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
              <TableHeaderCell>Page</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Target</TableHeaderCell>
              <TableHeaderCell>Before</TableHeaderCell>
              <TableHeaderCell>After</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!rows.length ? (
              <TableRow>
                <StyledTableCellBold colSpan={6} style={{ padding: "16px 10px" }}>
                  No details found
                </StyledTableCellBold>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableDataRow key={`${row.page}-${row.action}-${idx}-${row.timestamp}`}>
                  <StyledTableCellData>{row.page}</StyledTableCellData>
                  <StyledTableCellData>{row.action}</StyledTableCellData>
                  <StyledTableCellData>{row.target || "-"}</StyledTableCellData>
                  <StyledTableCellData>
                    <Tooltip
                      title={
                        row.action === "Updated"
                          ? JSON.stringify(row.before, null, 2)
                          : stringifyCell(row.before)
                      }
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          ...truncateStyle,
                          fontSize: "12px"
                        }}
                      >
                        {row.action === "Updated"
                          ? getUpdatedFieldNamesSummary(row.page, row.before)
                          : stringifyCell(row.before)}
                      </Typography>
                    </Tooltip>
                  </StyledTableCellData>
                  <StyledTableCellData>
                    <Tooltip title={stringifyCell(row.after)}>
                      <Typography
                        variant="body2"
                        sx={{
                          ...truncateStyle,
                          fontSize: "12px"
                        }}
                      >
                        {row.action === "Updated"
                          ? getUpdatedFieldNamesSummary(row.page, row.after)
                          : stringifyCell(row.after)}
                      </Typography>
                    </Tooltip>
                  </StyledTableCellData>
                  <StyledTableCellData>{row.timestamp || "-"}</StyledTableCellData>
                </TableDataRow>
              ))
            )}
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
          Showing {rows.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} -{" "}
          {Math.min(page * itemsPerPage, rows.length)} of {rows.length} activity logs
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

