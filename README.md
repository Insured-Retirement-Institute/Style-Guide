# Style Guide

The style guide provides rules, regulations, and recommendations for Digital-First standards.

## Versioning

Individual firms decide the versions they will support.
The [IRI registry](#) encompasses which firms support which APIs and what versions those consiste of. Firms can support multiple versions if they choose, and parties are free to add custom fields and data to existing definitions at their own risk.

- Type: The [type of versioning](https://www.postman.com/api-platform/api-versioning/) is currently under review with the technical committee:
  - URL
  - Query parameter
  - Header
  - Consumer-based
- Release changes: [Semantic Versioning (SemVer)](https://semver.org/) is instituted for the versioning scheme to conveys the meaning about the changes in a release. To summarize, given a version number MAJOR.MINOR.PATCH, increment the:
  - MAJOR version when you make incompatible API changes (ex: breaking change, addition of required field or deprecation of an existing field)
  - MINOR version when you add functionality in a backward compatible manner (ex: addition of optional fields or possible values)
  - PATCH version when you make backward compatible bug fixes
  - Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## API definition format

API definitions will utilize [OpenAPI 3.1.X](https://swagger.io/specification/) specifications

## Authentication

Individual firms decide the authentication mechanism they will support. Parties are free to decide how their integrations will authenticate with one another.

## Change subsmissions and reporting issues and bugs

Security issues and bugs should be reported directly to Katherine Dease kdease@irionline.org. Issues and bugs can be reported directly within the issues tab of a repository.

## Code of conduct

See [code of conduct](https://github.com/Insured-Retirement-Institute/Style-Guide/blob/main/CODE_OF_CONDUCT.md)

## Technical committee meeting notes

[See notes](https://github.com/Insured-Retirement-Institute/Style-Guide/tree/main/Technical%20Committee%20Meeting%20Notes)
