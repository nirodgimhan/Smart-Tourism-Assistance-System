
import { useState, type FormEvent } from "react";
import { Receipt, Upload, AlertTriangle } from "lucide-react";
import { api, getErrorMessage } from "../../services/api";

interface ReceiptResult {
  merchant?: string;
  currency?: string;
  total?: number;
  extractedItems?: {
    name: string;
    quantity?: number;
    price?: number;
  }[];
  warnings?: string[];
  confidence?: number;
}

export default function ReceiptScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function scan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setError("Select a receipt image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("receipt", file);

    try {
      const { data } = await api.post(
        "/receipts/scan",
        form,
        {
          headers: { "Content-Type": undefined },
          timeout: 60000
        }
      );

      setResult(data.result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          TOURIST SAFETY
        </span>
        <h1>AI Receipt Scanner</h1>
        <p>
          Upload a receipt for OCR extraction and
          contextual price analysis.
        </p>
      </div>

      <form className="panel" onSubmit={scan}>
        <Receipt size={34} />

        <label style={{ marginTop: 20 }}>
          Select Receipt Image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={e => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
            required
          />
        </label>

        {file && (
          <p>
            <strong>Selected:</strong> {file.name}
          </p>
        )}

        <button
          className="btn btn-primary"
          disabled={!file || loading}
        >
          <Upload size={18} />
          {loading ? "Processing..." : "Scan Receipt"}
        </button>
      </form>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="panel">
          <h2>Receipt Analysis</h2>

          <p>
            <strong>Merchant:</strong>{" "}
            {result.merchant || "Unknown"}
          </p>

          <p>
            <strong>Total:</strong>{" "}
            {result.currency || "LKR"}{" "}
            {result.total ?? "Not detected"}
          </p>

          {result.confidence !== undefined && (
            <p>
              OCR Confidence:{" "}
              {(result.confidence * 100).toFixed(1)}%
            </p>
          )}

          <h3>Extracted Items</h3>

          {(result.extractedItems || []).map((item, index) => (
            <div className="receipt-result-row" key={index}>
              <span>{item.name}</span>
              <span>
                {item.quantity ?? 1} × {item.price ?? "N/A"}
              </span>
            </div>
          ))}

          {!!result.warnings?.length && (
            <div>
              <h3><AlertTriangle size={19} /> Warnings</h3>

              {result.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="content-note">
        Upload only receipts you are authorized to process.
        Remove unnecessary personal details. The OCR and
        anomaly-detection backend must be connected.
      </p>
    </div>
  );
}
