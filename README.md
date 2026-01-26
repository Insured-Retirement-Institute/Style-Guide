# Style Guide

The style guide provides rules, regulations, and recommendations for Digital-First standards. OpenAPI definitions can be found on the [GitHub Page](https://insured-retirement-institute.github.io/Style-Guide/) of this repository.

## Style Conventions

Field naming
- **Booleans**: Should be prefixed with is or has.
- **Lists/Arrays**: Use plural nouns to represent the array itself and singular nouns to represent the elements within the array.

Custom headers
- **_correlationId_**: Optional custom header to be returned to the caller in response payload

Query String Parameters
- Sending **_Personally Identifiable Information (PII)_** as query string parameters such as names, addresses, email addresses, or account numbers, directly in URL query strings is a common practice to be avoided due to the significant privacy and security risks involved. 
- **_associatedFirmId_**: Optional query parameter for the associated firm ID

Regular Expressions
- There is no single universally adopted regex "standard," but Perl-Compatible Regular Expressions (PCRE) is the most widely supported and influential standard

Response Body Standards
  - Response object body must only contain the resource or collection of resources that were requested (error responses are an exception to this rule.)
    - Additional response metadata should be in the response header (eg. correlationId)
  - The response body should __BE__ the resource or array rather than an object that contains a named object or array that contains the data.
  <details>
    <summary>Examples</summary>
    <code>
    {
      "attr1": "val1",
      "attr2": "val2",
      ...
    }
  </code>
    rather than
  <code>
    {
      "objName":
      {
        "attr1": "val1",
        "attr2": "val2",
        ...
      }
    }
  </code>
  and
  <code>
    [
      {
        "attr1": "val1",
        "attr2": "val2",
        ...
      },
      {
        "attr1": "val3",
        "attr2": "val4",
        ...
      },
      ...
    ]
  </code>
    rather than
  <code>
    {
      "arrayName": [
        {
          "attr1": "val3",
          "attr2": "val4"
        },
    ...
      ]
    }
  </code>
</details>

Data definitions  
- **_policyNumber_** is the term used to describe the unique identifier of the policy.
- **_producer_** is the preferred nomenclature when referring to licensed/appointed professional or firm selling products.
  - **_producerNumber_**: Carrier assigned unique identifier
  - **_npn_**: National Producer Number
  - **_crdNumber_**: Central Registration Depository number
- **_party_** is the term used to describe a party to the policy (that is not a producer) and may be an individual or another legal entity.
- Describing individuals and entities
  - **_firstName_**
  - **_middleName_**
  - **_lastName_**
  - **_taxId_**
  - **_name_** (for business/entity)

## API Versioning

- APIs will utilize versioning at the URL level. In this method, the API endpoint URL includes the major version number. For example, users wanting to retrieve all products from a database would send a request to https://example-api.com/v1/products. The specific version of an API can be specified as an optional header as outlined above.
- Release changes will institute [Semantic Versioning (SemVer)](https://semver.org/) for the versioning scheme to conveys the meaning about the changes in a release. To summarize, given a version number MAJOR.MINOR.PATCH, increment the:
  - MAJOR version when you make incompatible API changes (ex: breaking change, addition of required field or deprecation of an existing field)
  - MINOR version when you add functionality in a backward compatible manner (ex: addition of optional fields or possible values)
  - PATCH version when you make backward compatible bug fixes
  - Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.
 
## API definition format

API definitions will utilize [OpenAPI 3.1.X](https://swagger.io/specification/) specifications

## Tagging & Releases

Git tags and GitHub releases mark specific points in the project’s history as official, shareable versions.  
They provide a clear, immutable reference for users and automation tools to download or deploy a stable build.

Follow **Semantic Versioning (MAJOR.MINOR.PATCH)** as outlined above, e.g. `v1.2.3`  
- **MAJOR**: breaking changes  
- **MINOR**: new features  
- **PATCH**: bug fixes  
- Optional pre-release suffixes: `-rc.1`, `-beta`

### Tagging
Use **annotated tags** on the main (stable) branch:
```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```
Tags are immutable—never overwrite an existing tag.

### Creating Releases on GitHub
Each GitHub Release should correspond to a tag. Releases provide a user-facing summary of what changed, include release notes, and may include built artifacts.

When drafting a release:
1. Choose or create the appropriate tag.
2. Select the correct target branch (usually `main` or the stable branch).
3. Provide a meaningful title.
4. Write release notes summarizing new features, breaking changes, bug fixes, and any migration steps or compatibility concerns. Properly attribute contributing PRs or issues.
5. Indicate if the release is a pre-release if it is not yet stable.

Include assets if relevant—binaries, installable packages, archives, etc. (GitHub automatically provides `.zip` and `.tar.gz` of the source at that tag.)

## Workflow / Policies & Governance

**Pull-request merges to `main` require two approvers.** All changes destined for the stable branch must be merged via a pull request and receive at least two approvals before merging.

**Restrict tagging and releasing to authorized maintainers.** Only individuals with appropriate permissions (e.g., maintainers) may approve and create releases or tags. This ensures quality control and prevents accidental or unauthorized releases.
## Implementation Considerations

### Versioning

- Individual firms decide the versions they will support.
- The [IRI registry](https://www.irionline.org/operations-and-technology/article/digital-first-for-annuities-dashboard/) lists which firms support which API versions. 
- Firms can support multiple versions if they choose.

### Extending the specification

- The focus of the standard specification is to specify the data structures and how they are used in API requests and responses to ensure consistency across implementations. 
- When implementing the specification, parties are free to add custom fields, headers, and data to existing definitions at their own risk.
- It is strongly recommended that implementers avoid modifying the data structures. 
- It is recommend that custom headers be used to facilitate exchange of request meta-data that allows the receiver to process the request correctly or for tracking purposes. - Example: a service provider may require that distributors include sourceFirmId and targetFirmId and correlationId header fields to facilitate transmission of the data to downstream carriers that would not necessarily be required in direct API integration between distributor and carrier.

### Authentication

- Individual firms decide the authentication mechanism they will support. Parties are free to decide how their integrations will authenticate with one another.

## Change subsmissions and reporting issues and bugs

Security issues and bugs should be reported directly to Katherine Dease kdease@irionline.org. Issues and bugs can be reported directly within the issues tab of a repository. Change requests should follow the standards governance workflow outlined on the [main page](https://github.com/Insured-Retirement-Institute).

## Code of conduct

See [code of conduct](https://github.com/Insured-Retirement-Institute/Style-Guide/blob/main/CODE_OF_CONDUCT.md)

## Data Dictionary

The Data Dictionary provides a business-friendly, per-endpoint view of all API fields across request parameters, request bodies, and response bodies. It is automatically generated from the OpenAPI specification and published to GitHub Pages.

### Accessing the Data Dictionary

- **Online**: Visit the [GitHub Pages site](https://insured-retirement-institute.github.io/Style-Guide/) to view the interactive data dictionary
- **Download**: An Excel file (`data-dictionary.xlsx`) is available for download from the Pages site

### Features

The data dictionary includes:

- **Field Instances**: Every field occurrence within each endpoint, including:
  - Path, query, and header parameters
  - Request body fields (flattened recursively)
  - Response body fields per HTTP status code
  - Field metadata: type, format, required, nullable, constraints, descriptions, examples

- **Endpoints Summary**: Overview of all API operations with their parameters and response codes

- **Schemas Summary**: Component schema definitions with property counts and required fields

### Prerequisites

- **Node.js**: Version 20.x or later
- **npm**: Included with Node.js

### Running Locally

To generate the data dictionary locally:

```bash
# Install dependencies
npm install

# Generate the data dictionary (outputs to public/)
npm run build:dictionary

# Generated files:
#   public/data-dictionary.json  - JSON data for the interactive table
#   public/data-dictionary.xlsx  - Excel spreadsheet download
#   public/index.html            - Interactive web UI
```

### Configuring the OpenAPI Source

By default, the generator processes `docs/appstatusv2.yaml`. To use a different OpenAPI file:

```bash
# Set the OPENAPI_PATH environment variable (Linux/macOS)
OPENAPI_PATH=docs/another-api.yaml npm run build:dictionary

# On Windows (Command Prompt):
set OPENAPI_PATH=docs\another-api.yaml && npm run build:dictionary

# On Windows (PowerShell):
$env:OPENAPI_PATH="docs\another-api.yaml"; npm run build:dictionary
```

### Output Columns (Field Instances)

| Column | Description |
|--------|-------------|
| `operationId` | Unique operation identifier from OpenAPI |
| `method` | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| `path` | API endpoint path |
| `tags` | Comma-separated operation tags |
| `summary` | Operation summary |
| `location` | Where the field appears: `path_param`, `query_param`, `header_param`, `request_body`, `response_body` |
| `httpStatus` | HTTP status code (for response_body only) |
| `mediaType` | Content type (e.g., `application/json`) |
| `schemaName` | Source schema name or `inline/anonymous` |
| `fieldPath` | Dot-notation path with `[]` for arrays (e.g., `items[].id`) |
| `fieldName` | Field name |
| `type` | JSON Schema type |
| `itemType` | Array item type (if array) |
| `format` | JSON Schema format (date, email, etc.) |
| `required` | Yes/No - whether field is required |
| `nullable` | Yes/No - whether field can be null |
| `deprecated` | Yes/No - whether field is deprecated |
| `readOnly` | Yes/No - whether field is read-only |
| `writeOnly` | Yes/No - whether field is write-only |
| `description` | Field description |
| `constraints` | Validation constraints (pattern, minLength, enum, etc.) |
| `example` | Example value |
| `default` | Default value |
| `sourceRef` | Source location in OpenAPI spec |
| `issues` | Any parsing issues or variant labels |

### GitHub Actions Workflow

The data dictionary is automatically rebuilt and deployed to GitHub Pages on every push to `main`. The workflow:

1. Checks out the repository
2. Installs Node.js 20.x dependencies
3. Runs `npm run build:dictionary`
4. Copies existing docs to public folder
5. Deploys the `public/` directory to GitHub Pages

To configure the OpenAPI path for CI, set the `OPENAPI_PATH` repository variable in GitHub Settings > Secrets and variables > Actions > Variables.

### Project Structure

```
Style-Guide/
├── .github/
│   └── workflows/
│       └── pages.yml          # GitHub Actions workflow
├── docs/
│   ├── appstatusv2.yaml       # OpenAPI specification (default)
│   └── ...                    # Other API specs
├── public/                    # Generated output (gitignored)
│   ├── data-dictionary.json
│   ├── data-dictionary.xlsx
│   └── index.html
├── scripts/
│   └── generate-dictionary.ts # Generator script
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md
```

### Troubleshooting

**Error: Cannot find module '@apidevtools/swagger-parser'**
- Run `npm install` to install dependencies

**Error: ENOENT: no such file or directory**
- Verify the OpenAPI file path exists
- Check the `OPENAPI_PATH` environment variable

**Empty or missing fields in output**
- The generator handles missing schemas gracefully
- Check the `issues` column for any parsing warnings

**GitHub Pages not updating**
- Verify the workflow completed successfully in Actions tab
- Check that Pages is configured to deploy from GitHub Actions (not from branch)
