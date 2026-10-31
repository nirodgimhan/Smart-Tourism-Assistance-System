
import { useEffect, useState } from "react";

import {
  Database,
  RefreshCw
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface Column {
  key: string;
  label: string;
}

interface Props {
  title: string;
  endpoint: string;
  columns: Column[];
}

type TableRow = Record<string, unknown>;

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
}: Props) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(endpoint);

        if (active) {
          setRows(
            Array.isArray(data.items) ? data.items : []
          );
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [endpoint, reloadKey]);

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          GOCELONE ADMINISTRATION
        </span>

        <h1>{title}</h1>

        <p>
          View administrative records from the
          connected Gocelone backend.
        </p>
      </div>

      <div className="panel">
        <div className="button-row">
          <Database size={25} />

          <strong>{title}</strong>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setReloadKey(key => key + 1)}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {loading && <p>Loading records...</p>}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

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
                {rows.map((row, index) => (
                  <tr key={String(row._id ?? index)}>
                    {columns.map(column => (
                      <td key={column.key}>
                        {formatValue(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 && (
              <p>No records available.</p>
            )}
          </div>
        )}
      </div>

      <p className="content-note">
        This is a read-only admin table. Creating,
        editing and deleting records require
        additional protected backend APIs.
      </p>
    </div>
  );
}
