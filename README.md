# Style Guide

The style guide provides rules, regulations, and recommendations for Digital-First standards. We are currently in the process of standing up a [GitHub Pages](https://insured-retirement-institute.github.io/Style-Guide/) to host OpenAPI definitions...THIS IS CURRENTLY A WORK IN PROGRESS AND IS NOT AN OFFICIAL PUBLICATION...check back often for updates.

## Style Conventions

Field naming
- **Booleans**: Should be prefixed with is or has.
- **Lists/Arrays**: Use plural nouns to represent the array itself and singular nouns to represent the elements within the array.

## Data definitions

- **_Producers_** is the preferred nomenclature when referring to licensed/appointed professionals selling products.

Coming soon

## Versioning

Individual firms decide the versions they will support.
The [IRI registry](#) encompasses which firms support which APIs and what versions those consiste of. Firms can support multiple versions if they choose, and parties are free to add custom fields, headers, and data to existing definitions at their own risk.

- APIs will utilize versioning at the URL level. In this method, the API endpoint URL includes the major version number. For example, users wanting to retrieve all products from a database would send a request to https://example-api.com/v1/products. The specific version of an API can be specified as an optional header as outlined above.
- Release changes will institute [Semantic Versioning (SemVer)](https://semver.org/) for the versioning scheme to conveys the meaning about the changes in a release. To summarize, given a version number MAJOR.MINOR.PATCH, increment the:
  - MAJOR version when you make incompatible API changes (ex: breaking change, addition of required field or deprecation of an existing field)
  - MINOR version when you add functionality in a backward compatible manner (ex: addition of optional fields or possible values)
  - PATCH version when you make backward compatible bug fixes
  - Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## API definition format

API definitions will utilize [OpenAPI 3.1.X](https://swagger.io/specification/) specifications

## Authentication

Individual firms decide the authentication mechanism they will support. Parties are free to decide how their integrations will authenticate with one another.

## Change subsmissions and reporting issues and bugs

Security issues and bugs should be reported directly to Katherine Dease kdease@irionline.org. Issues and bugs can be reported directly within the issues tab of a repository. Change requests should follow the standards governance workflow outlined on the [main page](https://github.com/Insured-Retirement-Institute).

## Code of conduct

See [code of conduct](https://github.com/Insured-Retirement-Institute/Style-Guide/blob/main/CODE_OF_CONDUCT.md)

## Technical committee meeting notes

[See notes](https://github.com/Insured-Retirement-Institute/Style-Guide/tree/main/Technical%20Committee%20Meeting%20Notes)
