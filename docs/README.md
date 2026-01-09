# IRI Data Dictionary

This directory contains field definitions for IRI APIs in JSON format.

## Structure

```
data-dictionaries/
├── canonical-fields.json          # Auto-generated from domain files
├── appstatus-all.json             # All appstatus fields (with API properties)
└── appstatus/                     # Domain-specific field definitions
    ├── appstatus-header-fields.json
    ├── appstatus-path-fields.json
    ├── appstatus-query-fields.json
    ├── appstatus-policy-summary-fields.json
    ├── appstatus-policy-fields.json
    ├── appstatus-cansell-fields.json
    ├── appstatus-suitability-fields.json
    ├── appstatus-documents-fields.json
    ├── appstatus-funding-fields.json
    ├── appstatus-producer-individual-fields.json
    ├── appstatus-producer-entity-fields.json
    ├── appstatus-party-individual-fields.json
    ├── appstatus-party-entity-fields.json
    ├── appstatus-detail-fields.json
    ├── appstatus-search-request-fields.json
    ├── appstatus-search-response-fields.json
    └── appstatus-paging-fields.json
```

## Field Schema

Each field follows this JSON schema:

```json
{
  "fieldName": "string (required)",
  "displayName": "string",
  "domain": "string (e.g., Integration, Policy, Funding)",
  "definition": "string (human-readable description)",
  "type": "string (e.g., string, integer, boolean, datetime, array)",
  "required": boolean,
  "apiRequired": boolean,
  "location": "string (header, path, query, body)",
  "allowedValues": "string (comma-separated or description)",
  "pattern": "string (regex or descriptive pattern)",
  "minLength": number | null,
  "maxLength": number | null,
  "minValue": number | null,
  "maxValue": number | null,
  "examples": array,
  "notes": "string",
  "owner": "string (team or department)",
  "status": "string (active, deprecated)"
}
```

## Maintenance

### Adding a New Field

1. Determine which domain the field belongs to
2. Edit the appropriate JSON file in `appstatus/`
3. Run the build script: `node scripts/build-aggregates.js`
4. Test in browser: Open `data-dictionary.html?api=appstatus`

### Creating a New Domain File

1. Create a new JSON file: `appstatus/appstatus-{domain}-fields.json`
2. Add fields following the schema above
3. Update `scripts/build-aggregates.js` to include the new file
4. Update `docs/data-dictionary.html` dictionaryDefinitions array
5. Run build script

### Regenerating Aggregates

After editing any domain file:

```bash
cd /workspaces/iri
node scripts/build-aggregates.js
```

This regenerates:
- `canonical-fields.json` (used by overlay system)
- `appstatus-all.json` (complete field list with API properties)

## Source of Truth

The **domain-specific JSON files** in the `appstatus/` directory are the source of truth.

The Excel file (`IRI_Application Status Data Dictionary.xlsx`) was the original source and has been archived after migration.

## Viewing

- **Data Dictionary**: Open `/docs/data-dictionary.html?api=appstatus`
- **API Overlay**: Open `/docs/api-overlay.html`
