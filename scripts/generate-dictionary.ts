/**
 * Data Dictionary Generator
 *
 * Parses an OpenAPI 3.x specification and generates a per-endpoint
 * field instance data dictionary with JSON and Excel outputs.
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface FieldInstance {
  operationId: string;
  method: string;
  path: string;
  tags: string;
  summary: string;
  location: string;
  httpStatus: string;
  mediaType: string;
  schemaName: string;
  fieldPath: string;
  fieldName: string;
  type: string;
  itemType: string;
  format: string;
  required: string;
  nullable: string;
  deprecated: string;
  readOnly: string;
  writeOnly: string;
  description: string;
  constraints: string;
  example: string;
  default: string;
  sourceRef: string;
  issues: string;
}

interface EndpointSummary {
  method: string;
  path: string;
  operationId: string;
  tags: string;
  summary: string;
  description: string;
  requestMediaTypes: string;
  responseCodesAndMediaTypes: string;
  parameterCount: number;
}

interface SchemaSummary {
  name: string;
  type: string;
  description: string;
  propertyCount: number;
  required: string;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    parameters?: Record<string, Parameter>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  parameters?: Parameter[];
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
  deprecated?: boolean;
}

interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Schema;
}

interface RequestBody {
  required?: boolean;
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

interface Response {
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

interface MediaTypeObject {
  schema?: Schema;
}

interface Schema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: (string | number)[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  nullable?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: unknown;
  default?: unknown;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  const?: unknown;
  $ref?: string;
  title?: string;
  additionalProperties?: boolean | Schema;
}

// Context for flattening schemas
interface FlattenContext {
  operationId: string;
  method: string;
  path: string;
  tags: string;
  summary: string;
  location: string;
  httpStatus: string;
  mediaType: string;
  sourceRef: string;
  requiredFields: Set<string>;
}

// Schema tracker for naming
const schemaNameCache = new WeakMap<Schema, string>();

function getSchemaName(schema: Schema, refPath?: string): string {
  if (schemaNameCache.has(schema)) {
    return schemaNameCache.get(schema)!;
  }

  if (refPath) {
    const parts = refPath.split('/');
    const name = parts[parts.length - 1];
    schemaNameCache.set(schema, name);
    return name;
  }

  if (schema.title) {
    schemaNameCache.set(schema, schema.title);
    return schema.title;
  }

  schemaNameCache.set(schema, 'inline/anonymous');
  return 'inline/anonymous';
}

function buildConstraints(schema: Schema): string {
  const constraints: string[] = [];

  if (schema.pattern) constraints.push(`pattern=${schema.pattern}`);
  if (schema.minLength !== undefined) constraints.push(`minLength=${schema.minLength}`);
  if (schema.maxLength !== undefined) constraints.push(`maxLength=${schema.maxLength}`);
  if (schema.minimum !== undefined) constraints.push(`minimum=${schema.minimum}`);
  if (schema.maximum !== undefined) constraints.push(`maximum=${schema.maximum}`);
  if (schema.minItems !== undefined) constraints.push(`minItems=${schema.minItems}`);
  if (schema.maxItems !== undefined) constraints.push(`maxItems=${schema.maxItems}`);
  if (schema.enum) constraints.push(`enum=[${schema.enum.join(', ')}]`);
  if (schema.const !== undefined) constraints.push(`const=${schema.const}`);

  return constraints.join('; ');
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function yesNo(value: boolean | undefined): string {
  return value ? 'Yes' : 'No';
}

function mergeAllOfSchemas(schemas: Schema[]): { merged: Schema; issues: string[] } {
  const issues: string[] = [];
  const merged: Schema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const schema of schemas) {
    if (schema.type && schema.type !== 'object') {
      issues.push(`allOf contains non-object type: ${schema.type}`);
    }

    if (schema.properties) {
      merged.properties = { ...merged.properties, ...schema.properties };
    }

    if (schema.required) {
      merged.required = [...(merged.required || []), ...schema.required];
    }

    // Copy other relevant properties
    if (schema.description && !merged.description) {
      merged.description = schema.description;
    }
  }

  // Dedupe required
  merged.required = [...new Set(merged.required)];

  return { merged, issues };
}

function flattenSchema(
  schema: Schema,
  fieldPath: string,
  ctx: FlattenContext,
  parentSchemaName: string,
  variantLabel: string = '',
  visited: Set<Schema> = new Set()
): FieldInstance[] {
  const results: FieldInstance[] = [];
  const issues: string[] = [];

  // Prevent infinite recursion
  if (visited.has(schema)) {
    return results;
  }
  visited.add(schema);

  // Handle allOf
  if (schema.allOf && schema.allOf.length > 0) {
    const { merged, issues: mergeIssues } = mergeAllOfSchemas(schema.allOf);
    issues.push(...mergeIssues);

    const schemaName = getSchemaName(schema) || parentSchemaName;
    return flattenSchema(merged, fieldPath, ctx, schemaName, variantLabel, visited);
  }

  // Handle oneOf/anyOf - create variant rows
  if (schema.oneOf && schema.oneOf.length > 0) {
    schema.oneOf.forEach((variant, index) => {
      const variantName = getSchemaName(variant) || `variant${index + 1}`;
      const newVariantLabel = variantLabel ? `${variantLabel}|${variantName}` : variantName;
      results.push(...flattenSchema(variant, fieldPath, ctx, parentSchemaName, newVariantLabel, new Set(visited)));
    });
    return results;
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    schema.anyOf.forEach((variant, index) => {
      const variantName = getSchemaName(variant) || `variant${index + 1}`;
      const newVariantLabel = variantLabel ? `${variantLabel}|${variantName}` : variantName;
      results.push(...flattenSchema(variant, fieldPath, ctx, parentSchemaName, newVariantLabel, new Set(visited)));
    });
    return results;
  }

  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    const itemSchema = schema.items;
    const arrayPath = fieldPath ? `${fieldPath}[]` : '[]';

    // If items is an object, flatten its properties
    if (itemSchema.type === 'object' || itemSchema.properties || itemSchema.allOf || itemSchema.oneOf || itemSchema.anyOf) {
      const itemSchemaName = getSchemaName(itemSchema) || parentSchemaName;
      return flattenSchema(itemSchema, arrayPath, ctx, itemSchemaName, variantLabel, visited);
    }

    // Primitive array items
    const fieldName = fieldPath.split('.').pop() || fieldPath || 'items';
    results.push({
      operationId: ctx.operationId,
      method: ctx.method,
      path: ctx.path,
      tags: ctx.tags,
      summary: ctx.summary,
      location: ctx.location,
      httpStatus: ctx.httpStatus,
      mediaType: ctx.mediaType,
      schemaName: parentSchemaName,
      fieldPath: arrayPath,
      fieldName: `${fieldName}[]`,
      type: 'array',
      itemType: itemSchema.type || '',
      format: itemSchema.format || '',
      required: yesNo(ctx.requiredFields.has(fieldName)),
      nullable: yesNo(schema.nullable),
      deprecated: yesNo(schema.deprecated),
      readOnly: yesNo(schema.readOnly),
      writeOnly: yesNo(schema.writeOnly),
      description: schema.description || itemSchema.description || '',
      constraints: buildConstraints(schema) || buildConstraints(itemSchema),
      example: formatValue(schema.example),
      default: formatValue(schema.default),
      sourceRef: ctx.sourceRef,
      issues: issues.join('; ')
    });

    return results;
  }

  // Handle object properties
  if (schema.type === 'object' || schema.properties) {
    const properties = schema.properties || {};
    const requiredFields = new Set(schema.required || []);

    for (const [propName, propSchema] of Object.entries(properties)) {
      const propPath = fieldPath ? `${fieldPath}.${propName}` : propName;
      const propSchemaName = getSchemaName(propSchema) || parentSchemaName;

      // Check if this property is a complex type that needs flattening
      if (propSchema.type === 'object' || propSchema.properties || propSchema.allOf || propSchema.oneOf || propSchema.anyOf) {
        // Create a context with updated required fields
        const newCtx = { ...ctx, requiredFields: new Set(propSchema.required || []) };

        // Add a row for the object field itself
        results.push({
          operationId: ctx.operationId,
          method: ctx.method,
          path: ctx.path,
          tags: ctx.tags,
          summary: ctx.summary,
          location: ctx.location,
          httpStatus: ctx.httpStatus,
          mediaType: ctx.mediaType,
          schemaName: propSchemaName,
          fieldPath: propPath,
          fieldName: propName,
          type: propSchema.type || 'object',
          itemType: '',
          format: propSchema.format || '',
          required: yesNo(requiredFields.has(propName)),
          nullable: yesNo(propSchema.nullable),
          deprecated: yesNo(propSchema.deprecated),
          readOnly: yesNo(propSchema.readOnly),
          writeOnly: yesNo(propSchema.writeOnly),
          description: propSchema.description || '',
          constraints: buildConstraints(propSchema),
          example: formatValue(propSchema.example),
          default: formatValue(propSchema.default),
          sourceRef: ctx.sourceRef,
          issues: variantLabel ? `variant: ${variantLabel}` : ''
        });

        // Flatten nested properties
        results.push(...flattenSchema(propSchema, propPath, newCtx, propSchemaName, variantLabel, new Set(visited)));
      } else if (propSchema.type === 'array' && propSchema.items) {
        // Handle array property
        const arrayPath = `${propPath}[]`;
        const itemSchema = propSchema.items;

        // Add row for the array field
        results.push({
          operationId: ctx.operationId,
          method: ctx.method,
          path: ctx.path,
          tags: ctx.tags,
          summary: ctx.summary,
          location: ctx.location,
          httpStatus: ctx.httpStatus,
          mediaType: ctx.mediaType,
          schemaName: propSchemaName,
          fieldPath: propPath,
          fieldName: propName,
          type: 'array',
          itemType: itemSchema.type || (itemSchema.properties ? 'object' : ''),
          format: propSchema.format || '',
          required: yesNo(requiredFields.has(propName)),
          nullable: yesNo(propSchema.nullable),
          deprecated: yesNo(propSchema.deprecated),
          readOnly: yesNo(propSchema.readOnly),
          writeOnly: yesNo(propSchema.writeOnly),
          description: propSchema.description || '',
          constraints: buildConstraints(propSchema),
          example: formatValue(propSchema.example),
          default: formatValue(propSchema.default),
          sourceRef: ctx.sourceRef,
          issues: variantLabel ? `variant: ${variantLabel}` : ''
        });

        // Flatten array items if they're objects
        if (itemSchema.type === 'object' || itemSchema.properties || itemSchema.allOf || itemSchema.oneOf || itemSchema.anyOf) {
          const itemSchemaName = getSchemaName(itemSchema) || propSchemaName;
          const newCtx = { ...ctx, requiredFields: new Set(itemSchema.required || []) };
          results.push(...flattenSchema(itemSchema, arrayPath, newCtx, itemSchemaName, variantLabel, new Set(visited)));
        }
      } else {
        // Primitive property
        results.push({
          operationId: ctx.operationId,
          method: ctx.method,
          path: ctx.path,
          tags: ctx.tags,
          summary: ctx.summary,
          location: ctx.location,
          httpStatus: ctx.httpStatus,
          mediaType: ctx.mediaType,
          schemaName: propSchemaName,
          fieldPath: propPath,
          fieldName: propName,
          type: propSchema.type || '',
          itemType: '',
          format: propSchema.format || '',
          required: yesNo(requiredFields.has(propName)),
          nullable: yesNo(propSchema.nullable),
          deprecated: yesNo(propSchema.deprecated),
          readOnly: yesNo(propSchema.readOnly),
          writeOnly: yesNo(propSchema.writeOnly),
          description: propSchema.description || '',
          constraints: buildConstraints(propSchema),
          example: formatValue(propSchema.example),
          default: formatValue(propSchema.default),
          sourceRef: ctx.sourceRef,
          issues: variantLabel ? `variant: ${variantLabel}` : ''
        });
      }
    }

    return results;
  }

  // Handle primitive schema at root level (unusual but possible)
  if (schema.type && !schema.properties && !schema.items) {
    const fieldName = fieldPath.split('.').pop() || fieldPath || 'value';
    results.push({
      operationId: ctx.operationId,
      method: ctx.method,
      path: ctx.path,
      tags: ctx.tags,
      summary: ctx.summary,
      location: ctx.location,
      httpStatus: ctx.httpStatus,
      mediaType: ctx.mediaType,
      schemaName: parentSchemaName,
      fieldPath: fieldPath,
      fieldName: fieldName,
      type: schema.type,
      itemType: '',
      format: schema.format || '',
      required: yesNo(ctx.requiredFields.has(fieldName)),
      nullable: yesNo(schema.nullable),
      deprecated: yesNo(schema.deprecated),
      readOnly: yesNo(schema.readOnly),
      writeOnly: yesNo(schema.writeOnly),
      description: schema.description || '',
      constraints: buildConstraints(schema),
      example: formatValue(schema.example),
      default: formatValue(schema.default),
      sourceRef: ctx.sourceRef,
      issues: issues.join('; ')
    });
  }

  return results;
}

function processParameter(
  param: Parameter,
  ctx: Omit<FlattenContext, 'location' | 'httpStatus' | 'mediaType' | 'sourceRef' | 'requiredFields'>
): FieldInstance[] {
  const results: FieldInstance[] = [];
  const locationMap: Record<string, string> = {
    query: 'query_param',
    header: 'header_param',
    path: 'path_param',
    cookie: 'cookie_param'
  };

  const location = locationMap[param.in] || param.in;
  const schema = param.schema || {};
  const schemaName = getSchemaName(schema);

  results.push({
    operationId: ctx.operationId,
    method: ctx.method,
    path: ctx.path,
    tags: ctx.tags,
    summary: ctx.summary,
    location: location,
    httpStatus: '',
    mediaType: '',
    schemaName: schemaName,
    fieldPath: param.name,
    fieldName: param.name,
    type: schema.type || '',
    itemType: schema.items?.type || '',
    format: schema.format || '',
    required: yesNo(param.required),
    nullable: yesNo(schema.nullable),
    deprecated: yesNo(param.deprecated),
    readOnly: yesNo(schema.readOnly),
    writeOnly: yesNo(schema.writeOnly),
    description: param.description || schema.description || '',
    constraints: buildConstraints(schema),
    example: formatValue(schema.example),
    default: formatValue(schema.default),
    sourceRef: `parameters.${param.name}`,
    issues: ''
  });

  return results;
}

function sanitizeOperationId(method: string, path: string): string {
  return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`.replace(/_+/g, '_');
}

async function generateDataDictionary(): Promise<void> {
  // Determine OpenAPI file path
  const defaultPath = path.join(__dirname, '..', 'docs', 'appstatusv2.yaml');
  const openApiPath = process.env.OPENAPI_PATH || defaultPath;

  console.log(`Loading OpenAPI spec from: ${openApiPath}`);

  // Parse and dereference the OpenAPI spec
  const api = await SwaggerParser.dereference(openApiPath) as OpenAPISpec;

  console.log(`Parsed: ${api.info.title} v${api.info.version}`);

  const fieldInstances: FieldInstance[] = [];
  const endpoints: EndpointSummary[] = [];
  const schemas: SchemaSummary[] = [];

  // Process paths
  for (const [pathUrl, pathItem] of Object.entries(api.paths)) {
    const pathParams = pathItem.parameters || [];

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationId = operation.operationId || sanitizeOperationId(method, pathUrl);
      const tags = (operation.tags || []).join(', ');
      const summary = operation.summary || '';
      const description = operation.description || '';

      // Collect request media types
      const requestMediaTypes: string[] = [];
      if (operation.requestBody?.content) {
        requestMediaTypes.push(...Object.keys(operation.requestBody.content));
      }

      // Collect response codes and media types
      const responseCodesAndMediaTypes: string[] = [];
      if (operation.responses) {
        for (const [code, response] of Object.entries(operation.responses)) {
          const mediaTypes = response.content ? Object.keys(response.content) : [];
          if (mediaTypes.length > 0) {
            responseCodesAndMediaTypes.push(`${code}: ${mediaTypes.join(', ')}`);
          } else {
            responseCodesAndMediaTypes.push(code);
          }
        }
      }

      // Count parameters
      const allParams = [...pathParams, ...(operation.parameters || [])];

      // Add endpoint summary
      endpoints.push({
        method: method.toUpperCase(),
        path: pathUrl,
        operationId,
        tags,
        summary,
        description,
        requestMediaTypes: requestMediaTypes.join(', '),
        responseCodesAndMediaTypes: responseCodesAndMediaTypes.join('; '),
        parameterCount: allParams.length
      });

      const baseCtx = {
        operationId,
        method: method.toUpperCase(),
        path: pathUrl,
        tags,
        summary
      };

      // Process parameters (path-level + operation-level)
      for (const param of allParams) {
        fieldInstances.push(...processParameter(param, baseCtx));
      }

      // Process request body
      if (operation.requestBody?.content) {
        for (const [mediaType, mediaTypeObj] of Object.entries(operation.requestBody.content)) {
          if (mediaTypeObj.schema) {
            const schemaName = getSchemaName(mediaTypeObj.schema);
            const ctx: FlattenContext = {
              ...baseCtx,
              location: 'request_body',
              httpStatus: '',
              mediaType,
              sourceRef: `requestBody.content.${mediaType}.schema`,
              requiredFields: new Set(mediaTypeObj.schema.required || [])
            };

            fieldInstances.push(...flattenSchema(mediaTypeObj.schema, '', ctx, schemaName));
          }
        }
      }

      // Process responses
      if (operation.responses) {
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          if (response.content) {
            for (const [mediaType, mediaTypeObj] of Object.entries(response.content)) {
              if (mediaTypeObj.schema) {
                const schemaName = getSchemaName(mediaTypeObj.schema);
                const ctx: FlattenContext = {
                  ...baseCtx,
                  location: 'response_body',
                  httpStatus: statusCode,
                  mediaType,
                  sourceRef: `responses.${statusCode}.content.${mediaType}.schema`,
                  requiredFields: new Set(mediaTypeObj.schema.required || [])
                };

                fieldInstances.push(...flattenSchema(mediaTypeObj.schema, '', ctx, schemaName));
              }
            }
          }
        }
      }
    }
  }

  // Process component schemas for summary
  if (api.components?.schemas) {
    for (const [name, schema] of Object.entries(api.components.schemas)) {
      const propCount = schema.properties ? Object.keys(schema.properties).length : 0;
      schemas.push({
        name,
        type: schema.type || (schema.allOf ? 'allOf' : schema.oneOf ? 'oneOf' : schema.anyOf ? 'anyOf' : 'unknown'),
        description: schema.description || '',
        propertyCount: propCount,
        required: (schema.required || []).join(', ')
      });
    }
  }

  // Sort field instances deterministically
  fieldInstances.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    if (pathCmp !== 0) return pathCmp;

    const methodCmp = a.method.localeCompare(b.method);
    if (methodCmp !== 0) return methodCmp;

    const locationOrder = ['path_param', 'query_param', 'header_param', 'cookie_param', 'request_body', 'response_body'];
    const locCmp = locationOrder.indexOf(a.location) - locationOrder.indexOf(b.location);
    if (locCmp !== 0) return locCmp;

    const statusCmp = a.httpStatus.localeCompare(b.httpStatus);
    if (statusCmp !== 0) return statusCmp;

    return a.fieldPath.localeCompare(b.fieldPath);
  });

  // Sort endpoints
  endpoints.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    if (pathCmp !== 0) return pathCmp;
    return a.method.localeCompare(b.method);
  });

  // Sort schemas
  schemas.sort((a, b) => a.name.localeCompare(b.name));

  // Prepare output directory
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate JSON output
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    source: openApiPath,
    apiInfo: {
      title: api.info.title,
      version: api.info.version,
      description: api.info.description
    },
    fieldInstances,
    endpoints,
    schemas
  };

  const jsonPath = path.join(publicDir, 'data-dictionary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`Generated: ${jsonPath} (${fieldInstances.length} field instances)`);

  // Generate Excel output
  const workbook = XLSX.utils.book_new();

  // Field Instances sheet
  const fieldInstancesSheet = XLSX.utils.json_to_sheet(fieldInstances);
  XLSX.utils.book_append_sheet(workbook, fieldInstancesSheet, 'Field Instances');

  // Endpoints sheet
  const endpointsSheet = XLSX.utils.json_to_sheet(endpoints);
  XLSX.utils.book_append_sheet(workbook, endpointsSheet, 'Endpoints');

  // Schemas sheet
  const schemasSheet = XLSX.utils.json_to_sheet(schemas);
  XLSX.utils.book_append_sheet(workbook, schemasSheet, 'Schemas');

  const xlsxPath = path.join(publicDir, 'data-dictionary.xlsx');
  XLSX.writeFile(workbook, xlsxPath);
  console.log(`Generated: ${xlsxPath}`);

  // Copy index.html to public if it exists in templates
  const templateHtmlPath = path.join(__dirname, 'templates', 'index.html');
  const publicHtmlPath = path.join(publicDir, 'index.html');

  if (fs.existsSync(templateHtmlPath)) {
    fs.copyFileSync(templateHtmlPath, publicHtmlPath);
    console.log(`Copied: ${publicHtmlPath}`);
  } else {
    // Generate HTML inline
    generateHtml(publicHtmlPath, api.info.title, api.info.version);
    console.log(`Generated: ${publicHtmlPath}`);
  }

  console.log('\nData dictionary generation complete!');
}

function generateHtml(outputPath: string, title: string, version: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Dictionary - ${title}</title>
  <link href="https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    header {
      background: #1a365d;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 0;
    }
    header h1 {
      margin: 0 0 10px 0;
      font-size: 1.5rem;
    }
    .meta {
      display: flex;
      gap: 20px;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    .controls {
      background: white;
      padding: 15px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;
    }
    .controls input, .controls select {
      padding: 8px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .controls input[type="text"] {
      min-width: 250px;
    }
    .controls select {
      min-width: 150px;
    }
    .download-btn {
      background: #2d7d46;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-block;
    }
    .download-btn:hover {
      background: #236b38;
    }
    .table-container {
      background: white;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }
    #data-table {
      font-size: 0.85rem;
    }
    .tabulator .tabulator-header {
      background: #f7fafc;
    }
    .tabulator .tabulator-header .tabulator-col {
      background: #f7fafc;
    }
    .tab-navigation {
      display: flex;
      gap: 5px;
      margin-bottom: 0;
      background: white;
      padding: 10px 20px 0;
    }
    .tab-btn {
      padding: 10px 20px;
      border: none;
      background: #e2e8f0;
      cursor: pointer;
      border-radius: 4px 4px 0 0;
      font-size: 0.9rem;
    }
    .tab-btn.active {
      background: #1a365d;
      color: white;
    }
    .stats {
      padding: 10px 20px;
      background: #f7fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #4a5568;
    }
    .loading {
      text-align: center;
      padding: 50px;
      color: #718096;
    }
    .error {
      background: #fed7d7;
      color: #c53030;
      padding: 20px;
      border-radius: 4px;
      margin: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>API Data Dictionary</h1>
      <div class="meta">
        <span id="api-info">Loading...</span>
        <span id="generated-at"></span>
      </div>
    </header>

    <div class="tab-navigation">
      <button class="tab-btn active" data-tab="fields">Field Instances</button>
      <button class="tab-btn" data-tab="endpoints">Endpoints</button>
      <button class="tab-btn" data-tab="schemas">Schemas</button>
    </div>

    <div class="controls">
      <input type="text" id="search" placeholder="Search all columns...">
      <select id="filter-method">
        <option value="">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
      <select id="filter-location">
        <option value="">All Locations</option>
        <option value="path_param">Path Parameter</option>
        <option value="query_param">Query Parameter</option>
        <option value="header_param">Header Parameter</option>
        <option value="request_body">Request Body</option>
        <option value="response_body">Response Body</option>
      </select>
      <select id="filter-status">
        <option value="">All Status Codes</option>
      </select>
      <a href="./data-dictionary.xlsx" class="download-btn" download>Download Excel</a>
    </div>

    <div class="stats" id="stats">Loading data...</div>

    <div class="table-container">
      <div id="data-table"></div>
    </div>
  </div>

  <script src="https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js"></script>
  <script>
    let data = null;
    let table = null;
    let currentTab = 'fields';

    const fieldColumns = [
      {title: "Operation ID", field: "operationId", headerFilter: true, width: 180},
      {title: "Method", field: "method", headerFilter: true, width: 80},
      {title: "Path", field: "path", headerFilter: true, width: 250},
      {title: "Location", field: "location", headerFilter: true, width: 120},
      {title: "HTTP Status", field: "httpStatus", headerFilter: true, width: 100},
      {title: "Field Path", field: "fieldPath", headerFilter: true, width: 200},
      {title: "Field Name", field: "fieldName", headerFilter: true, width: 150},
      {title: "Type", field: "type", headerFilter: true, width: 80},
      {title: "Item Type", field: "itemType", width: 80},
      {title: "Format", field: "format", width: 100},
      {title: "Required", field: "required", headerFilter: true, width: 80},
      {title: "Nullable", field: "nullable", width: 80},
      {title: "Description", field: "description", width: 300},
      {title: "Constraints", field: "constraints", width: 200},
      {title: "Example", field: "example", width: 150},
      {title: "Default", field: "default", width: 100},
      {title: "Schema Name", field: "schemaName", width: 150},
      {title: "Deprecated", field: "deprecated", width: 90},
      {title: "Read Only", field: "readOnly", width: 90},
      {title: "Write Only", field: "writeOnly", width: 90},
      {title: "Tags", field: "tags", width: 150},
      {title: "Source Ref", field: "sourceRef", width: 200},
      {title: "Issues", field: "issues", width: 150}
    ];

    const endpointColumns = [
      {title: "Method", field: "method", headerFilter: true, width: 80},
      {title: "Path", field: "path", headerFilter: true, width: 300},
      {title: "Operation ID", field: "operationId", headerFilter: true, width: 200},
      {title: "Tags", field: "tags", headerFilter: true, width: 150},
      {title: "Summary", field: "summary", width: 300},
      {title: "Description", field: "description", width: 400},
      {title: "Request Media Types", field: "requestMediaTypes", width: 200},
      {title: "Response Codes", field: "responseCodesAndMediaTypes", width: 250},
      {title: "Param Count", field: "parameterCount", width: 100}
    ];

    const schemaColumns = [
      {title: "Name", field: "name", headerFilter: true, width: 200},
      {title: "Type", field: "type", headerFilter: true, width: 100},
      {title: "Description", field: "description", width: 400},
      {title: "Property Count", field: "propertyCount", width: 120},
      {title: "Required Fields", field: "required", width: 300}
    ];

    async function loadData() {
      try {
        const response = await fetch('./data-dictionary.json');
        if (!response.ok) throw new Error('Failed to load data dictionary');
        data = await response.json();

        // Update header
        document.getElementById('api-info').textContent =
          \`\${data.apiInfo.title} v\${data.apiInfo.version}\`;
        document.getElementById('generated-at').textContent =
          \`Generated: \${new Date(data.generatedAt).toLocaleString()}\`;

        // Populate status filter
        const statusCodes = [...new Set(data.fieldInstances
          .map(f => f.httpStatus)
          .filter(s => s))];
        const statusSelect = document.getElementById('filter-status');
        statusCodes.sort().forEach(code => {
          const option = document.createElement('option');
          option.value = code;
          option.textContent = code;
          statusSelect.appendChild(option);
        });

        renderTable();
      } catch (error) {
        document.getElementById('data-table').innerHTML =
          \`<div class="error">Error: \${error.message}</div>\`;
      }
    }

    function renderTable() {
      if (!data) return;

      let tableData, columns;
      switch (currentTab) {
        case 'fields':
          tableData = data.fieldInstances;
          columns = fieldColumns;
          break;
        case 'endpoints':
          tableData = data.endpoints;
          columns = endpointColumns;
          break;
        case 'schemas':
          tableData = data.schemas;
          columns = schemaColumns;
          break;
      }

      if (table) {
        table.destroy();
      }

      table = new Tabulator("#data-table", {
        data: tableData,
        columns: columns,
        layout: "fitDataFill",
        pagination: "local",
        paginationSize: 50,
        paginationSizeSelector: [25, 50, 100, 200],
        movableColumns: true,
        resizableColumns: true,
        initialSort: currentTab === 'fields' ?
          [{column: "path", dir: "asc"}, {column: "method", dir: "asc"}] :
          [{column: "name", dir: "asc"}],
        placeholder: "No data available"
      });

      updateStats();
    }

    function updateStats() {
      if (!data || !table) return;

      const filtered = table.getDataCount("active");
      const total = table.getDataCount();

      let label;
      switch (currentTab) {
        case 'fields':
          label = 'field instances';
          break;
        case 'endpoints':
          label = 'endpoints';
          break;
        case 'schemas':
          label = 'schemas';
          break;
      }

      document.getElementById('stats').textContent =
        \`Showing \${filtered} of \${total} \${label}\`;
    }

    function applyFilters() {
      if (!table || currentTab !== 'fields') return;

      const filters = [];

      const search = document.getElementById('search').value;
      const method = document.getElementById('filter-method').value;
      const location = document.getElementById('filter-location').value;
      const status = document.getElementById('filter-status').value;

      if (method) filters.push({field: "method", type: "=", value: method});
      if (location) filters.push({field: "location", type: "=", value: location});
      if (status) filters.push({field: "httpStatus", type: "=", value: status});

      table.setFilter(filters);

      if (search) {
        table.addFilter(function(data) {
          const searchLower = search.toLowerCase();
          return Object.values(data).some(v =>
            String(v).toLowerCase().includes(searchLower)
          );
        });
      }

      updateStats();
    }

    // Event listeners
    document.getElementById('search').addEventListener('input', applyFilters);
    document.getElementById('filter-method').addEventListener('change', applyFilters);
    document.getElementById('filter-location').addEventListener('change', applyFilters);
    document.getElementById('filter-status').addEventListener('change', applyFilters);

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderTable();
      });
    });

    // Load data on page load
    loadData();
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
}

// Run the generator
generateDataDictionary().catch(error => {
  console.error('Error generating data dictionary:', error);
  process.exit(1);
});
