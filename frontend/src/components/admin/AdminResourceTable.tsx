
import { useEffect, useState } from "react";
import {
  Database,
  RefreshCw,
  Search,
  AlertCircle
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface AdminColumn {
  key: string;
  label: string;
}

interface AdminResourceTableProps {
  title: string;
  endpoint: string;
  columns: AdminColumn[];
}

type TableRecord = Record<string, unknown>;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function AdminResourceTable({
  title,
  endpoint,
  columns
}: AdminResourceTableProps) {
  const [items, setItems] = useState<TableRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(endpoint);

        if (active) {
          const records = response.data.items;

          setItems(
            Array.isArray(records) ? records : []
          );
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [endpoint, reloadCount]);

  const filteredItems = items.filter(item => {
    const text = columns
      .map(column => formatValue(item[column.key]))
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="container inner-page">
      {/* PAGE HEADER */}
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE ADMINISTRATION
        </span>

        <h1>{title}</h1>

        <p>
          View and search administrative records
          from the Gocelone database.
        </p>
      </div>

      <div className="panel">
        {/* TOOLBAR */}
        <div className="admin-table-toolbar">
          <div className="admin-table-title">
            <Database size={26} color="#167D85" />
            <h3>{title}</h3>
          </div>

          <div className="button-row">
            <div className="admin-search-box">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-outline"
              disabled={loading}
              onClick={() =>
                setReloadCount(previous => previous + 1)
              }
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <p>Loading records...</p>
        )}

        {/* ERROR */}
        {error && (
          <div className="form-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* TABLE */}
        {!loading && !error && (
          <div className="admin-table-scroll">
            <table className="admin-data-table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column.key}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={String(item._id ?? index)}>
                    {columns.map(column => (
                      <td key={column.key}>
                        {formatValue(item[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <p>No matching records found.</p>
            )}
          </div>
        )}

        {!loading && !error && (
          <p className="content-note">
            Showing {filteredItems.length} of{" "}
            {items.length} records
          </p>
        )}
      </div>

      <p className="content-note">
        This is a read-only admin interface.
        Adding, editing and deleting records
        require separate backend functionality.
      </p>
    </div>
  );
}
