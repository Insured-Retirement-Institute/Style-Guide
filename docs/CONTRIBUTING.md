# Managing API Documentation with GitHub Pages and Swagger UI

This document explains how to manage multiple API documentation pages using GitHub Pages and Swagger UI.

## Table of Contents
- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [How the Index.html Works](#how-the-indexhtml-works)
- [Adding New API Documentation](#adding-new-api-documentation)
- [Adding Versioned API Documentation](#adding-versioned-api-documentation)
- [Publishing to GitHub Pages](#publishing-to-github-pages)
- [Customizing the UI](#customizing-the-ui)

## Overview

This project uses GitHub Pages to host API documentation generated with Swagger UI. The setup allows for:
- Multiple API specifications to be hosted on a single site
- API versioning support
- Simple navigation between different APIs
- Consistent styling across all documentation

## Directory Structure

Recommended structure for your documentation:

```
docs/
├── index.html           # Main HTML file that loads Swagger UI
├── css/
│   └── custom.css       # Custom styling (optional)
├── openapi.yaml         # Main API specification
├── v2/
│   └── openapi.yaml     # Version 2 of the main API
├── another-api/
│   ├── openapi.yaml     # Another API specification
│   └── v2/
│       └── openapi.yaml # Version 2 of another API
└── favicon.png          # Site favicon
```

## How the Index.html Works

The `index.html` file is the entry point to your API documentation. It contains:

1. **API Selector:** A dropdown menu that allows users to switch between different API specifications
2. **Version Selector:** A dropdown menu that shows available versions for the selected API
3. **Swagger UI Container:** Where the actual API documentation is rendered

The JavaScript in the file:
- Defines available APIs and their versions
- Populates the version selector based on the selected API
- Loads the selected API specification into Swagger UI

## Adding New API Documentation

To add a new API specification:

1. Add your OpenAPI YAML/JSON file to the `docs` directory (or a subdirectory)
2. Update the `apiDefinitions` object in `index.html` to include your new API:

```javascript
const apiDefinitions = {
  "openapi.yaml": {
    name: "Producer Readiness API",
    versions: {
      "v1": { path: "openapi.yaml", displayName: "v1.0.0" }
    }
  },
  "another-api/openapi.yaml": {
    name: "Another API",
    versions: {
      "v1": { path: "another-api/openapi.yaml", displayName: "v1.0.0" }
    }
  }
};
```

3. Add an option to the API selector in the HTML:

```html
<select id="api-selector" onchange="loadSelectedAPI()">
  <option value="openapi.yaml">Producer Readiness API</option>
  <option value="another-api/openapi.yaml">Another API</option>
</select>
```

## Adding Versioned API Documentation

To add a new version of an existing API:

1. Create a subdirectory for the version (e.g., `v2/`) and add your OpenAPI file there
2. Update the `apiDefinitions` object to include the new version:

```javascript
const apiDefinitions = {
  "openapi.yaml": {
    name: "Producer Readiness API",
    versions: {
      "v1": { path: "openapi.yaml", displayName: "v1.0.0" },
      "v2": { path: "v2/openapi.yaml", displayName: "v2.0.0" }
    }
  }
};
```

The version selector will automatically appear when multiple versions are available for an API.

## Publishing to GitHub Pages

To publish your API documentation to GitHub Pages:

1. Push your changes to the repository branch that's configured for GitHub Pages (currently `main`).  Note: Only the content in the `docs` directory is published.

2. View published docs at [specs.dfa.irionline.org](https://specs.dfa.irionline.org)

## Customizing the UI

You can customize the appearance of the documentation by:

1. Adding custom CSS in `docs/css/custom.css`
2. Modifying the Swagger UI configuration in `index.html`:

```javascript
window.ui = SwaggerUIBundle({
  url: apiPath,
  dom_id: '#swagger-ui',
  deepLinking: true,
  presets: [
    SwaggerUIBundle.presets.apis,
    SwaggerUIStandalonePreset
  ],
  plugins: [
    SwaggerUIBundle.plugins.DownloadUrl
  ],
  layout: "StandaloneLayout",
  // Add customizations here:
  docExpansion: 'list', // Controls the default expansion setting
  defaultModelsExpandDepth: -1, // Hide the models by default
  displayRequestDuration: true, // Display the request duration
  filter: true // Enable filtering operations
});
```

For more customization options, refer to the [Swagger UI documentation](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).