import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PHASE0_2026_08_11_OI03,
  ProjectOpsLoadError,
  loadProjectOps,
  validateOperationalInvariants,
} from "./validate.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const VALIDATOR_PATH = fileURLToPath(new URL("./validate.mjs", import.meta.url));
const WORKSPACE_ROOT = path.resolve(path.dirname(TEST_PATH), "..");
const VALID_MODEL = loadProjectOps(WORKSPACE_ROOT);

function validateMutation(mutator) {
  const model = structuredClone(VALID_MODEL);
  mutator(model);
  return validateOperationalInvariants(model);
}

function assertDiagnostic(report, code, diagnosticPath = undefined) {
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === code &&
        (diagnosticPath === undefined || diagnostic.path === diagnosticPath),
    ),
    `缺少诊断 ${code}${diagnosticPath ? ` @ ${diagnosticPath}` : ""}: ${JSON.stringify(report.diagnostics, null, 2)}`,
  );
}

function findD039Gate(model) {
  return model.events.find(
    (record) =>
      record.value.type === "GATE_CHANGED" && record.value.subject?.id === "D-039-PX-2",
  );
}

function findD040InitialFeedback(model) {
  return model.events.find(
    (record) => record.value.eventId === "EVT-20260806-002",
  );
}

function findD040FinalFeedback(model) {
  return model.events.find(
    (record) => record.value.eventId === "EVT-20260806-005",
  );
}

function findEvent(model, eventId) {
  return model.events.find((record) => record.value.eventId === eventId);
}

function copyValidationFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-project-ops-"));
  fs.cpSync(path.join(WORKSPACE_ROOT, "project-ops"), path.join(tempRoot, "project-ops"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(tempRoot, "docs", "01-research"), { recursive: true });
  fs.copyFileSync(
    path.join(WORKSPACE_ROOT, "docs", "01-research", "competitor-evidence-matrix.md"),
    path.join(tempRoot, "docs", "01-research", "competitor-evidence-matrix.md"),
  );
  fs.copyFileSync(
    path.join(WORKSPACE_ROOT, "docs", "01-research", "public-evidence-gaps.md"),
    path.join(tempRoot, "docs", "01-research", "public-evidence-gaps.md"),
  );
  return tempRoot;
}

test("当前 Phase 0 Project Ops 基线通过", () => {
  const report = validateOperationalInvariants(VALID_MODEL);

  assert.equal(report.ok, true);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.baseline, PHASE0_2026_08_11_OI03.id);
  assert.equal(report.counts.schemas, 4);
  assert.equal(report.counts.decisions, 31);
  assert.equal(report.counts.events, 111);
  assert.equal(report.counts.messages, 114);
  assert.equal(report.counts.resolvedResponses, 71);
  assert.equal(report.counts.evidenceItems, 66);
  assert.deepEqual(report.counts.activeAgentIds, ["root"]);
  assert.equal(report.counts.agents, 25);
});

test("拒绝重复 ID、事件断号、日期错配和悬空回复", async (t) => {
  await t.test("重复 eventId", () => {
    const report = validateMutation((model) => {
      model.events[1].value.eventId = model.events[0].value.eventId;
    });
    assertDiagnostic(report, "OPS_DUP_EVENT_ID", "project-ops/events");
  });

  await t.test("重复 messageId", () => {
    const report = validateMutation((model) => {
      model.messages[1].value.messageId = model.messages[0].value.messageId;
    });
    assertDiagnostic(report, "OPS_DUP_MESSAGE_ID", "project-ops/messages");
  });

  await t.test("事件断号", () => {
    const report = validateMutation((model) => {
      const index = model.events.findIndex(
        (record) => record.value.eventId === "EVT-20260805-003",
      );
      model.events.splice(index, 1);
    });
    assertDiagnostic(report, "OPS_EVENT_SEQUENCE_GAP");
  });

  await t.test("文件日期前缀错配", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260805-001",
      );
      record.value.eventId = "EVT-20260803-001";
    });
    assertDiagnostic(report, "OPS_EVENT_FILE_PREFIX_MISMATCH");
  });

  await t.test("recordedAt 日期错配", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260805-001",
      );
      record.value.recordedAt = "2026-08-04T20:08:13+08:00";
    });
    assertDiagnostic(report, "OPS_EVENT_RECORDED_DATE_MISMATCH");
  });

  await t.test("保持总数但把历史事件迁到新日期", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260731-059",
      );
      record.fileName = "2026-08-07.jsonl";
      record.sourceFile = "project-ops/events/2026-08-07.jsonl";
      record.lineNumber = 1;
      record.value.eventId = "EVT-20260807-001";
      record.value.recordedAt = "2026-08-07T09:00:00+08:00";
    });
    assertDiagnostic(report, "OPS_EVENT_DAY_SET_MISMATCH", "project-ops/events");
    assertDiagnostic(
      report,
      "OPS_EVENT_DAY_COUNT_MISMATCH",
      "project-ops/events/2026-07-31.jsonl",
    );
  });

  await t.test("悬空 responseTo", () => {
    const report = validateMutation((model) => {
      const record = model.messages.find((candidate) => candidate.value.responseTo);
      record.value.responseTo = "MSG-20990101-999";
    });
    assertDiagnostic(report, "OPS_DANGLING_RESPONSE_TO");
  });
});

test("拒绝快照计数漂移与活跃角色集合漂移", async (t) => {
  await t.test("事件计数漂移", () => {
    const report = validateMutation((model) => {
      model.snapshot.metrics.projectEvents += 1;
    });
    assertDiagnostic(
      report,
      "OPS_SNAPSHOT_METRIC_MISMATCH",
      "project-ops/snapshots/current.json.metrics.projectEvents",
    );
  });

  await t.test("唯一 active 不再是 root", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id === "root").state = "completed";
      model.snapshot.agents.find((agent) => agent.id !== "root").state = "active";
    });
    assertDiagnostic(
      report,
      "OPS_ACTIVE_AGENT_SET_MISMATCH",
      "project-ops/snapshots/current.json.agents",
    );
  });

  await t.test("出现多个 active", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id !== "root").state = "active";
    });
    assertDiagnostic(report, "OPS_ACTIVE_AGENT_SET_MISMATCH");
  });

  await t.test("inactive Agent ID 重复", () => {
    const report = validateMutation((model) => {
      const inactive = model.snapshot.agents.filter((agent) => agent.id !== "root");
      inactive[1].id = inactive[0].id;
    });
    assertDiagnostic(
      report,
      "OPS_DUP_AGENT_ID",
      "project-ops/snapshots/current.json.agents",
    );
  });

  await t.test("inactive Agent ID 为空", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id !== "root").id = "";
    });
    assertDiagnostic(report, "OPS_INVALID_AGENT_ID");
  });
});

test("拒绝 Owner intake 被提前关闭或改换选择渠道", async (t) => {
  await t.test("批次误关闭", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.status = "CONFIRMED";
    });
    assertDiagnostic(report, "OPS_OWNER_BATCH_PREMATURELY_CLOSED");
  });

  await t.test("accepted 状态提前改变", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.acceptanceStateChanged = true;
    });
    assertDiagnostic(report, "OPS_OWNER_ACCEPTANCE_STATE_CHANGED");
  });

  await t.test("单项 response 提前终态", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses[0].state = "ACCEPTED";
    });
    assertDiagnostic(report, "OPS_OWNER_RESPONSE_FINALIZED");
  });

  await t.test("OI-03 完成后下一题偏离 OI-02", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.nextQuestion.id = "oi04_other";
    });
    assertDiagnostic(report, "OPS_OWNER_NEXT_QUESTION_CHANGED");
  });

  await t.test("OI-02 不再使用原生 choice-ui", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.nextQuestion.tool = "static_web_form";
    });
    assertDiagnostic(report, "OPS_OWNER_NEXT_QUESTION_CHANNEL_CHANGED");
  });

  await t.test("顶层 Owner intake 渠道不再是原生选择卡", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.channel = "STATIC_WEB_FORM";
    });
    assertDiagnostic(report, "OPS_OWNER_CHANNEL_CHANGED");
  });

  await t.test("OI-03 事实缺失", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.facts = model.ownerIntake.facts.filter(
        (fact) => fact.inputId !== "OI-03",
      );
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_MISSING");
  });

  await t.test("OI-03 事实重复", () => {
    const report = validateMutation((model) => {
      const fact = model.ownerIntake.facts.find((candidate) => candidate.inputId === "OI-03");
      model.ownerIntake.facts.push(structuredClone(fact));
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_DUPLICATE");
  });

  await t.test("OI-03 事实伪造 Mac 可用", () => {
    const report = validateMutation((model) => {
      const fact = model.ownerIntake.facts.find((candidate) => candidate.inputId === "OI-03");
      fact.macAvailability = "AVAILABLE";
      fact.nativeIosWorkAuthorized = true;
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_MISMATCH");
  });

  await t.test("OI-03 被错误写入决定 responses", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses.push({
        questionId: "oi03_device_availability",
        decisionId: "D-048",
        optionKey: "iphone_only",
        optionLabel: "只有 iPhone",
        state: "PENDING_BATCH_READBACK",
      });
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_RECORDED_AS_DECISION");
  });

  await t.test("12 项候选中的 D-038 被 D-999 替换", () => {
    const report = validateMutation((model) => {
      const response = model.ownerIntake.responses.find(
        (candidate) => candidate.decisionId === "D-038",
      );
      response.decisionId = "D-999";
    });
    assertDiagnostic(report, "OPS_OWNER_DECISION_SET_MISMATCH");
    assertDiagnostic(report, "OPS_OWNER_DECISION_NOT_CANDIDATE");
  });

  await t.test("D-047 A 到 C 的审计顺序被改写", () => {
    const report = validateMutation((model) => {
      const responses = model.ownerIntake.responses.filter(
        (response) => response.decisionId === "D-047",
      );
      responses[1].optionKey = "A";
    });
    assertDiagnostic(report, "OPS_OWNER_D047_AUDIT_TRAIL_CHANGED");
  });
});

test("拒绝 D-039 在 PX-3 Owner 选择前越级", async (t) => {
  await t.test("提前记录 Owner 选择", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.ownerChoiceRecorded = true;
    });
    assertDiagnostic(report, "OPS_D039_OWNER_CHOICE_PREMATURE");
  });

  await t.test("提前授权正式实现", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_IMPLEMENTATION_PREMATURE");
  });

  await t.test("门禁状态越级", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.next = "IMPLEMENTATION_READY";
    });
    assertDiagnostic(report, "OPS_D039_GATE_ESCALATED");
  });

  await t.test("提前进入决定台账", () => {
    const report = validateMutation((model) => {
      model.decisionRegister.decisions.push({
        id: "D-039",
        status: "CANDIDATE",
      });
    });
    assertDiagnostic(report, "OPS_D039_DECISION_REGISTERED_PREMATURELY");
  });

  await t.test("权威门禁事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.subject?.id !== "D-039-PX-2",
      );
    });
    assertDiagnostic(report, "OPS_D039_GATE_SENTINEL_MISSING");
  });

  await t.test("权威门禁事件重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findD039Gate(model));
      duplicate.value.eventId = "EVT-20260805-006";
      duplicate.lineNumber = 6;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D039_GATE_SENTINEL_DUPLICATE");
  });

  await t.test("QA 关闭集合不完整", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.findingsClosed.pop();
    });
    assertDiagnostic(report, "OPS_D039_FINDINGS_SET_MISMATCH");
  });
});

test("拒绝 D-040 在 PX-0 输入关闭前越级或改写审计事实", async (t) => {
  await t.test("首轮 reviewer 临时 PX-1 被误记为 PM 接受", () => {
    const report = validateMutation((model) => {
      findD040InitialFeedback(model).value.data.provisionalStateAcceptedByPm = true;
    });
    assertDiagnostic(report, "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED");
  });

  await t.test("首轮权威状态被误升为 PX-1", () => {
    const report = validateMutation((model) => {
      findD040InitialFeedback(model).value.data.authoritativeState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED");
  });

  await t.test("首轮审查回执缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-002",
      );
    });
    assertDiagnostic(report, "OPS_D040_INITIAL_FEEDBACK_MISSING");
  });

  await t.test("delta 最终回执缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-005",
      );
    });
    assertDiagnostic(report, "OPS_D040_FINAL_SENTINEL_MISSING");
  });

  await t.test("delta 最终回执重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findD040FinalFeedback(model));
      duplicate.value.eventId = "EVT-20260806-006";
      duplicate.lineNumber = 6;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D040_FINAL_SENTINEL_DUPLICATE");
  });

  await t.test("状态越级到 PX-1", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.recommendedState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_STATE_ESCALATED");
  });

  for (const field of [
    "px1Authorized",
    "px2Authorized",
    "ownerReviewAuthorized",
    "ownerChoiceRecorded",
    "decisionAcceptedRecorded",
    "formalImplementationAuthorized",
  ]) {
    await t.test(`${field} 被提前设为 true`, () => {
      const report = validateMutation((model) => {
        findD040FinalFeedback(model).value.data[field] = true;
      });
      assertDiagnostic(
        report,
        "OPS_D040_AUTHORIZATION_PREMATURE",
        `project-ops/events/2026-08-06.jsonl:5.data.${field}`,
      );
    });
  }

  await t.test("D-040 抢占 OI-03 顺序", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.oi03RemainsNext = false;
    });
    assertDiagnostic(report, "OPS_D040_OI03_ORDER_CHANGED");
  });

  await t.test("首轮问题关闭集合不完整", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.closedFindings.P2 = 3;
    });
    assertDiagnostic(report, "OPS_D040_FINDINGS_MISMATCH");
  });

  await t.test("提前进入决定台账", () => {
    const report = validateMutation((model) => {
      model.decisionRegister.decisions.push({ id: "D-040", status: "CANDIDATE" });
    });
    assertDiagnostic(report, "OPS_D040_DECISION_REGISTERED_PREMATURELY");
  });

  await t.test("提前写入 Owner intake", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses.push({ decisionId: "D-040" });
    });
    assertDiagnostic(report, "OPS_D040_OWNER_RESPONSE_PREMATURELY_RECORDED");
  });
});

test("拒绝改写 D-040 输入研究、独立审查与 Owner 门禁归档", async (t) => {
  await t.test("公式首轮 0/2/1 findings 漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-015").value.data.findings.P2 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("公式审查回执接收方被改写", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-015").value.subject.id = "owner";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("公式最终 remaining 不再为 0/0/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-019").value.data.remainingFindings.P3 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("治理首轮 0/4/1 findings 漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-017").value.data.findings.P3 = 0;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("治理中间轮 remaining 不再为 0/4/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-021").value.data.remainingFindings.P2 = 3;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("治理最终 remaining 不再为 0/0/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-023").value.data.remainingFindings.P2 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("17 个草案问题被提前分配权威 ID", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.draftQuestionIdsAllocated = true;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_DRAFT_QUESTIONS_CHANGED");
  });

  await t.test("研究工件状态越级", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.authoritativeState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_STATE_ESCALATED");
  });

  await t.test("研究工件创建者被改写", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.actor.id = "ops_verifier";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_ENVELOPE_MISMATCH");
  });

  await t.test("研究工件提前授权 Owner 评审", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_AUTHORIZATION_PREMATURE");
  });

  await t.test("研究工件抢占 OI-03", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.oi03RemainsNext = false;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_OI03_ORDER_CHANGED");
  });

  await t.test("研究工件提交证据漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.lineCount = 390;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_EVIDENCE_MISMATCH");
  });

  await t.test("研究工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-024",
      );
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_MISSING");
  });

  await t.test("研究工件事件重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findEvent(model, "EVT-20260806-024"));
      duplicate.value.eventId = "EVT-20260806-025";
      duplicate.lineNumber = 25;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_DUPLICATE");
  });
});

test("CLI 对通过、一致性失败和 JSONL 解析失败使用稳定退出码", () => {
  const valid = spawnSync(process.execPath, [VALIDATOR_PATH, "--workspace", WORKSPACE_ROOT], {
    encoding: "utf8",
  });
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).ok, true);

  const inconsistentRoot = copyValidationFixture();
  const malformedRoot = copyValidationFixture();
  try {
    const snapshotPath = path.join(inconsistentRoot, "project-ops", "snapshots", "current.json");
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    snapshot.metrics.projectEvents += 1;
    fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    const inconsistent = spawnSync(
      process.execPath,
      [VALIDATOR_PATH, "--workspace", inconsistentRoot],
      { encoding: "utf8" },
    );
    assert.equal(inconsistent.status, 1, inconsistent.stdout);
    assert.equal(JSON.parse(inconsistent.stderr).ok, false);

    const messagePath = path.join(
      malformedRoot,
      "project-ops",
      "messages",
      "project-manager.jsonl",
    );
    fs.appendFileSync(messagePath, "{not-json}\n", "utf8");
    const malformed = spawnSync(
      process.execPath,
      [VALIDATOR_PATH, "--workspace", malformedRoot],
      { encoding: "utf8" },
    );
    assert.equal(malformed.status, 2, malformed.stdout);
    assert.equal(JSON.parse(malformed.stderr).error.code, "OPS_JSONL_PARSE_ERROR");
  } finally {
    fs.rmSync(inconsistentRoot, { recursive: true, force: true });
    fs.rmSync(malformedRoot, { recursive: true, force: true });
  }
});

test("loader 将 JSON 解析错误标记为读取失败而非一致性失败", () => {
  const tempRoot = copyValidationFixture();
  try {
    fs.writeFileSync(path.join(tempRoot, "project-ops", "owner-intake.json"), "{bad-json}\n");
    assert.throws(
      () => loadProjectOps(tempRoot),
      (error) =>
        error instanceof ProjectOpsLoadError && error.code === "OPS_JSON_PARSE_ERROR",
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("loader 拒绝 JSONL 中间空行", () => {
  const tempRoot = copyValidationFixture();
  try {
    const messagePath = path.join(
      tempRoot,
      "project-ops",
      "messages",
      "project-manager.jsonl",
    );
    fs.appendFileSync(messagePath, "\n{}\n", "utf8");
    assert.throws(
      () => loadProjectOps(tempRoot),
      (error) =>
        error instanceof ProjectOpsLoadError && error.code === "OPS_JSONL_EMPTY_LINE",
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
