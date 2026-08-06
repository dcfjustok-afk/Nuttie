import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const EVENT_FILE_PATTERN = /^([0-9]{4}-[0-9]{2}-[0-9]{2})\.jsonl$/;
const EVENT_ID_PATTERN = /^EVT-([0-9]{8})-([0-9]{3})$/;
const MESSAGE_ID_PATTERN = /^MSG-[0-9]{8}-[0-9]{3,}$/;
const DECISION_ID_PATTERN = /^D-[0-9]{3}$/;
const EVIDENCE_ID_PATTERN = /^(ACC|DAY|LOG|FOOD|BODY|AI|SYS|DATA)-[0-9]{2}$/;
const GAP_THEME_ID_PATTERN = /^EG-[0-9]{2}$/;

export const PHASE0_2026_08_06 = Object.freeze({
  id: "PHASE0_2026_08_06",
  counts: Object.freeze({
    schemas: 4,
    decisions: 31,
    acceptedDecisions: 17,
    candidateDecisions: 14,
    events: 82,
    messages: 90,
    resolvedResponses: 56,
    agents: 17,
    activeAgents: 1,
    evidenceItems: 66,
    confirmedEvidence: 37,
    crossSourceEvidence: 24,
    pendingEvidence: 5,
    gapThemes: 9,
    ownerResponses: 13,
    ownerDecisionIds: 12,
  }),
  activeAgentIds: Object.freeze(["root"]),
  eventCountsByDate: Object.freeze({
    "2026-07-31": 59,
    "2026-08-03": 13,
    "2026-08-05": 5,
    "2026-08-06": 5,
  }),
  pendingEvidenceIds: Object.freeze([
    "LOG-08",
    "LOG-09",
    "AI-06",
    "DATA-07",
    "DATA-08",
  ]),
  ownerIntake: Object.freeze({
    channel: "CODEX_REQUEST_USER_INPUT",
    status: "IN_PROGRESS_MODE_INTERRUPTED",
    acceptanceStateChanged: false,
    responseState: "PENDING_BATCH_READBACK",
    nextQuestionId: "oi03_device_availability",
    nextQuestionMode: "PLAN",
    nextQuestionTool: "request_user_input",
    d047InitialOption: "A",
    d047LatestQuestionId: "d047_scope_clarification",
    d047LatestOption: "C",
    decisionIds: Object.freeze([
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-023",
      "D-024",
      "D-025",
      "D-032",
      "D-037",
      "D-038",
      "D-047",
      "D-048",
    ]),
  }),
  d039: Object.freeze({
    eventId: "EVT-20260805-005",
    subjectId: "D-039-PX-2",
    from: "PX-2_INDEPENDENT_RETEST_PENDING",
    to: "PX-2_PASS",
    next: "READY_FOR_OWNER_REVIEW",
    decisionState: "CANDIDATE",
    ownerChoiceRecorded: false,
    formalImplementationAuthorized: false,
    findingsClosed: Object.freeze(
      Array.from(
        { length: 10 },
        (_, index) => `D039-QA-${String(index + 1).padStart(3, "0")}`,
      ),
    ),
  }),
  d040: Object.freeze({
    initialFeedbackEventId: "EVT-20260806-002",
    finalFeedbackEventId: "EVT-20260806-005",
    initialCorrelationId: "d040-independent-prototype-review",
    finalCorrelationId: "d040-independent-prototype-delta-retest",
    reviewerId: "owner_gate_readback_audit",
    reviewerScopedProvisionalState: "PX-1_COMPLETE",
    authoritativeState: "PX-0_INPUT_GAP",
    provisionalStateAcceptedByPm: false,
    decisionState: "CANDIDATE",
    recommendedState: "PX-0_INPUT_GAP",
    next: "FORMULA_REVIEW_REQUIRED",
    originalFindings: Object.freeze({ P1: 2, P2: 4, P3: 1 }),
    closedFindings: Object.freeze({ P1: 2, P2: 4, P3: 1 }),
    newFindings: 0,
    automatedFlowsPassed: 9,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    formalImplementationAuthorized: false,
    oi03RemainsNext: true,
  }),
});

export class ProjectOpsLoadError extends Error {
  constructor(code, sourcePath, message) {
    super(message);
    this.name = "ProjectOpsLoadError";
    this.code = code;
    this.sourcePath = sourcePath;
  }
}

function readJson(workspaceRoot, relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  let text;

  try {
    text = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativePath,
      `无法读取 ${relativePath}: ${error.message}`,
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_JSON_PARSE_ERROR",
      relativePath,
      `${relativePath} 不是有效 JSON: ${error.message}`,
    );
  }
}

function readJsonlDirectory(workspaceRoot, relativeDirectory) {
  const absoluteDirectory = path.join(workspaceRoot, relativeDirectory);
  let entries;

  try {
    entries = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativeDirectory,
      `无法读取 ${relativeDirectory}: ${error.message}`,
    );
  }

  return entries.flatMap((entry) => {
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    const absolutePath = path.join(absoluteDirectory, entry.name);
    let text;

    try {
      text = fs.readFileSync(absolutePath, "utf8");
    } catch (error) {
      throw new ProjectOpsLoadError(
        "OPS_READ_ERROR",
        relativePath,
        `无法读取 ${relativePath}: ${error.message}`,
      );
    }

    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === "") {
      lines.pop();
    }

    return lines.map((line, index) => {
        const lineNumber = index + 1;
        if (line.trim().length === 0) {
          throw new ProjectOpsLoadError(
            "OPS_JSONL_EMPTY_LINE",
            `${relativePath}:${lineNumber}`,
            `${relativePath}:${lineNumber} 存在中间空行`,
          );
        }
        try {
          return {
            sourceFile: relativePath,
            fileName: entry.name,
            lineNumber,
            value: JSON.parse(line),
          };
        } catch (error) {
          throw new ProjectOpsLoadError(
            "OPS_JSONL_PARSE_ERROR",
            `${relativePath}:${lineNumber}`,
            `${relativePath}:${lineNumber} 不是有效 JSON: ${error.message}`,
          );
        }
      });
  });
}

function readJsonDirectory(workspaceRoot, relativeDirectory, suffix) {
  const absoluteDirectory = path.join(workspaceRoot, relativeDirectory);
  let entries;

  try {
    entries = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativeDirectory,
      `无法读取 ${relativeDirectory}: ${error.message}`,
    );
  }

  return entries.map((entry) => {
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    return {
      sourceFile: relativePath,
      value: readJson(workspaceRoot, relativePath),
    };
  });
}

function readText(workspaceRoot, relativePath) {
  try {
    return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativePath,
      `无法读取 ${relativePath}: ${error.message}`,
    );
  }
}

function parseMarkdownTableIds(text, idPattern, statusColumn = null) {
  const rows = [];

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("`", ""));
    const id = cells[0];

    if (!idPattern.test(id)) {
      continue;
    }

    rows.push({
      id,
      lineNumber: index + 1,
      ...(statusColumn === null ? {} : { status: cells[statusColumn] }),
    });
  }

  return rows;
}

export function loadProjectOps(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const resolvedRoot = path.resolve(workspaceRoot);
  const evidenceText = readText(resolvedRoot, "docs/01-research/competitor-evidence-matrix.md");
  const gapThemeText = readText(resolvedRoot, "docs/01-research/public-evidence-gaps.md");

  return {
    workspaceRoot: resolvedRoot,
    schemas: readJsonDirectory(resolvedRoot, "project-ops/schemas", ".schema.json"),
    decisionRegister: readJson(resolvedRoot, "project-ops/decisions.json"),
    ownerIntake: readJson(resolvedRoot, "project-ops/owner-intake.json"),
    snapshot: readJson(resolvedRoot, "project-ops/snapshots/current.json"),
    events: readJsonlDirectory(resolvedRoot, "project-ops/events"),
    messages: readJsonlDirectory(resolvedRoot, "project-ops/messages"),
    evidenceRows: parseMarkdownTableIds(evidenceText, EVIDENCE_ID_PATTERN, 4),
    gapThemeRows: parseMarkdownTableIds(gapThemeText, GAP_THEME_ID_PATTERN),
  };
}

function arraysEqualAsSets(left, right) {
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}

export function validateOperationalInvariants(model, baseline = PHASE0_2026_08_06) {
  const diagnostics = [];
  const add = (code, diagnosticPath, message, details = undefined) => {
    diagnostics.push({
      code,
      path: diagnosticPath,
      message,
      ...(details === undefined ? {} : { details }),
    });
  };
  const expectEqual = (actual, expected, code, diagnosticPath) => {
    if (actual !== expected) {
      add(code, diagnosticPath, `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`, {
        expected,
        actual,
      });
    }
  };

  const versionedDocuments = [
    ["project-ops/decisions.json", model.decisionRegister],
    ["project-ops/owner-intake.json", model.ownerIntake],
    ["project-ops/snapshots/current.json", model.snapshot],
  ];
  for (const [documentPath, value] of versionedDocuments) {
    if (!isPlainObject(value)) {
      add("OPS_INVALID_SHAPE", documentPath, "顶层 JSON 必须是对象");
    } else if (value.schemaVersion !== 1) {
      add("OPS_SCHEMA_VERSION_MISMATCH", `${documentPath}.schemaVersion`, "schemaVersion 必须为 1");
    }
  }
  model.schemas.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", record.sourceFile, "Schema JSON 顶层必须是对象");
    }
  });

  const decisions = Array.isArray(model.decisionRegister?.decisions)
    ? model.decisionRegister.decisions
    : [];
  if (!Array.isArray(model.decisionRegister?.decisions)) {
    add("OPS_INVALID_SHAPE", "project-ops/decisions.json.decisions", "decisions 必须是数组");
  }

  const decisionIds = decisions.map((decision) => decision?.id);
  const duplicateDecisionIds = duplicateValues(decisionIds.filter((id) => typeof id === "string"));
  if (duplicateDecisionIds.length > 0) {
    add("OPS_DUP_DECISION_ID", "project-ops/decisions.json.decisions", "决定 ID 不唯一", {
      duplicateDecisionIds,
    });
  }
  decisions.forEach((decision, index) => {
    if (!DECISION_ID_PATTERN.test(decision?.id ?? "")) {
      add(
        "OPS_INVALID_DECISION_ID",
        `project-ops/decisions.json.decisions[${index}].id`,
        "决定 ID 必须匹配 D-NNN",
      );
    }
  });

  const acceptedDecisions = decisions.filter((decision) => decision?.status === "ACCEPTED").length;
  const candidateDecisions = decisions.filter((decision) => decision?.status === "CANDIDATE").length;
  const unsupportedDecisionStatuses = decisions
    .filter((decision) => !["ACCEPTED", "CANDIDATE"].includes(decision?.status))
    .map((decision) => ({ id: decision?.id, status: decision?.status }));
  if (unsupportedDecisionStatuses.length > 0) {
    add(
      "OPS_UNSUPPORTED_DECISION_STATUS",
      "project-ops/decisions.json.decisions",
      "当前基线只允许 ACCEPTED 或 CANDIDATE",
      { unsupportedDecisionStatuses },
    );
  }

  const eventIds = model.events.map((record) => record.value?.eventId);
  const duplicateEventIds = duplicateValues(eventIds.filter((id) => typeof id === "string"));
  if (duplicateEventIds.length > 0) {
    add("OPS_DUP_EVENT_ID", "project-ops/events", "事件 ID 不唯一", { duplicateEventIds });
  }
  model.events.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", `${record.sourceFile}:${record.lineNumber}`, "事件必须是 JSON 对象");
    } else if (record.value.schemaVersion !== 1) {
      add(
        "OPS_SCHEMA_VERSION_MISMATCH",
        `${record.sourceFile}:${record.lineNumber}.schemaVersion`,
        "事件 schemaVersion 必须为 1",
      );
    }
  });

  const eventsByFile = new Map();
  for (const record of model.events) {
    const records = eventsByFile.get(record.fileName) ?? [];
    records.push(record);
    eventsByFile.set(record.fileName, records);
  }

  for (const [fileName, records] of eventsByFile) {
    const fileMatch = EVENT_FILE_PATTERN.exec(fileName);
    if (!fileMatch) {
      add("OPS_INVALID_EVENT_FILE", `project-ops/events/${fileName}`, "事件文件名必须是 YYYY-MM-DD.jsonl");
      continue;
    }

    const fileDate = fileMatch[1];
    const compactDate = fileDate.replaceAll("-", "");
    records.forEach((record, index) => {
      const eventId = record.value?.eventId;
      const idMatch = EVENT_ID_PATTERN.exec(eventId ?? "");
      const recordPath = `${record.sourceFile}:${record.lineNumber}`;
      const expectedEventId = `EVT-${compactDate}-${String(index + 1).padStart(3, "0")}`;

      if (!idMatch) {
        add("OPS_INVALID_EVENT_ID", `${recordPath}.eventId`, "事件 ID 格式无效");
      } else {
        if (idMatch[1] !== compactDate) {
          add(
            "OPS_EVENT_FILE_PREFIX_MISMATCH",
            `${recordPath}.eventId`,
            `事件 ID 日期必须匹配 ${fileName}`,
            { expectedDate: compactDate, actualDate: idMatch[1] },
          );
        }
        if (eventId !== expectedEventId) {
          add(
            "OPS_EVENT_SEQUENCE_GAP",
            `${recordPath}.eventId`,
            "事件必须按文件行顺序从 001 连续递增",
            { expected: expectedEventId, actual: eventId },
          );
        }
      }

      const recordedAt = record.value?.recordedAt;
      const timestamp = Date.parse(recordedAt);
      if (typeof recordedAt !== "string" || Number.isNaN(timestamp)) {
        add("OPS_INVALID_EVENT_TIME", `${recordPath}.recordedAt`, "recordedAt 必须是可解析的时间");
      } else {
        if (recordedAt.slice(0, 10) !== fileDate) {
          add(
            "OPS_EVENT_RECORDED_DATE_MISMATCH",
            `${recordPath}.recordedAt`,
            `recordedAt 日期必须匹配 ${fileName}`,
            { expectedDate: fileDate, actualDate: recordedAt.slice(0, 10) },
          );
        }
      }
    });
  }

  const eventCountsByDate = Object.fromEntries(
    [...eventsByFile.entries()]
      .filter(([fileName]) => EVENT_FILE_PATTERN.test(fileName))
      .map(([fileName, records]) => [fileName.slice(0, 10), records.length]),
  );
  const actualEventDates = Object.keys(eventCountsByDate).sort();
  const expectedEventDates = Object.keys(baseline.eventCountsByDate).sort();
  if (!arraysEqualAsSets(actualEventDates, expectedEventDates)) {
    add(
      "OPS_EVENT_DAY_SET_MISMATCH",
      "project-ops/events",
      "事件日期文件集合偏离 Phase 0 基线",
      { expected: expectedEventDates, actual: actualEventDates },
    );
  }
  for (const [eventDate, expectedCount] of Object.entries(baseline.eventCountsByDate)) {
    expectEqual(
      eventCountsByDate[eventDate],
      expectedCount,
      "OPS_EVENT_DAY_COUNT_MISMATCH",
      `project-ops/events/${eventDate}.jsonl`,
    );
  }

  const messageIds = model.messages.map((record) => record.value?.messageId);
  const duplicateMessageIds = duplicateValues(messageIds.filter((id) => typeof id === "string"));
  if (duplicateMessageIds.length > 0) {
    add("OPS_DUP_MESSAGE_ID", "project-ops/messages", "消息 ID 不唯一", { duplicateMessageIds });
  }
  model.messages.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", `${record.sourceFile}:${record.lineNumber}`, "消息必须是 JSON 对象");
      return;
    }
    if (record.value.schemaVersion !== 1) {
      add(
        "OPS_SCHEMA_VERSION_MISMATCH",
        `${record.sourceFile}:${record.lineNumber}.schemaVersion`,
        "消息 schemaVersion 必须为 1",
      );
    }
    if (!MESSAGE_ID_PATTERN.test(record.value?.messageId ?? "")) {
      add(
        "OPS_INVALID_MESSAGE_ID",
        `${record.sourceFile}:${record.lineNumber}.messageId`,
        "消息 ID 格式无效",
      );
    }
  });

  const responseTargets = new Set([...eventIds, ...messageIds].filter((id) => typeof id === "string"));
  const messagesById = new Map(
    model.messages.map((record) => [record.value?.messageId, record]),
  );
  let resolvedResponses = 0;
  model.messages.forEach((record) => {
    const responseTo = record.value?.responseTo;
    if (typeof responseTo === "string" && !responseTargets.has(responseTo)) {
      add(
        "OPS_DANGLING_RESPONSE_TO",
        `${record.sourceFile}:${record.lineNumber}.responseTo`,
        `responseTo 无法解析到既有事件或消息: ${responseTo}`,
      );
      return;
    }
    if (typeof responseTo === "string") {
      resolvedResponses += 1;
      if (responseTo === record.value?.messageId) {
        add(
          "OPS_SELF_RESPONSE",
          `${record.sourceFile}:${record.lineNumber}.responseTo`,
          "消息不能回复自身",
        );
      }
      const parent = messagesById.get(responseTo);
      if (parent) {
        const parentTime = Date.parse(parent.value?.sentAt);
        const responseTime = Date.parse(record.value?.sentAt);
        if (!Number.isNaN(parentTime) && !Number.isNaN(responseTime) && parentTime > responseTime) {
          add(
            "OPS_RESPONSE_TO_FUTURE",
            `${record.sourceFile}:${record.lineNumber}.responseTo`,
            "消息不能回复未来发送的消息",
            { responseTo },
          );
        }
      }
    }
  });

  const evidenceIds = model.evidenceRows.map((row) => row.id);
  const duplicateEvidenceIds = duplicateValues(evidenceIds);
  if (duplicateEvidenceIds.length > 0) {
    add("OPS_DUP_EVIDENCE_ID", "docs/01-research/competitor-evidence-matrix.md", "证据 ID 不唯一", {
      duplicateEvidenceIds,
    });
  }
  const evidenceCounts = {
    confirmed: model.evidenceRows.filter((row) => row.status === "confirmed").length,
    crossSource: model.evidenceRows.filter((row) => row.status === "cross-source").length,
    pending: model.evidenceRows.filter((row) => row.status === "pending").length,
  };
  const unsupportedEvidenceRows = model.evidenceRows.filter(
    (row) => !["confirmed", "cross-source", "pending"].includes(row.status),
  );
  if (unsupportedEvidenceRows.length > 0) {
    add(
      "OPS_UNSUPPORTED_EVIDENCE_STATUS",
      "docs/01-research/competitor-evidence-matrix.md",
      "证据状态必须是 confirmed、cross-source 或 pending",
      { rows: unsupportedEvidenceRows },
    );
  }

  const gapThemeIds = model.gapThemeRows.map((row) => row.id);
  const duplicateGapThemeIds = duplicateValues(gapThemeIds);
  if (duplicateGapThemeIds.length > 0) {
    add("OPS_DUP_GAP_THEME_ID", "docs/01-research/public-evidence-gaps.md", "Gap theme ID 不唯一", {
      duplicateGapThemeIds,
    });
  }

  const agents = Array.isArray(model.snapshot?.agents) ? model.snapshot.agents : [];
  if (!Array.isArray(model.snapshot?.agents)) {
    add("OPS_INVALID_SHAPE", "project-ops/snapshots/current.json.agents", "agents 必须是数组");
  }
  agents.forEach((agent, index) => {
    if (!isPlainObject(agent)) {
      add(
        "OPS_INVALID_SHAPE",
        `project-ops/snapshots/current.json.agents[${index}]`,
        "Agent roster 条目必须是对象",
      );
    } else if (typeof agent.id !== "string" || agent.id.trim().length === 0) {
      add(
        "OPS_INVALID_AGENT_ID",
        `project-ops/snapshots/current.json.agents[${index}].id`,
        "Agent ID 必须是非空字符串",
      );
    }
  });
  const agentIds = agents.map((agent) => agent?.id).filter((id) => typeof id === "string");
  const duplicateAgentIds = duplicateValues(agentIds);
  if (duplicateAgentIds.length > 0) {
    add(
      "OPS_DUP_AGENT_ID",
      "project-ops/snapshots/current.json.agents",
      "Agent roster ID 不唯一",
      { duplicateAgentIds },
    );
  }
  const activeAgentIds = agents
    .filter((agent) => agent?.state === "active")
    .map((agent) => agent.id)
    .sort();
  if (!arraysEqualAsSets(activeAgentIds, baseline.activeAgentIds)) {
    add(
      "OPS_ACTIVE_AGENT_SET_MISMATCH",
      "project-ops/snapshots/current.json.agents",
      "当前活跃角色集合必须与 Phase 0 基线一致",
      { expected: baseline.activeAgentIds, actual: activeAgentIds },
    );
  }

  const sourceCounts = {
    schemas: model.schemas.length,
    decisions: decisions.length,
    acceptedDecisions,
    candidateDecisions,
    events: model.events.length,
    messages: model.messages.length,
    resolvedResponses,
    agents: agents.length,
    activeAgents: activeAgentIds.length,
    evidenceItems: model.evidenceRows.length,
    confirmedEvidence: evidenceCounts.confirmed,
    crossSourceEvidence: evidenceCounts.crossSource,
    pendingEvidence: evidenceCounts.pending,
    gapThemes: gapThemeIds.length,
  };
  for (const [metric, expected] of Object.entries(baseline.counts)) {
    if (metric === "ownerResponses" || metric === "ownerDecisionIds") {
      continue;
    }
    expectEqual(sourceCounts[metric], expected, "OPS_BASELINE_METRIC_MISMATCH", `baseline.counts.${metric}`);
  }

  const snapshotMetrics = model.snapshot?.metrics ?? {};
  const snapshotExpectations = {
    acceptedDecisions,
    candidateDecisions,
    projectEvents: model.events.length,
    agentMessages: model.messages.length,
    agentRosterSize: agents.length,
    activeAgents: activeAgentIds.length,
    evidenceItems: model.evidenceRows.length,
    confirmedIosItems: evidenceCounts.confirmed,
    crossSourceItems: evidenceCounts.crossSource,
    evidenceGaps: evidenceCounts.pending,
    gapThemeCount: gapThemeIds.length,
  };
  for (const [metric, expected] of Object.entries(snapshotExpectations)) {
    expectEqual(
      snapshotMetrics[metric],
      expected,
      "OPS_SNAPSHOT_METRIC_MISMATCH",
      `project-ops/snapshots/current.json.metrics.${metric}`,
    );
  }

  const pendingEvidenceIds = model.evidenceRows
    .filter((row) => row.status === "pending")
    .map((row) => row.id)
    .sort();
  if (!arraysEqualAsSets(pendingEvidenceIds, baseline.pendingEvidenceIds)) {
    add(
      "OPS_PENDING_EVIDENCE_SET_MISMATCH",
      "docs/01-research/competitor-evidence-matrix.md",
      "pending evidence 集合偏离 Phase 0 基线",
      { expected: baseline.pendingEvidenceIds, actual: pendingEvidenceIds },
    );
  }
  const snapshotPendingEvidenceIds = Array.isArray(model.snapshot?.pendingEvidenceIds)
    ? model.snapshot.pendingEvidenceIds
    : [];
  if (!arraysEqualAsSets(snapshotPendingEvidenceIds, pendingEvidenceIds)) {
    add(
      "OPS_SNAPSHOT_PENDING_EVIDENCE_MISMATCH",
      "project-ops/snapshots/current.json.pendingEvidenceIds",
      "快照 pendingEvidenceIds 必须与证据矩阵一致",
      { expected: pendingEvidenceIds, actual: snapshotPendingEvidenceIds },
    );
  }

  const ownerIntake = model.ownerIntake ?? {};
  const ownerResponses = Array.isArray(ownerIntake.responses) ? ownerIntake.responses : [];
  const ownerDecisionIds = new Set(
    ownerResponses.map((response) => response?.decisionId).filter((id) => typeof id === "string"),
  );
  expectEqual(
    ownerResponses.length,
    baseline.counts.ownerResponses,
    "OPS_BASELINE_METRIC_MISMATCH",
    "project-ops/owner-intake.json.responses",
  );
  expectEqual(
    ownerDecisionIds.size,
    baseline.counts.ownerDecisionIds,
    "OPS_BASELINE_METRIC_MISMATCH",
    "project-ops/owner-intake.json.responses.decisionId",
  );
  if (!arraysEqualAsSets([...ownerDecisionIds], baseline.ownerIntake.decisionIds)) {
    add(
      "OPS_OWNER_DECISION_SET_MISMATCH",
      "project-ops/owner-intake.json.responses.decisionId",
      "Owner 当前批次必须保持精确的 12 项候选集合",
      { expected: baseline.ownerIntake.decisionIds, actual: [...ownerDecisionIds].sort() },
    );
  }
  const decisionStatusById = new Map(
    decisions.map((decision) => [decision?.id, decision?.status]),
  );
  const nonCandidateOwnerDecisionIds = [...ownerDecisionIds].filter(
    (decisionId) => decisionStatusById.get(decisionId) !== "CANDIDATE",
  );
  if (nonCandidateOwnerDecisionIds.length > 0) {
    add(
      "OPS_OWNER_DECISION_NOT_CANDIDATE",
      "project-ops/owner-intake.json.responses.decisionId",
      "Owner 当前批次的每个决定都必须仍在权威台账中保持 CANDIDATE",
      { nonCandidateOwnerDecisionIds },
    );
  }
  if (ownerIntake.channel !== baseline.ownerIntake.channel) {
    add(
      "OPS_OWNER_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.channel",
      "Owner 决策渠道必须保持聊天内原生 request_user_input",
      { expected: baseline.ownerIntake.channel, actual: ownerIntake.channel },
    );
  }
  if (ownerIntake.status !== baseline.ownerIntake.status) {
    add(
      "OPS_OWNER_BATCH_PREMATURELY_CLOSED",
      "project-ops/owner-intake.json.status",
      "Owner 批次尚未完成最终回读",
      { expected: baseline.ownerIntake.status, actual: ownerIntake.status },
    );
  }
  if (ownerIntake.acceptanceStateChanged !== baseline.ownerIntake.acceptanceStateChanged) {
    add(
      "OPS_OWNER_ACCEPTANCE_STATE_CHANGED",
      "project-ops/owner-intake.json.acceptanceStateChanged",
      "Owner 尚未授权改变 accepted 状态",
    );
  }
  ownerResponses.forEach((response, index) => {
    if (response?.state !== baseline.ownerIntake.responseState) {
      add(
        "OPS_OWNER_RESPONSE_FINALIZED",
        `project-ops/owner-intake.json.responses[${index}].state`,
        "Owner response 在整批回读前必须保持待确认",
        { questionId: response?.questionId, actual: response?.state },
      );
    }
  });
  const d047Responses = ownerResponses.filter((response) => response?.decisionId === "D-047");
  const d047AuditTrailValid =
    d047Responses.length === 2 &&
    d047Responses[0]?.optionKey === baseline.ownerIntake.d047InitialOption &&
    d047Responses[1]?.questionId === baseline.ownerIntake.d047LatestQuestionId &&
    d047Responses[1]?.optionKey === baseline.ownerIntake.d047LatestOption;
  if (!d047AuditTrailValid) {
    add(
      "OPS_OWNER_D047_AUDIT_TRAIL_CHANGED",
      "project-ops/owner-intake.json.responses",
      "D-047 必须保留原始 A 和后续 Owner 回正为 C 的审计顺序",
    );
  }
  if (ownerIntake.nextQuestion?.id !== baseline.ownerIntake.nextQuestionId) {
    add(
      "OPS_OWNER_NEXT_QUESTION_CHANGED",
      "project-ops/owner-intake.json.nextQuestion.id",
      "下一题必须保持 OI-03",
      { expected: baseline.ownerIntake.nextQuestionId, actual: ownerIntake.nextQuestion?.id },
    );
  }
  if (
    ownerIntake.nextQuestion?.requiresMode !== baseline.ownerIntake.nextQuestionMode ||
    ownerIntake.nextQuestion?.tool !== baseline.ownerIntake.nextQuestionTool
  ) {
    add(
      "OPS_OWNER_NEXT_QUESTION_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.nextQuestion",
      "OI-03 必须通过 Plan 模式原生 request_user_input 选择卡",
      {
        expectedMode: baseline.ownerIntake.nextQuestionMode,
        expectedTool: baseline.ownerIntake.nextQuestionTool,
        actualMode: ownerIntake.nextQuestion?.requiresMode,
        actualTool: ownerIntake.nextQuestion?.tool,
      },
    );
  }
  const ownerFacts = Array.isArray(ownerIntake.facts) ? ownerIntake.facts : [];
  const oi03Recorded =
    ownerFacts.some(
      (fact) =>
        fact?.inputId === "OI-03" ||
        fact?.questionId === baseline.ownerIntake.nextQuestionId,
    ) ||
    ownerResponses.some((response) => response?.questionId === baseline.ownerIntake.nextQuestionId);
  if (oi03Recorded) {
    add(
      "OPS_OWNER_OI03_PREMATURELY_RECORDED",
      "project-ops/owner-intake.json.facts",
      "OI-03 尚未通过 Owner 原生选择卡回答",
    );
  }

  const d039Events = model.events.filter(
    (record) =>
      record.value?.type === "GATE_CHANGED" &&
      record.value?.subject?.id === baseline.d039.subjectId,
  );
  if (d039Events.length === 0) {
    add(
      "OPS_D039_GATE_SENTINEL_MISSING",
      "project-ops/events",
      "缺少 D-039 PX-2 权威门禁事件",
    );
  } else if (d039Events.length > 1) {
    add(
      "OPS_D039_GATE_SENTINEL_DUPLICATE",
      "project-ops/events",
      "D-039 PX-2 权威门禁事件必须唯一",
      { eventIds: d039Events.map((record) => record.value?.eventId) },
    );
  }

  if (d039Events.length > 0) {
    const record = d039Events[0];
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    const gateEscalated =
      record.value?.eventId !== baseline.d039.eventId ||
      data.from !== baseline.d039.from ||
      data.to !== baseline.d039.to ||
      data.next !== baseline.d039.next ||
      data.decisionState !== baseline.d039.decisionState;
    if (gateEscalated) {
      add(
        "OPS_D039_GATE_ESCALATED",
        recordPath,
        "D-039 必须保持 PX-2 PASS、等待 Owner 评审的候选状态",
        {
          expected: baseline.d039,
          actual: {
            eventId: record.value?.eventId,
            from: data.from,
            to: data.to,
            next: data.next,
            decisionState: data.decisionState,
          },
        },
      );
    }
    if (data.ownerChoiceRecorded !== baseline.d039.ownerChoiceRecorded) {
      add(
        "OPS_D039_OWNER_CHOICE_PREMATURE",
        `${recordPath}.data.ownerChoiceRecorded`,
        "D-039 尚未记录 Owner A/B/C 选择",
      );
    }
    if (data.formalImplementationAuthorized !== baseline.d039.formalImplementationAuthorized) {
      add(
        "OPS_D039_IMPLEMENTATION_PREMATURE",
        `${recordPath}.data.formalImplementationAuthorized`,
        "D-039 尚未授权正式实现",
      );
    }
    const actualFindings = Array.isArray(data.findingsClosed) ? data.findingsClosed : [];
    if (!arraysEqualAsSets(actualFindings, baseline.d039.findingsClosed)) {
      add(
        "OPS_D039_FINDINGS_SET_MISMATCH",
        `${recordPath}.data.findingsClosed`,
        "D-039 PX-2 必须关闭 D039-QA-001 至 D039-QA-010",
        { expected: baseline.d039.findingsClosed, actual: actualFindings },
      );
    }
  }

  if (decisions.some((decision) => decision?.id === "D-039")) {
    add(
      "OPS_D039_DECISION_REGISTERED_PREMATURELY",
      "project-ops/decisions.json.decisions",
      "D-039 在 PX-3 Owner 选择前不得进入决定台账",
    );
  }

  const d040InitialFeedback = model.events.find(
    (record) => record.value?.eventId === baseline.d040.initialFeedbackEventId,
  );
  if (!d040InitialFeedback) {
    add(
      "OPS_D040_INITIAL_FEEDBACK_MISSING",
      "project-ops/events",
      "缺少 D-040 首轮独立审查回执",
    );
  } else {
    const data = d040InitialFeedback.value?.data ?? {};
    const recordPath = `${d040InitialFeedback.sourceFile}:${d040InitialFeedback.lineNumber}`;
    if (
      d040InitialFeedback.value?.type !== "REVIEW_FEEDBACK" ||
      d040InitialFeedback.value?.correlationId !== baseline.d040.initialCorrelationId ||
      data.reviewerScopedProvisionalState !== baseline.d040.reviewerScopedProvisionalState ||
      data.authoritativeState !== baseline.d040.authoritativeState ||
      data.provisionalStateAcceptedByPm !== baseline.d040.provisionalStateAcceptedByPm
    ) {
      add(
        "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED",
        recordPath,
        "D-040 reviewer 的临时 PX-1 表述必须保留为未被 PM 接受，并规范到 PX-0 输入缺口",
      );
    }
  }

  const d040FinalFeedbackEvents = model.events.filter(
    (record) =>
      record.value?.type === "REVIEW_FEEDBACK" &&
      record.value?.correlationId === baseline.d040.finalCorrelationId &&
      record.value?.actor?.id === baseline.d040.reviewerId,
  );
  if (d040FinalFeedbackEvents.length === 0) {
    add(
      "OPS_D040_FINAL_SENTINEL_MISSING",
      "project-ops/events",
      "缺少 D-040 delta 独立复测最终回执",
    );
  } else if (d040FinalFeedbackEvents.length > 1) {
    add(
      "OPS_D040_FINAL_SENTINEL_DUPLICATE",
      "project-ops/events",
      "D-040 delta 独立复测最终回执必须唯一",
      { eventIds: d040FinalFeedbackEvents.map((record) => record.value?.eventId) },
    );
  }

  if (d040FinalFeedbackEvents.length > 0) {
    const record = d040FinalFeedbackEvents[0];
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    if (
      record.value?.eventId !== baseline.d040.finalFeedbackEventId ||
      data.decisionState !== baseline.d040.decisionState ||
      data.recommendedState !== baseline.d040.recommendedState ||
      data.next !== baseline.d040.next
    ) {
      add(
        "OPS_D040_STATE_ESCALATED",
        recordPath,
        "D-040 必须保持 PX-0 输入缺口并等待公式与特殊人群规则评审",
        {
          expected: {
            eventId: baseline.d040.finalFeedbackEventId,
            decisionState: baseline.d040.decisionState,
            recommendedState: baseline.d040.recommendedState,
            next: baseline.d040.next,
          },
          actual: {
            eventId: record.value?.eventId,
            decisionState: data.decisionState,
            recommendedState: data.recommendedState,
            next: data.next,
          },
        },
      );
    }
    for (const field of [
      "px1Authorized",
      "px2Authorized",
      "ownerReviewAuthorized",
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (data[field] !== baseline.d040[field]) {
        add(
          "OPS_D040_AUTHORIZATION_PREMATURE",
          `${recordPath}.data.${field}`,
          `D-040 ${field} 必须保持 false`,
        );
      }
    }
    if (data.oi03RemainsNext !== baseline.d040.oi03RemainsNext) {
      add(
        "OPS_D040_OI03_ORDER_CHANGED",
        `${recordPath}.data.oi03RemainsNext`,
        "D-040 不得抢占 OI-03 的下一题顺序",
      );
    }
    for (const [group, expected] of [
      ["originalFindings", baseline.d040.originalFindings],
      ["closedFindings", baseline.d040.closedFindings],
    ]) {
      const actual = data[group] ?? {};
      if (actual.P1 !== expected.P1 || actual.P2 !== expected.P2 || actual.P3 !== expected.P3) {
        add(
          "OPS_D040_FINDINGS_MISMATCH",
          `${recordPath}.data.${group}`,
          "D-040 首轮 2/4/1 问题必须完整关闭",
          { expected, actual },
        );
      }
    }
    if (
      data.newFindings !== baseline.d040.newFindings ||
      data.automatedFlowsPassed !== baseline.d040.automatedFlowsPassed
    ) {
      add(
        "OPS_D040_RETEST_EVIDENCE_MISMATCH",
        `${recordPath}.data`,
        "D-040 delta 回执必须保持 0 个新问题和 9 组自动流程",
      );
    }
  }

  if (decisions.some((decision) => decision?.id === "D-040")) {
    add(
      "OPS_D040_DECISION_REGISTERED_PREMATURELY",
      "project-ops/decisions.json.decisions",
      "D-040 在 PX-0 输入关闭和 Owner 选择前不得进入决定台账",
    );
  }
  if (ownerResponses.some((response) => response?.decisionId === "D-040")) {
    add(
      "OPS_D040_OWNER_RESPONSE_PREMATURELY_RECORDED",
      "project-ops/owner-intake.json.responses",
      "D-040 不得抢占当前 Owner intake 或伪造 Owner 响应",
    );
  }

  return {
    ok: diagnostics.length === 0,
    baseline: baseline.id,
    scope: "Project Ops parsing and cross-source operational invariants",
    schemaValidation: "NOT_PERFORMED_USE_AJV_FOR_DRAFT_2020_12",
    counts: {
      schemas: model.schemas.length,
      decisions: decisions.length,
      acceptedDecisions,
      candidateDecisions,
      events: model.events.length,
      messages: model.messages.length,
      resolvedResponses,
      eventCountsByDate,
      agents: agents.length,
      activeAgentIds,
      evidenceItems: model.evidenceRows.length,
      confirmedEvidence: evidenceCounts.confirmed,
      crossSourceEvidence: evidenceCounts.crossSource,
      pendingEvidence: evidenceCounts.pending,
      gapThemes: gapThemeIds.length,
      ownerResponses: ownerResponses.length,
      ownerDecisionIds: ownerDecisionIds.size,
    },
    diagnostics,
  };
}

export function validateProjectOps(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  return validateOperationalInvariants(loadProjectOps(workspaceRoot));
}

function parseArguments(argv) {
  if (argv.length === 0) {
    return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: false };
  }
  if (argv.length === 1 && ["-h", "--help"].includes(argv[0])) {
    return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: true };
  }
  if (argv.length === 2 && argv[0] === "--workspace") {
    return { workspaceRoot: path.resolve(argv[1]), help: false };
  }
  throw new ProjectOpsLoadError(
    "OPS_USAGE_ERROR",
    "command-line",
    "用法: node project-ops/validate.mjs [--workspace <repo-root>]",
  );
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write("用法: node project-ops/validate.mjs [--workspace <repo-root>]\n");
      return 0;
    }

    const report = validateProjectOps(options.workspaceRoot);
    printJson(report, report.ok ? process.stdout : process.stderr);
    return report.ok ? 0 : 1;
  } catch (error) {
    if (error instanceof ProjectOpsLoadError) {
      printJson(
        {
          ok: false,
          error: {
            code: error.code,
            path: error.sourcePath,
            message: error.message,
          },
        },
        process.stderr,
      );
      return 2;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  process.exitCode = runCli();
}
