"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { UploadCloud, FileText, Loader2, Download, ChevronDown, ChevronUp } from "lucide-react";
import ResultsTable from "./ResultsTable";

type UploadStatus = "idle" | "loading" | "success" | "error";

export default function CsvUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSkipped, setShowSkipped] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setSelectedFile(file);
    setStatus("idle");
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      preview: 10,
      complete: (results) => {
        setPreviewRows(results.data);
        setPreviewColumns(results.meta.fields ?? []);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setStatus("success");
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("Failed to process the file. Please try again.");
      setStatus("error");
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-records.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    if (!result || result.records.length === 0) return;
    const headers = Object.keys(result.records[0]);
    const csvRows = [
      headers.join(","),
      ...result.records.map((record: any) =>
        headers.map((h) => `"${String(record[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer
          ${isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-zinc-400" />
        {isDragActive ? (
          <p className="text-zinc-700 dark:text-zinc-300">Drop the CSV here...</p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            Drag & drop a CSV file here, or click to select one
          </p>
        )}
      </div>

      {selectedFile && previewRows.length > 0 && status === "idle" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {selectedFile.name} — showing first {previewRows.length} rows
              </span>
            </div>
            <button
              onClick={handleConfirmImport}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Confirm Import
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  {previewColumns.map((col) => (
                    <th key={col} className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-200">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                    {previewColumns.map((col) => (
                      <td key={col} className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            AI is processing your CSV, this may take a moment...
          </p>
        </div>
      )}

      {status === "error" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && result && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ✅ Processed {result.totalRows} rows — {result.importedCount} imported,{" "}
              {result.skippedCount} skipped.
            </p>
            <div className="flex gap-2">
              <button
                onClick={downloadJson}
                className="flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-transparent dark:text-green-300"
              >
                <Download className="h-4 w-4" /> JSON
              </button>
              <button
                onClick={downloadCsv}
                className="flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-transparent dark:text-green-300"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
            </div>
          </div>

          <ResultsTable records={result.records} />

          {result.skipped.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <button
                onClick={() => setShowSkipped(!showSkipped)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-amber-800 dark:text-amber-300"
              >
                <span>⚠️ {result.skipped.length} record(s) skipped</span>
                {showSkipped ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSkipped && (
                <div className="space-y-2 border-t border-amber-200 p-4 dark:border-amber-900">
                  {result.skipped.map((item: any, i: number) => (
                    <div key={i} className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-medium">Reason:</span> {item.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}