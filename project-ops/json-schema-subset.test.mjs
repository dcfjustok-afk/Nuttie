import assert from "node:assert/strict";
import test from "node:test";

import {
  PROJECT_OPS_SCHEMA_PROFILE,
  inspectSchemaDefinition,
  validateSchemaInstance,
} from "./json-schema-subset.mjs";

const SCHEMA = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["id", "createdAt", "tags", "party"],
  properties: {
    id: { type: "string", pattern: "^X-[0-9]{3}$" },
    createdAt: { type: "string", format: "date-time" },
    optionalDate: { type: ["string", "null"], format: "date" },
    tags: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: { type: "string", minLength: 1, maxLength: 5 },
    },
    party: { $ref: "#/$defs/party" },
  },
  $defs: {
    party: {
      type: "object",
      additionalProperties: false,
      required: ["id", "enabled"],
      properties: {
        id: { const: "owner" },
        enabled: { type: "boolean" },
        mode: { enum: ["LOCAL", "OFFLINE"] },
      },
    },
  },
});

function validInstance() {
  return {
    id: "X-001",
    createdAt: "2026-08-13T09:00:00+08:00",
    optionalDate: "2024-02-29",
    tags: ["本地", "AI"],
    party: { id: "owner", enabled: true, mode: "LOCAL" },
  };
}

test("project profile explicitly names every supported keyword and format", () => {
  assert.equal(PROJECT_OPS_SCHEMA_PROFILE.id, "DRAFT_2020_12_PROJECT_SUBSET_V1");
  assert.deepEqual(PROJECT_OPS_SCHEMA_PROFILE.supportedFormats, ["date", "date-time"]);
  assert.ok(PROJECT_OPS_SCHEMA_PROFILE.supportedKeywords.includes("$ref"));
  assert.ok(PROJECT_OPS_SCHEMA_PROFILE.supportedKeywords.includes("additionalProperties"));
  assert.ok(Object.isFrozen(PROJECT_OPS_SCHEMA_PROFILE));
});

test("validates the complete supported ProjectOps keyword subset", () => {
  assert.deepEqual(inspectSchemaDefinition(SCHEMA), []);
  assert.deepEqual(validateSchemaInstance(SCHEMA, validInstance()), []);
});

test("definition inspection rejects unsupported or malformed schema constructs", async (t) => {
  await t.test("unsupported keyword", () => {
    const schema = structuredClone(SCHEMA);
    schema.properties.id.minimum = 1;
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "minimum"));
  });

  await t.test("external reference", () => {
    const schema = structuredClone(SCHEMA);
    schema.properties.party.$ref = "https://example.com/party.json";
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "$ref"));
  });

  await t.test("recursive local reference", () => {
    const schema = structuredClone(SCHEMA);
    schema.$defs.party.properties.child = { $ref: "#/$defs/party" };
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "$ref"));
  });

  await t.test("indirect local reference cycle", () => {
    const schema = structuredClone(SCHEMA);
    schema.$defs.party.properties.child = { $ref: "#/$defs/other" };
    schema.$defs.other = {
      type: "object",
      properties: { parent: { $ref: "#/$defs/party" } },
    };
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "$ref"));
  });

  await t.test("invalid regular expression", () => {
    const schema = structuredClone(SCHEMA);
    schema.properties.id.pattern = "[";
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "pattern"));
  });

  await t.test("unknown format", () => {
    const schema = structuredClone(SCHEMA);
    schema.properties.createdAt.format = "uri";
    assert.ok(inspectSchemaDefinition(schema).some((error) => error.keyword === "format"));
  });

  await t.test("invalid length bounds and duplicate required", () => {
    const schema = structuredClone(SCHEMA);
    schema.properties.id.minLength = 5;
    schema.properties.id.maxLength = 2;
    schema.required.push("id");
    const errors = inspectSchemaDefinition(schema);
    assert.ok(errors.some((error) => error.keyword === "length"));
    assert.ok(errors.some((error) => error.keyword === "required"));
  });
});

test("instance validation reports exact paths for every supported failure class", () => {
  const instance = validInstance();
  delete instance.id;
  instance.createdAt = "2026-02-29T25:00:00+24:00";
  instance.optionalDate = "2023-02-29";
  instance.tags = ["duplicate", "duplicate"];
  instance.party = { id: "guest", enabled: "yes", mode: "REMOTE", extra: true };
  instance.extra = true;

  const errors = validateSchemaInstance(SCHEMA, instance);
  const failures = errors.map(({ keyword, instancePath }) => `${keyword}:${instancePath}`);

  assert.ok(failures.includes("required:id"));
  assert.ok(failures.includes("format:createdAt"));
  assert.ok(failures.includes("format:optionalDate"));
  assert.ok(failures.includes("uniqueItems:tags[1]"));
  assert.ok(failures.includes("maxLength:tags[0]"));
  assert.ok(failures.includes("const:party.id"));
  assert.ok(failures.includes("type:party.enabled"));
  assert.ok(failures.includes("enum:party.mode"));
  assert.ok(failures.includes("additionalProperties:party.extra"));
  assert.ok(failures.includes("additionalProperties:extra"));
});

test("string length counts Unicode code points and local refs stay within the root schema", () => {
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["emoji", "nested"],
    properties: {
      emoji: { type: "string", minLength: 1, maxLength: 1 },
      nested: { $ref: "#/$defs/nested" },
    },
    $defs: {
      nested: {
        type: "object",
        additionalProperties: false,
        required: ["value"],
        properties: { value: { type: "integer" } },
      },
    },
  };

  assert.deepEqual(validateSchemaInstance(schema, { emoji: "😀", nested: { value: 1 } }), []);
  assert.ok(
    validateSchemaInstance(schema, { emoji: "😀😀", nested: { value: 1 } }).some(
      (error) => error.keyword === "maxLength" && error.instancePath === "emoji",
    ),
  );
});

test("reference analysis ignores instance data and RFC 3339 leap seconds remain valid", () => {
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["recordedAt", "literal"],
    properties: {
      recordedAt: { type: "string", format: "date-time" },
      literal: { const: { $ref: "#/$defs/literal-data-not-a-schema-reference" } },
    },
  };

  const value = {
    recordedAt: "2016-12-31T23:59:60Z",
    literal: { $ref: "#/$defs/literal-data-not-a-schema-reference" },
  };
  assert.deepEqual(inspectSchemaDefinition(schema), []);
  assert.deepEqual(validateSchemaInstance(schema, value), []);
});

test("instance validation refuses unchecked schema definitions", () => {
  assert.throws(
    () => validateSchemaInstance({ type: "string", minimum: 1 }, "value"),
    /inspectSchemaDefinition/,
  );
});
