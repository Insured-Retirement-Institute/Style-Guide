# Style Guide

The style guide provides rules, regulations, and recommendations for Digital-First standards. OpenAPI definitions can be found on the [GitHub Page](https://insured-retirement-institute.github.io/Style-Guide/) of this repository.

## Style Conventions

Field naming
- **Booleans**: Should be prefixed with is or has.
- **Lists/Arrays**: Use plural nouns to represent the array itself and singular nouns to represent the elements within the array.

Custom headers
- **_correlationId_**: Optional custom header to be returned to the caller in response payload
- **_senderParticipantId_**: Optional custom header identifying the sender of the call
- **_receiverParticipantId_**: Optional custom header identifying the receiver of the call

Query String Parameters
- Sending **_Personally Identifiable Information (PII)_** as query string parameters such as names, addresses, email addresses, or account numbers, directly in URL query strings is a common practice to be avoided due to the significant privacy and security risks involved. 
- **_associatedFirmId_**: Optional query parameter for the associated firm ID

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

## Versioning

Individual firms decide the versions they will support.
The [IRI registry](https://www.irionline.org/operations-and-technology/article/digital-first-for-annuities-dashboard/) encompasses which firms support which APIs and what versions those consiste of. Firms can support multiple versions if they choose, and parties are free to add custom fields, headers, and data to existing definitions at their own risk.

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

## Authentication

Individual firms decide the authentication mechanism they will support. Parties are free to decide how their integrations will authenticate with one another.

## Change subsmissions and reporting issues and bugs

Security issues and bugs should be reported directly to Katherine Dease kdease@irionline.org. Issues and bugs can be reported directly within the issues tab of a repository. Change requests should follow the standards governance workflow outlined on the [main page](https://github.com/Insured-Retirement-Institute).

## Code of conduct

See [code of conduct](https://github.com/Insured-Retirement-Institute/Style-Guide/blob/main/CODE_OF_CONDUCT.md)
