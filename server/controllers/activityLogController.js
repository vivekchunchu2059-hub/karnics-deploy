const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const log = require('../logger');

const activityLogFilePath = () => dataPath('ActivityLogs', 'activityLog.json');

const ensureActivityLogFile = () => {
  const fp = activityLogFilePath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf8');
  }
};

const readLogs = () => {
  ensureActivityLogFile();
  const raw = fs.readFileSync(activityLogFilePath(), 'utf8');
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // If file is corrupted, don't break the app: reset to []
    return [];
  }
};

const writeLogs = (logs) => {
  ensureActivityLogFile();
  const normalized = Array.isArray(logs) ? logs : [];
  fs.writeFileSync(activityLogFilePath(), JSON.stringify(normalized, null, 2), 'utf8');
};

const logActivity = ({ username, role, page, action, before, after }) => {
  if (!username || !role || String(role).toLowerCase() === "superadmin") return;

  const logs = readLogs();
  const timestamp = new Date().toLocaleString("en-CA", {
    hour12: false,
  }).replace(",", "");

  let user = logs.find(u => 
    String(u.username).toLowerCase() === String(username).toLowerCase()
  );

  if (!user) {
    user = {
      username,
      role,
      lastActivity: timestamp,
      pages: {}
    };
    logs.push(user);
  }

  if (!user.pages[page]) {
    user.pages[page] = {
      created: [],
      updated: [],
      deleted: []
    };

    if (page === "Invoice") {
      user.pages[page].downloaded = [];
    }
  }

  const pageEntry = user.pages[page];

  if (page === "Inventory") {
    if (action === "create") {
      const skuValue = after?.sku || before?.sku || "";
      pageEntry.created.push({
        sku: skuValue,
        before,
        after,
        timestamp
      });
    }

    if (action === "update") {
      const changes = {};
    
      Object.keys(after || {}).forEach((key) => {
        if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
          changes[key] = {
            before: before?.[key],
            after: after?.[key]
          };
        }
      });
    
      pageEntry.updated.push({
        sku: after?.sku || before?.sku || "",
        before: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.before])
        ),
        after: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.after])
        ),
        timestamp
      });
    }

    if (action === "delete") {
      const skuValue = after?.sku || before?.sku || "";
      pageEntry.deleted.push({
        sku: skuValue,
        before,
        after,
        timestamp
      });
    }
  } else {
    // existing logic for other pages
    if (action === "create") {
      if (String(page).toLowerCase() === "invoice") {
        const invoiceNo = after?.invoiceNumber || before?.invoiceNumber || "";
        pageEntry.created.push({
          invoiceNumber: invoiceNo,
          before,
          after,
          timestamp,
        });
      } else {
        pageEntry.created.push({ timestamp });
      }
    }

    if (action === "update") {
      if (String(page).toLowerCase() === "invoice") {
        const invoiceNo = after?.invoiceNumber || before?.invoiceNumber || "";
    
        const diff = {};
    
        const compare = (b = {}, a = {}, path = "") => {
          Object.keys(a).forEach((key) => {
            if (key === "updatedAt") return;
    
            const newPath = path ? `${path}.${key}` : key;
    
            if (typeof a[key] === "object" && !Array.isArray(a[key])) {
              compare(b[key] || {}, a[key], newPath);
            } else if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
              diff[newPath] = {
                before: b[key],
                after: a[key]
              };
            }
          });
        };
    
        compare(before, after);
    
        pageEntry.updated.push({
          invoiceNumber: invoiceNo,
          before: Object.fromEntries(
            Object.entries(diff).map(([k, v]) => [k, v.before])
          ),
          after: Object.fromEntries(
            Object.entries(diff).map(([k, v]) => [k, v.after])
          ),
          timestamp,
        });
      }
    }

    if (action === "delete") {
      if (String(page).toLowerCase() === "invoice") {
        const invoiceNo = after?.invoiceNumber || before?.invoiceNumber || "";
        pageEntry.deleted.push({
          invoiceNumber: invoiceNo,
          before,
          after,
          timestamp,
        });
      } else {
        pageEntry.deleted.push({ timestamp });
      }
    }

    if (action === "download" && page === "Invoice") {
      pageEntry.downloaded = pageEntry.downloaded || [];
      pageEntry.downloaded.push({
        invoiceNumber: after?.invoiceNumber,
        timestamp
      });
    }
  }

  user.lastActivity = timestamp;

  writeLogs(logs);
};

const getAllActivityLogs = (req, res) => {
  try {
    log.info('Activity Logs called...');
    const logs = readLogs();
    const result = logs
      .map((user) => {
        const pages = user.pages || {};
        let latestTask = "";
        let latestTimestamp = "";

        Object.entries(pages).forEach(([page, data]) => {
          ["created", "updated", "deleted", "downloaded"].forEach((action) => {
            if (Array.isArray(data[action])) {
              data[action].forEach((entry) => {
                if (
                  !latestTimestamp ||
                  new Date(entry.timestamp) > new Date(latestTimestamp)
                ) {
                  latestTimestamp = entry.timestamp;
                  const actionLabel =
                    action === "downloaded"
                      ? "Downloaded"
                      : `${action.charAt(0).toUpperCase() + action.slice(1)}`;
                  latestTask = `${actionLabel} ${page}`;
                }
              });
            }
          });
        });

        return {
          username: user.username,
          role: user.role,
          taskPerformed: latestTask,
          timestamp: latestTimestamp,
        };
      })
      .filter((u) => u.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    log.info('Activity Logs fetched successfully');
    res.json(result);

  } catch (err) {
    log.error('Failed to fetch Activity Logs:', err);
    res.status(500).json({ error: "Failed to read logs" });
  }
};

const getUserActivityLogs = (req, res) => {
  log.info('User Activity Logs called...');
  try {
    const username =
      (req.params && req.params.username) ||
      (req.query && req.query.username) ||
      req.body?.username;

    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: 'Missing username' });
    }

    const usernameStr = String(username).trim();
    const storedLogs = readLogs();


    const user = (storedLogs || []).find((u) => String(u.username || '').trim() === usernameStr);
    if (!user) return res.json([]);

    const events = [];
    const role = user.role || '';
    const pages = user.pages || {};

    Object.keys(pages).forEach((pageKey) => {
      const entry = pages[pageKey] || {};
      (entry.created || []).forEach((c) => {
        const beforeVal = c?.before ?? null;
        const afterVal = c?.after ?? null;

        let beforeWithTarget = beforeVal;
        let afterWithTarget = afterVal;

        if (pageKey === "Inventory") {
          const sku = c?.sku || afterVal?.sku || beforeVal?.sku || "";
          beforeWithTarget = { ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}), sku };
          afterWithTarget = { ...(afterVal && typeof afterVal === "object" ? afterVal : {}), sku };
        }

        if (pageKey === "Invoice") {
          const invoiceNumber =
            c?.invoiceNumber || afterVal?.invoiceNumber || beforeVal?.invoiceNumber || "";
          beforeWithTarget = {
            ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}),
            invoiceNumber,
          };
          afterWithTarget = {
            ...(afterVal && typeof afterVal === "object" ? afterVal : {}),
            invoiceNumber,
          };
        }

        events.push({
          username: user.username,
          role,
          taskPerformed: `Created ${pageKey}`,
          timestamp: c?.timestamp || '',
          details: [
            {
              page: pageKey,
              before: beforeWithTarget,
              after: afterWithTarget,
            },
          ],
        });
      });

      (entry.updated || []).forEach((u) => {
        const splitNestedDiff = (diff) => {
          const beforeOut = {};
          const afterOut = {};

          if (!diff || typeof diff !== "object") {
            return { before: diff ?? null, after: diff ?? null };
          }

          Object.entries(diff).forEach(([key, val]) => {
            // items: [{ itemName, changes: { field: { before, after } } }]
            if (Array.isArray(val)) {
              beforeOut[key] = val.map((entry) => {
                const out = { ...entry };
                if (entry?.changes && typeof entry.changes === "object") {
                  const beforeChanges = {};
                  Object.entries(entry.changes).forEach(([field, pair]) => {
                    beforeChanges[field] = pair?.before ?? null;
                  });
                  out.changes = beforeChanges;
                }
                return out;
              });

              afterOut[key] = val.map((entry) => {
                const out = { ...entry };
                if (entry?.changes && typeof entry.changes === "object") {
                  const afterChanges = {};
                  Object.entries(entry.changes).forEach(([field, pair]) => {
                    afterChanges[field] = pair?.after ?? null;
                  });
                  out.changes = afterChanges;
                }
                return out;
              });

              return;
            }

            // installment/paymentDetails/customer: { field: { before, after } }
            if (val && typeof val === "object") {
              const beforeNested = {};
              const afterNested = {};

              Object.entries(val).forEach(([nestedKey, pair]) => {
                if (pair && typeof pair === "object" && ("before" in pair || "after" in pair)) {
                  beforeNested[nestedKey] = pair?.before ?? null;
                  afterNested[nestedKey] = pair?.after ?? null;
                } else {
                  // Fallback: preserve raw value
                  beforeNested[nestedKey] = pair ?? null;
                  afterNested[nestedKey] = pair ?? null;
                }
              });

              beforeOut[key] = beforeNested;
              afterOut[key] = afterNested;
              return;
            }

            beforeOut[key] = val ?? null;
            afterOut[key] = val ?? null;
          });

          return { before: beforeOut, after: afterOut };
        };

        const diffSplit = u?.changes ? splitNestedDiff(u.changes) : null;
        let beforeVal = diffSplit ? diffSplit.before : (u?.before ?? null);
        let afterVal = diffSplit ? diffSplit.after : (u?.after ?? null);

        // Preserve target fields for UI target column in updated rows.
        if (pageKey === "Inventory") {
          const sku = u?.sku || afterVal?.sku || beforeVal?.sku || "";
          beforeVal = { ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}), sku };
          afterVal = { ...(afterVal && typeof afterVal === "object" ? afterVal : {}), sku };
        }

        if (pageKey === "Invoice") {
          const invoiceNumber =
            u?.invoiceNumber || afterVal?.invoiceNumber || beforeVal?.invoiceNumber || "";
          beforeVal = {
            ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}),
            invoiceNumber,
          };
          afterVal = {
            ...(afterVal && typeof afterVal === "object" ? afterVal : {}),
            invoiceNumber,
          };
        }

        events.push({
          username: user.username,
          role,
          taskPerformed: `Updated ${pageKey}`,
          timestamp: u?.timestamp || '',
          details: [
            {
              page: pageKey,
              before: beforeVal,
              after: afterVal,
            },
          ],
        });
      });

      (entry.deleted || []).forEach((d) => {
        const beforeVal = d?.before ?? null;
        const afterVal = d?.after ?? null;

        let beforeWithTarget = beforeVal;
        let afterWithTarget = afterVal;

        if (pageKey === "Inventory") {
          const sku = d?.sku || afterVal?.sku || beforeVal?.sku || "";
          beforeWithTarget = { ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}), sku };
          afterWithTarget = { ...(afterVal && typeof afterVal === "object" ? afterVal : {}), sku };
        }

        if (pageKey === "Invoice") {
          const invoiceNumber =
            d?.invoiceNumber || afterVal?.invoiceNumber || beforeVal?.invoiceNumber || "";
          beforeWithTarget = {
            ...(beforeVal && typeof beforeVal === "object" ? beforeVal : {}),
            invoiceNumber,
          };
          afterWithTarget = {
            ...(afterVal && typeof afterVal === "object" ? afterVal : {}),
            invoiceNumber,
          };
        }

        events.push({
          username: user.username,
          role,
          taskPerformed: `Deleted ${pageKey}`,
          timestamp: d?.timestamp || '',
          details: [
            {
              page: pageKey,
              before: beforeWithTarget,
              after: afterWithTarget,
            },
          ],
        });
      });

      (entry.downloaded || []).forEach((d) => {
        events.push({
          username: user.username,
          role,
          taskPerformed: `Downloaded ${pageKey}`,
          timestamp: d?.timestamp || '',
          details: [{ page: pageKey, invoiceNumber: d?.invoiceNumber }],
        });
      });
    });

    events.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    log.info('User Activity Logs fetched successfully');
    return res.json(events);
  } catch (error) {
    log.error('Failed to fetch User Activity Logs:', error);
    return res.status(500).json({
      error: 'Failed to read user activity logs',
      details: error.message,
    });
  }
};

module.exports = {
  readLogs,
  writeLogs,
  logActivity,
  getAllActivityLogs,
  getUserActivityLogs,
};

