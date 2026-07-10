import { Router, Request, Response } from "express";
import multer from "multer";
import Papa from "papaparse";
import { getColumnMapping } from "../services/ai-mapping.service";
import { generateCrmRecords } from "../services/ai-transform.service";
import { chunkArray } from "../utils/batch.util";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

const router = Router();

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const csvString = req.file.buffer.toString("utf-8");

  const parsed = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return res.status(400).json({
      error: "Failed to parse CSV",
      details: parsed.errors,
    });
  }

  try {
    const columns = parsed.meta.fields ?? [];
    const sampleRows = parsed.data.slice(0, 3);

    // Phase 1: figure out column mapping
    const columnMappingResult = await getColumnMapping(columns, sampleRows);
    const mapping = columnMappingResult.mapping;

    // Phase 2: transform rows in batches
    const batches = chunkArray(parsed.data, 50);

    const allRecords: any[] = [];
    const allSkipped: any[] = [];

    for (const batch of batches) {
      const result = await generateCrmRecords(mapping, batch);
      allRecords.push(...result.records);
      allSkipped.push(...result.skipped);
    }

    res.status(200).json({
      message: "File processed successfully",
      totalRows: parsed.data.length,
      totalBatches: batches.length,
      columnMapping: mapping,
      importedCount: allRecords.length,
      skippedCount: allSkipped.length,
      records: allRecords,
      skipped: allSkipped,
    });
  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({ error: "Failed to process CSV" });
  }
});

export default router;