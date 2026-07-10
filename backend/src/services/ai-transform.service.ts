import { GoogleGenAI } from "@google/genai";
import { CrmRecordsResponseSchema } from "../schemas/crm-record.schema";
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey });

const ALLOWED_CRM_STATUS = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

const ALLOWED_DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

function buildTransformPrompt(
  mapping: Record<string, string | null>,
  rows: Record<string, string>[]
) {
  return `
You are a data transformation assistant for a CRM system.

You will receive:
1. A column mapping (which original CSV column maps to which CRM field)
2. A batch of raw CSV rows

Your job: transform each row into a clean CRM record, following these rules exactly.

COLUMN MAPPING:
${JSON.stringify(mapping, null, 2)}

RAW ROWS:
${JSON.stringify(rows, null, 2)}

TRANSFORMATION RULES:

1. SKIP LOGIC:
   - If a row has NEITHER a usable email NOR a usable phone number, skip it entirely.
   - Put skipped rows in the "skipped" array with a short reason.

2. MULTIPLE EMAILS:
   - If a cell contains more than one email (separated by commas, slashes, spaces, etc.), use the FIRST valid one as "email".
   - Put any additional emails as plain text inside "crm_note" (append, don't overwrite existing notes).

3. MULTIPLE PHONE NUMBERS:
   - If a cell contains more than one phone number, use the FIRST valid one, split into "country_code" and "mobile_without_country_code".
   - Put any additional phone numbers as plain text inside "crm_note".
   - If no country code is present, leave "country_code" empty rather than guessing.

4. CRM_STATUS:
   - Only use one of these exact values: ${JSON.stringify(ALLOWED_CRM_STATUS)}
   - If the row's status doesn't clearly match one of these, leave "crm_status" empty. Never invent a new status value.

5. DATA_SOURCE:
   - Only use one of these exact values: ${JSON.stringify(ALLOWED_DATA_SOURCES)}
   - If it doesn't clearly match one of these, leave "data_source" empty.

6. CREATED_AT:
   - If the row has a usable date value, convert it to a JavaScript-compatible ISO date string.
   - If no date is available, leave "created_at" empty — it will be filled in separately by our system.

7. GENERAL:
   - Never invent or hallucinate any data not present in the row.
   - Only fill a field if you have reasonable confidence based on the actual row data.
   - Normalize city/state names to standard casing (e.g., "bangalore" → "Bangalore") but do not guess a city/state that isn't stated.


   RESPONSE FORMAT (strict JSON, no markdown, no explanation):
{
  "records": [
    {
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": "",
      "created_at": ""
    }
  ],
  "skipped": [
    { "row": {}, "reason": "" }
  ]
}
`;
}

export async function generateCrmRecords(
  mapping: Record<string, string | null>,
  rows: Record<string, string>[]
) {
  const prompt = buildTransformPrompt(mapping, rows);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ?? "";
  const cleanedText = rawText.replace(/```json|```/g, "").trim();

  const parsedJson = JSON.parse(cleanedText);

  const validationResult = CrmRecordsResponseSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    console.error("Zod validation failed:", validationResult.error.issues);
    throw new Error("AI returned data that failed validation");
  }

  return validationResult.data;
}