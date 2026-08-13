import { isDeepStrictEqual } from "node:util";

const DIALECT = "https://json-schema.org/draft/2020-12/schema";
const SUPPORTED_FORMATS = new Set(["date", "date-time"]);
const SUPPORTED_TYPES = new Set([
  "array",
  "boolean",
  "integer",
  "null",
  "number",
  "object",
  "string",
]);
const SUPPORTED_KEYWORDS = new Set([
  "$defs",
  "$id",
  "$ref",
  "$schema",
  "additionalProperties",
  "const",
  "enum",
  "format",
  "items",
  "maxLength",
  "minItems",
  "minLength",
  "pattern",
  "properties",
  "required",
  "title",
  "type",
  "uniqueItems",
]);

export const PROJECT_OPS_SCHEMA_PROFILE = Object.freeze({
  dialect: DIALECT,
  id: "DRAFT_2020_12_PROJECT_SUBSET_V1",
  supportedFormats: Object.freeze([...SUPPORTED_FORMATS].sort()),
  supportedKeywords: Object.freeze([...SUPPORTED_KEYWORDS].sort()),
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeJsonPointerToken(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function appendPointer(pointer, token) {
  return `${pointer}/${escapeJsonPointerToken(token)}`;
}

function appendInstancePath(instancePath, token) {
  if (typeof token === "number") {
    return `${instancePath}[${token}]`;
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(token)) {
    return instancePath ? `${instancePath}.${token}` : token;
  }
  return `${instancePath}[${JSON.stringify(token)}]`;
}

function decodeJsonPointerToken(value) {
  if (/~(?:[^01]|$)/.test(value)) {
    return null;
  }
  return value.replaceAll("~1", "/").replaceAll("~0", "~");
}

function resolveLocalReference(rootSchema, reference) {
  if (reference === "#") {
    return rootSchema;
  }
  if (typeof reference !== "string" || !reference.startsWith("#/")) {
    return null;
  }

  let current = rootSchema;
  for (const encodedToken of reference.slice(2).split("/")) {
    const token = decodeJsonPointerToken(encodedToken);
    if (token === null || !isObject(current) || !Object.hasOwn(current, token)) {
      return null;
    }
    current = current[token];
  }
  return current;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

function isValidDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  if (!isValidDate(`${year}-${month}-${day}`)) return false;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 60) return false;
  if (offsetHour !== undefined && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) {
    return false;
  }
  return true;
}

function matchesType(value, type) {
  switch (type) {
    case "array":
      return Array.isArray(value);
    case "boolean":
      return typeof value === "boolean";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "null":
      return value === null;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "object":
      return isObject(value);
    case "string":
      return typeof value === "string";
    default:
      return false;
  }
}

function addDefinitionError(errors, schemaPath, keyword, message) {
  errors.push({ keyword, schemaPath, message });
}

function validateNonNegativeIntegerKeyword(schema, keyword, schemaPath, errors) {
  if (
    Object.hasOwn(schema, keyword) &&
    (!Number.isInteger(schema[keyword]) || schema[keyword] < 0)
  ) {
    addDefinitionError(
      errors,
      appendPointer(schemaPath, keyword),
      keyword,
      `${keyword} 必须是非负整数`,
    );
  }
}

function inspectSchemaNode(schema, rootSchema, schemaPath, errors, references) {
  if (!isObject(schema)) {
    addDefinitionError(errors, schemaPath, "schema", "Schema 节点必须是对象");
    return;
  }

  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_KEYWORDS.has(keyword)) {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, keyword),
        keyword,
        `当前 ProjectOps profile 不支持关键字 ${keyword}`,
      );
    }
  }

  if (Object.hasOwn(schema, "$schema") && schema.$schema !== DIALECT) {
    addDefinitionError(
      errors,
      appendPointer(schemaPath, "$schema"),
      "$schema",
      `只支持 ${DIALECT}`,
    );
  }
  for (const keyword of ["$id", "title"]) {
    if (Object.hasOwn(schema, keyword) && typeof schema[keyword] !== "string") {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, keyword),
        keyword,
        `${keyword} 必须是字符串`,
      );
    }
  }

  if (Object.hasOwn(schema, "type")) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (
      types.length === 0 ||
      types.some((type) => typeof type !== "string" || !SUPPORTED_TYPES.has(type)) ||
      new Set(types).size !== types.length
    ) {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, "type"),
        "type",
        "type 必须是受支持且不重复的类型或类型数组",
      );
    }
  }

  if (Object.hasOwn(schema, "const") && schema.const === undefined) {
    addDefinitionError(errors, appendPointer(schemaPath, "const"), "const", "const 不能是 undefined");
  }
  if (Object.hasOwn(schema, "enum") && (!Array.isArray(schema.enum) || schema.enum.length === 0)) {
    addDefinitionError(errors, appendPointer(schemaPath, "enum"), "enum", "enum 必须是非空数组");
  }

  if (Object.hasOwn(schema, "required")) {
    if (
      !Array.isArray(schema.required) ||
      schema.required.some((value) => typeof value !== "string") ||
      new Set(schema.required).size !== schema.required.length
    ) {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, "required"),
        "required",
        "required 必须是不重复的字符串数组",
      );
    }
  }

  for (const keyword of ["properties", "$defs"]) {
    if (!Object.hasOwn(schema, keyword)) continue;
    if (!isObject(schema[keyword])) {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, keyword),
        keyword,
        `${keyword} 必须是对象`,
      );
      continue;
    }
    for (const [name, childSchema] of Object.entries(schema[keyword])) {
      inspectSchemaNode(
        childSchema,
        rootSchema,
        appendPointer(appendPointer(schemaPath, keyword), name),
        errors,
        references,
      );
    }
  }

  if (Object.hasOwn(schema, "items")) {
    inspectSchemaNode(
      schema.items,
      rootSchema,
      appendPointer(schemaPath, "items"),
      errors,
      references,
    );
  }

  if (Object.hasOwn(schema, "additionalProperties")) {
    if (typeof schema.additionalProperties !== "boolean") {
      inspectSchemaNode(
        schema.additionalProperties,
        rootSchema,
        appendPointer(schemaPath, "additionalProperties"),
        errors,
        references,
      );
    }
  }

  validateNonNegativeIntegerKeyword(schema, "minLength", schemaPath, errors);
  validateNonNegativeIntegerKeyword(schema, "maxLength", schemaPath, errors);
  validateNonNegativeIntegerKeyword(schema, "minItems", schemaPath, errors);
  if (
    Number.isInteger(schema.minLength) &&
    Number.isInteger(schema.maxLength) &&
    schema.minLength > schema.maxLength
  ) {
    addDefinitionError(errors, schemaPath, "length", "minLength 不能大于 maxLength");
  }
  if (Object.hasOwn(schema, "uniqueItems") && typeof schema.uniqueItems !== "boolean") {
    addDefinitionError(
      errors,
      appendPointer(schemaPath, "uniqueItems"),
      "uniqueItems",
      "uniqueItems 必须是布尔值",
    );
  }
  if (Object.hasOwn(schema, "pattern")) {
    if (typeof schema.pattern !== "string") {
      addDefinitionError(errors, appendPointer(schemaPath, "pattern"), "pattern", "pattern 必须是字符串");
    } else {
      try {
        new RegExp(schema.pattern, "u");
      } catch {
        addDefinitionError(errors, appendPointer(schemaPath, "pattern"), "pattern", "pattern 不是有效正则表达式");
      }
    }
  }
  if (Object.hasOwn(schema, "format") && !SUPPORTED_FORMATS.has(schema.format)) {
    addDefinitionError(
      errors,
      appendPointer(schemaPath, "format"),
      "format",
      `只支持 format: ${[...SUPPORTED_FORMATS].sort().join(", ")}`,
    );
  }

  if (Object.hasOwn(schema, "$ref")) {
    if (typeof schema.$ref !== "string" || resolveLocalReference(rootSchema, schema.$ref) === null) {
      addDefinitionError(
        errors,
        appendPointer(schemaPath, "$ref"),
        "$ref",
        "$ref 必须是可解析的本地 JSON Pointer",
      );
    } else {
      references.push({ reference: schema.$ref, schemaPath });
    }
  }
}

function collectNestedReferences(schema, references = new Set()) {
  if (!isObject(schema)) return references;
  if (typeof schema.$ref === "string") references.add(schema.$ref);
  for (const keyword of ["properties", "$defs"]) {
    if (isObject(schema[keyword])) {
      Object.values(schema[keyword]).forEach((child) => collectNestedReferences(child, references));
    }
  }
  if (isObject(schema.items)) collectNestedReferences(schema.items, references);
  if (isObject(schema.additionalProperties)) {
    collectNestedReferences(schema.additionalProperties, references);
  }
  return references;
}

function findReferenceCycle(rootSchema, references) {
  const graph = new Map();
  for (const reference of new Set(references.map((record) => record.reference))) {
    const target = resolveLocalReference(rootSchema, reference);
    graph.set(reference, collectNestedReferences(target));
  }

  const visited = new Set();
  const visiting = new Set();
  function visit(reference) {
    if (visiting.has(reference)) return reference;
    if (visited.has(reference)) return null;
    visiting.add(reference);
    for (const nestedReference of graph.get(reference) ?? []) {
      const cycle = visit(nestedReference);
      if (cycle !== null) return cycle;
    }
    visiting.delete(reference);
    visited.add(reference);
    return null;
  }

  for (const reference of graph.keys()) {
    const cycle = visit(reference);
    if (cycle !== null) return cycle;
  }
  return null;
}

export function inspectSchemaDefinition(schema) {
  const errors = [];
  const references = [];
  inspectSchemaNode(schema, schema, "#", errors, references);
  const referenceCycle = findReferenceCycle(schema, references);
  if (referenceCycle !== null) {
    addDefinitionError(
      errors,
      "#",
      "$ref",
      `当前 ProjectOps profile 不支持循环 $ref: ${referenceCycle}`,
    );
  }
  return errors;
}

function addInstanceError(errors, instancePath, schemaPath, keyword, message, details = undefined) {
  errors.push({
    keyword,
    instancePath,
    schemaPath,
    message,
    ...(details === undefined ? {} : { details }),
  });
}

function validateSchemaNode(rootSchema, schema, value, instancePath, schemaPath, errors) {
  if (Object.hasOwn(schema, "$ref")) {
    const referencedSchema = resolveLocalReference(rootSchema, schema.$ref);
    validateSchemaNode(rootSchema, referencedSchema, value, instancePath, schema.$ref, errors);
  }

  if (Object.hasOwn(schema, "type")) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesType(value, type))) {
      addInstanceError(
        errors,
        instancePath,
        appendPointer(schemaPath, "type"),
        "type",
        `值必须匹配类型 ${types.join(" | ")}`,
        { actualType: value === null ? "null" : Array.isArray(value) ? "array" : typeof value },
      );
      return;
    }
  }

  if (Object.hasOwn(schema, "const") && !isDeepStrictEqual(value, schema.const)) {
    addInstanceError(
      errors,
      instancePath,
      appendPointer(schemaPath, "const"),
      "const",
      "值与 const 不一致",
    );
  }
  if (Object.hasOwn(schema, "enum") && !schema.enum.some((candidate) => isDeepStrictEqual(value, candidate))) {
    addInstanceError(
      errors,
      instancePath,
      appendPointer(schemaPath, "enum"),
      "enum",
      "值不在 enum 中",
    );
  }

  if (isObject(value)) {
    const properties = isObject(schema.properties) ? schema.properties : {};
    if (Array.isArray(schema.required)) {
      for (const property of schema.required) {
        if (!Object.hasOwn(value, property)) {
          addInstanceError(
            errors,
            appendInstancePath(instancePath, property),
            appendPointer(schemaPath, "required"),
            "required",
            `缺少必需属性 ${property}`,
          );
        }
      }
    }
    for (const [property, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, property)) {
        validateSchemaNode(
          rootSchema,
          childSchema,
          value[property],
          appendInstancePath(instancePath, property),
          appendPointer(appendPointer(schemaPath, "properties"), property),
          errors,
        );
      }
    }
    for (const [property, propertyValue] of Object.entries(value)) {
      if (Object.hasOwn(properties, property)) continue;
      if (schema.additionalProperties === false) {
        addInstanceError(
          errors,
          appendInstancePath(instancePath, property),
          appendPointer(schemaPath, "additionalProperties"),
          "additionalProperties",
          `不允许附加属性 ${property}`,
        );
      } else if (isObject(schema.additionalProperties)) {
        validateSchemaNode(
          rootSchema,
          schema.additionalProperties,
          propertyValue,
          appendInstancePath(instancePath, property),
          appendPointer(schemaPath, "additionalProperties"),
          errors,
        );
      }
    }
  }

  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      addInstanceError(
        errors,
        instancePath,
        appendPointer(schemaPath, "minItems"),
        "minItems",
        `数组至少需要 ${schema.minItems} 项`,
      );
    }
    if (schema.uniqueItems === true) {
      for (let left = 0; left < value.length; left += 1) {
        for (let right = left + 1; right < value.length; right += 1) {
          if (isDeepStrictEqual(value[left], value[right])) {
            addInstanceError(
              errors,
              appendInstancePath(instancePath, right),
              appendPointer(schemaPath, "uniqueItems"),
              "uniqueItems",
              `数组第 ${right} 项与第 ${left} 项重复`,
            );
          }
        }
      }
    }
    if (isObject(schema.items)) {
      value.forEach((item, index) => {
        validateSchemaNode(
          rootSchema,
          schema.items,
          item,
          appendInstancePath(instancePath, index),
          appendPointer(schemaPath, "items"),
          errors,
        );
      });
    }
  }

  if (typeof value === "string") {
    const length = [...value].length;
    if (Number.isInteger(schema.minLength) && length < schema.minLength) {
      addInstanceError(errors, instancePath, appendPointer(schemaPath, "minLength"), "minLength", `字符串长度不能小于 ${schema.minLength}`);
    }
    if (Number.isInteger(schema.maxLength) && length > schema.maxLength) {
      addInstanceError(errors, instancePath, appendPointer(schemaPath, "maxLength"), "maxLength", `字符串长度不能大于 ${schema.maxLength}`);
    }
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) {
      addInstanceError(errors, instancePath, appendPointer(schemaPath, "pattern"), "pattern", `字符串不匹配 ${schema.pattern}`);
    }
    if (schema.format === "date" && !isValidDate(value)) {
      addInstanceError(errors, instancePath, appendPointer(schemaPath, "format"), "format", "字符串不是有效 RFC 3339 full-date");
    }
    if (schema.format === "date-time" && !isValidDateTime(value)) {
      addInstanceError(errors, instancePath, appendPointer(schemaPath, "format"), "format", "字符串不是有效 RFC 3339 date-time");
    }
  }
}

export function validateSchemaInstance(schema, value) {
  const definitionErrors = inspectSchemaDefinition(schema);
  if (definitionErrors.length > 0) {
    throw new TypeError("Schema definition must pass inspectSchemaDefinition before instance validation");
  }
  const errors = [];
  validateSchemaNode(schema, schema, value, "", "#", errors);
  return errors;
}
