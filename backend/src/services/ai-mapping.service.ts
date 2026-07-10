import { ai } from "./gemini.client";
const CRM_FIELDS_DESCRIPTION = `
- name: person's full name
- email: email address
- country_code: phone country code (e.g., +91)
- mobile_without_country_code: phone number without country code
- company: company or organization name
- city: city name
- state: state/province name
- country: country name
- lead_owner: person responsible for this lead internally
- crm_status: lead status
- crm_note: notes or remarks
- data_source: where this lead came from
- possession_time: property possession timeframe (real estate context)
- description: general description field
`;

export async function getColumnMapping(
  columns: string[],
  sampleRows: Record<string, string>[]
) {
  const prompt = `
You are a data mapping assistant for a CRM system.

Your task: analyze the CSV column names and sample values, then map each column to the CRM field it most likely represents.

CRM FIELDS (map to these exact keys):
${CRM_FIELDS_DESCRIPTION}

Note: "created_at" is NOT expected to map from any column — leave it out of your response entirely; it is generated separately.

CSV COLUMNS: ${JSON.stringify(columns)}

SAMPLE ROWS: ${JSON.stringify(sampleRows, null, 2)}

RULES:
- Map each CSV column to the single CRM field it most likely represents.
- If a column contains multiple combined pieces of information, map it to whichever CRM field is most dominant, and add a note in "ambiguousColumns".
- If a column doesn't clearly match any CRM field, map it to null.
- Never guess wildly — only map with reasonable confidence.
- Respond with ONLY valid JSON, no explanation, no markdown formatting, no code fences.

RESPONSE FORMAT (strict JSON):
{
  "mapping": { "<original column name>": "<crm field or null>" },
  "ambiguousColumns": [ { "column": "<name>", "reason": "<short reason>" } ]
}
`;

 const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents: prompt,
});

  const rawText = response.text ?? "";
  const cleanedText = rawText.replace(/```json|```/g, "").trim();

  return JSON.parse(cleanedText);
}