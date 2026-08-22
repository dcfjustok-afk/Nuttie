import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY,
  CONTRACT_ID,
  FORMAL_RECORD_KIND,
  INPUT_SCHEMA_VERSION,
  INTAKE_PACKET_ID,
  RESULT_SCHEMA_VERSION,
  REVIEW_DOMAINS,
  REVIEW_PACKET_IDENTITY,
  SYNTHETIC_RECORD_KIND,
  computeAssignmentContentSha256,
  evaluateMvpIncrementScopeReviewerAssignment,
  normalizeMvpIncrementScopeReviewerAssignment,
  validateMvpIncrementScopeReviewerAssignmentResult,
} from "./mvp-increment-scope-reviewer-assignment-harness.mjs";

function clone(value) {
  return structuredClone(value);
}

function withDigest(input) {
  delete input.assignmentContentSha256;
  input.assignmentContentSha256 = computeAssignmentContentSha256(input);
  return input;
}

function makeSyntheticFixture() {
  const reviewer = {
    candidateId: "MVP-SCOPE-SYNTHETIC-C001",
    reviewerName: "Example Reviewer One",
    controlledContactRef: "urn:nuttie.example.test:contact:reviewer-one",
    proposedReviewDomains: [...REVIEW_DOMAINS],
    competenceEvidenceByDomain: REVIEW_DOMAINS.map((reviewDomain, index) => ({
      reviewDomain,
      evidenceRefs: [`urn:nuttie.example.test:competence:${index + 1}`],
      verificationState: "VERIFIED",
      verifiedByName: `Example Competence Verifier ${index + 1}`,
      verificationRef: `urn:nuttie.example.test:verification:competence:${index + 1}`,
      verifiedAt: `2026-08-22T21:${String(10 + index).padStart(2, "0")}:00+08:00`,
    })),
    participatedInDrafting: false,
    draftingArtifactRefs: [],
    identityVerification: {
      state: "VERIFIED",
      verifiedByName: "Example Identity Verifier",
      verificationRef: "urn:nuttie.example.test:verification:identity:one",
      verifiedAt: "2026-08-22T21:20:00+08:00",
    },
    conflictOfInterest: {
      state: "NONE_DECLARED",
      disclosureRef: "urn:nuttie.example.test:disclosure:conflict:one",
      resolutionRef: null,
    },
    packetAccepted: {
      packetId: REVIEW_PACKET_IDENTITY.packetId,
      packetVersion: REVIEW_PACKET_IDENTITY.packetVersion,
      acceptedAt: "2026-08-22T22:00:00+08:00",
    },
    expectedReviewDueAt: "2026-08-29T22:00:00+08:00",
    signatureMethod: "VERIFIED_WORKFLOW_REFERENCE",
    signatureReferencePlanned: "urn:nuttie.example.test:signature-plan:one",
    externalContactAuthorizationRef: "urn:nuttie.example.test:authorization:contact:one",
    assignmentAcceptedAt: "2026-08-22T22:05:00+08:00",
  };
  return withDigest({
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind: SYNTHETIC_RECORD_KIND,
    assignmentId: "MVP-SCOPE-SYNTHETIC-A001",
    intakePacketId: INTAKE_PACKET_ID,
    reviewPacketIdentity: clone(REVIEW_PACKET_IDENTITY),
    reviewers: [reviewer],
    domainCoverage: REVIEW_DOMAINS.map((reviewDomain) => ({
      reviewDomain,
      candidateIds: [reviewer.candidateId],
    })),
    externalContactAuthorized: true,
    externalContactAuthorizationRef: "urn:nuttie.example.test:authorization:contact:bundle",
    assignedByName: "Example Assignment Coordinator",
    assignedAt: "2026-08-22T22:10:00+08:00",
    assignmentEvidenceRefs: ["urn:nuttie.example.test:assignment:evidence:one"],
    reviewCanStart: true,
    containsCredential: false,
    containsIdentityDocument: false,
    containsPrivateContact: false,
    containsSignatureMaterial: false,
  });
}

function mutateFixture(mutator, { rehash = true } = {}) {
  const input = makeSyntheticFixture();
  mutator(input);
  return rehash ? withDigest(input) : input;
}

function captureError(action) {
  try {
    action();
  } catch (error) {
    return error;
  }
  assert.fail("expected action to throw");
}

test("完整合成五域指派只覆盖算法且现实授权全部保持关闭", () => {
  const input = makeSyntheticFixture();
  const result = evaluateMvpIncrementScopeReviewerAssignment(input);
  assert.equal(result.schemaVersion, RESULT_SCHEMA_VERSION);
  assert.equal(result.contractId, CONTRACT_ID);
  assert.equal(result.disposition, "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY");
  assert.equal(result.reviewerCount, 1);
  assert.equal(result.requiredReviewerDomainCount, 5);
  assert.equal(result.coveredReviewerDomainCount, 5);
  assert.equal(result.completeReviewerCount, 1);
  assert.equal(result.incompleteReviewerCount, 0);
  assert.equal(result.structurallyReady, true);
  assert.equal(result.reviewerAssignmentReadyCandidate, false);
  assert.equal(result.syntheticWouldBeAssignmentReadyCandidate, true);
  assert.equal(result.reviewersAssignedReturned, false);
  assert.equal(result.reviewCanStartReturned, false);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.equal(result.boundary.formalAssignmentRecordCount, 0);
  assert.equal(result.boundary.externalMessagesSent, 0);
  assert.equal(result.boundary.reviewersAssigned, false);
  assert.equal(result.boundary.crossRoleReviewStarted, false);
  assert.equal(result.boundary.crossRoleReviewPassed, false);
  assert.equal(result.boundary.ownerChoiceRecorded, false);
  assert.equal(result.boundary.g2Passed, false);
  assert.equal(result.boundary.formalImplementationAuthorized, false);
  assert.match(result.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
});

test("正式记录拒绝合成 identity 与 example.test 引用", () => {
  const input = mutateFixture((draft) => {
    draft.recordKind = FORMAL_RECORD_KIND;
    draft.assignmentId = "MVP-SCOPE-ASSIGNMENT-A001";
    draft.reviewers[0].candidateId = "MVP-SCOPE-REVIEWER-C001";
    for (const coverage of draft.domainCoverage) coverage.candidateIds = ["MVP-SCOPE-REVIEWER-C001"];
  });
  assert.throws(
    () => normalizeMvpIncrementScopeReviewerAssignment(input),
    /synthetic identity|synthetic reference/,
  );
});

test("PENDING 身份产生 ASSIGNMENT_INCOMPLETE 而不形成指派候选", () => {
  const input = mutateFixture((draft) => {
    draft.reviewers[0].identityVerification = {
      state: "PENDING",
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    };
    draft.reviewCanStart = false;
  });
  const result = evaluateMvpIncrementScopeReviewerAssignment(input);
  assert.equal(result.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(result.completeReviewerCount, 0);
  assert.equal(result.coveredReviewerDomainCount, 0);
  assert.equal(result.reviewerAssignmentReadyCandidate, false);
  assert.equal(result.syntheticWouldBeAssignmentReadyCandidate, false);
  assert.equal(result.reviewCanStartReturned, false);
});

test("顶层字段缺失、额外字段和 record kind 漂移时失败关闭", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    delete draft.assignedAt;
  })), /assignedAt is required/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.unexpected = false;
  })), /unexpected is unsupported/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.recordKind = "ASSIGNED";
  })), /unsupported recordKind/);
});

test("冻结 packet 身份任一漂移都被拒绝", () => {
  for (const [field, value] of [
    ["packetVersion", "PACKET-002-R1"],
    ["inputManifestEventId", "EVT-20260822-999"],
    ["packetArtifactCommit", "0".repeat(40)],
    ["packetArtifactBlobOid", "1".repeat(40)],
    ["packetArtifactSha256", "2".repeat(64)],
  ]) {
    const input = mutateFixture((draft) => { draft.reviewPacketIdentity[field] = value; });
    assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(input), /frozen packet/);
  }
});

test("candidate ID、角色名和重复身份不能冒充具名复核人", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].candidateId = "MVP-SCOPE-REVIEWER-C001";
    for (const coverage of draft.domainCoverage) coverage.candidateIds = [draft.reviewers[0].candidateId];
  })), /wrong record-kind prefix/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].reviewerName = "QA";
  })), /role or agent name/);
  const duplicate = mutateFixture((draft) => {
    draft.reviewers.push(clone(draft.reviewers[0]));
    for (const coverage of draft.domainCoverage) coverage.candidateIds.push(draft.reviewers[0].candidateId);
  });
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(duplicate), /duplicate candidate IDs/);
});

test("候选人的复核域必须去重并使用固定顺序", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].proposedReviewDomains.reverse();
    draft.reviewers[0].competenceEvidenceByDomain.reverse();
  })), /fixed domain order/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].proposedReviewDomains[1] = draft.reviewers[0].proposedReviewDomains[0];
    draft.reviewers[0].competenceEvidenceByDomain[1].reviewDomain = draft.reviewers[0].proposedReviewDomains[0];
  })), /duplicates/);
});

test("逐域胜任记录必须与声明域一一对应且 PENDING 不得夹带证据", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].competenceEvidenceByDomain[0].reviewDomain = "QA_TRACEABILITY";
  })), /match proposed domain order/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    const competence = draft.reviewers[0].competenceEvidenceByDomain[0];
    competence.verificationState = "PENDING";
    competence.verifiedByName = null;
    competence.verificationRef = null;
    competence.verifiedAt = null;
  })), /PENDING metadata must be empty or null/);
});

test("身份和胜任核验拒绝自核验与伪造的 PENDING 元数据", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].identityVerification.verifiedByName = draft.reviewers[0].reviewerName;
  })), /self-verified/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    const identity = draft.reviewers[0].identityVerification;
    identity.state = "PENDING";
  })), /PENDING metadata must be null/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].competenceEvidenceByDomain[1].verifiedByName = draft.reviewers[0].reviewerName;
  })), /self-verified/);
});

test("利益冲突状态与 resolution 引用必须一致", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].conflictOfInterest.state = "OPEN";
    draft.reviewers[0].conflictOfInterest.resolutionRef = "urn:nuttie.example.test:conflict:resolution";
  })), /must exist only for RESOLVED/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].conflictOfInterest.state = "RESOLVED";
  })), /must exist only for RESOLVED/);
});

test("参与起草的候选人不计入任何域覆盖", () => {
  const input = mutateFixture((draft) => {
    draft.reviewers[0].participatedInDrafting = true;
    draft.reviewers[0].draftingArtifactRefs = ["urn:nuttie.example.test:artifact:draft:one"];
    draft.reviewCanStart = false;
  });
  const result = evaluateMvpIncrementScopeReviewerAssignment(input);
  assert.equal(result.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(result.completeReviewerCount, 0);
  assert.equal(result.coveredReviewerDomainCount, 0);
  assert.equal(result.reviewersAssignedReturned, false);
});

test("五域覆盖矩阵拒绝顺序漂移、未知 candidate 和单向声明", () => {
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    [draft.domainCoverage[0], draft.domainCoverage[1]] = [draft.domainCoverage[1], draft.domainCoverage[0]];
  })), /fixed order/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.domainCoverage[2].candidateIds = ["MVP-SCOPE-SYNTHETIC-C999"];
  })), /exactly match candidate declarations/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].proposedReviewDomains.pop();
    draft.reviewers[0].competenceEvidenceByDomain.pop();
  })), /exactly match candidate declarations|candidateIds must be non-empty/);
});

test("未授权联络或缺少 assignment evidence 只能保持 incomplete", () => {
  const unauthorized = mutateFixture((draft) => {
    draft.externalContactAuthorized = false;
    draft.externalContactAuthorizationRef = null;
    draft.reviewers[0].externalContactAuthorizationRef = null;
    draft.reviewCanStart = false;
  });
  const unauthorizedResult = evaluateMvpIncrementScopeReviewerAssignment(unauthorized);
  assert.equal(unauthorizedResult.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(unauthorizedResult.reviewersAssignedReturned, false);

  const noEvidence = mutateFixture((draft) => {
    draft.assignmentEvidenceRefs = [];
    draft.reviewCanStart = false;
  });
  const noEvidenceResult = evaluateMvpIncrementScopeReviewerAssignment(noEvidence);
  assert.equal(noEvidenceResult.completeReviewerCount, 1);
  assert.equal(noEvidenceResult.coveredReviewerDomainCount, 5);
  assert.equal(noEvidenceResult.disposition, "ASSIGNMENT_INCOMPLETE");

  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.externalContactAuthorized = false;
  })), /flag and reference must match/);
});

test("packet 接受、指派、截止时间与签署计划失败关闭", () => {
  const lateAssignment = mutateFixture((draft) => {
    draft.reviewers[0].expectedReviewDueAt = "2026-08-22T22:09:59+08:00";
    draft.reviewCanStart = false;
  });
  const lateResult = evaluateMvpIncrementScopeReviewerAssignment(lateAssignment);
  assert.equal(lateResult.completeReviewerCount, 0);
  assert.equal(lateResult.disposition, "ASSIGNMENT_INCOMPLETE");

  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].signatureReferencePlanned = null;
  })), /both null or both present/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].packetAccepted.packetVersion = "PACKET-002-R1";
  })), /bind the frozen packet/);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.reviewers[0].packetAccepted.acceptedAt = "2026-02-30T22:00:00+08:00";
  })), /RFC 3339 timestamp/);
});

test("reviewCanStart 必须由 validator 重算，调用方不能伪造", () => {
  const forged = mutateFixture((draft) => {
    draft.reviewers[0].identityVerification = {
      state: "PENDING",
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    };
  });
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(forged), /does not match recomputed/);
});

test("assignmentContentSha256 绑定删除自身后的完整 bundle", () => {
  const input = makeSyntheticFixture();
  assert.equal(input.assignmentContentSha256, computeAssignmentContentSha256(input));
  input.assignedAt = "2026-08-22T22:11:00+08:00";
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(input), /does not match the canonical bundle/);
  const malformed = makeSyntheticFixture();
  malformed.assignmentContentSha256 = "A".repeat(64);
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(malformed), /lowercase SHA-256/);
});

test("敏感字段名和值在解析前拒绝且错误不回显原值", () => {
  const email = "private.person@example.com";
  const emailInput = makeSyntheticFixture();
  emailInput.reviewers[0].email = email;
  const fieldError = captureError(() => normalizeMvpIncrementScopeReviewerAssignment(emailInput));
  assert.equal(fieldError.code, "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(fieldError.message, new RegExp(email.replace(".", "\\.")));

  const secret = "Bearer top-secret-token-value";
  const valueInput = makeSyntheticFixture();
  valueInput.reviewers[0].controlledContactRef = secret;
  const valueError = captureError(() => normalizeMvpIncrementScopeReviewerAssignment(valueInput));
  assert.equal(valueError.code, "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(valueError.message, /top-secret-token-value/);

  const phoneInput = makeSyntheticFixture();
  phoneInput.reviewers[0].controlledContactRef = "tel:+8613812345678";
  const phoneError = captureError(() => normalizeMvpIncrementScopeReviewerAssignment(phoneInput));
  assert.equal(phoneError.code, "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(phoneError.message, /13812345678/);

  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mutateFixture((draft) => {
    draft.containsIdentityDocument = true;
  })), (error) => error.code === "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT");
});

test("特殊对象、accessor、cycle、超长字符串和 reviewer 上限都被拒绝", () => {
  const mapInput = makeSyntheticFixture();
  mapInput.reviewPacketIdentity = new Map();
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(mapInput), /plain records/);

  const accessorInput = makeSyntheticFixture();
  Object.defineProperty(accessorInput, "assignedByName", {
    enumerable: true,
    get() { return "Example Accessor"; },
  });
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(accessorInput), /non-data properties/);

  const cycleInput = makeSyntheticFixture();
  cycleInput.loop = cycleInput;
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(cycleInput), /cycle/);

  const longInput = makeSyntheticFixture();
  longInput.reviewers[0].controlledContactRef = `urn:nuttie.example.test:${"x".repeat(600)}`;
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(longInput), /resource limits/);

  const crowded = makeSyntheticFixture();
  crowded.reviewers = Array.from({ length: 21 }, () => clone(crowded.reviewers[0]));
  assert.throws(() => normalizeMvpIncrementScopeReviewerAssignment(crowded), /one to twenty candidates/);
});

test("规范化与结果深冻结，伪造结果或指纹无法通过重建", () => {
  const input = makeSyntheticFixture();
  const normalized = normalizeMvpIncrementScopeReviewerAssignment(input);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.reviewers), true);
  assert.equal(Object.isFrozen(normalized.reviewers[0].identityVerification), true);
  assert.throws(() => { normalized.reviewCanStart = false; }, TypeError);

  const result = evaluateMvpIncrementScopeReviewerAssignment(input);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(validateMvpIncrementScopeReviewerAssignmentResult(result, input), result);
  const forged = clone(result);
  forged.reviewerAssignmentReadyCandidate = true;
  forged.reviewersAssignedReturned = true;
  forged.boundary.reviewersAssigned = true;
  forged.resultFingerprint = "f".repeat(64);
  assert.throws(() => validateMvpIncrementScopeReviewerAssignmentResult(forged, input), /changed/);
});

test("源码审计固定无 Git、文件、联系人、签署、网络、消息或业务副作用", () => {
  const sourcePath = fileURLToPath(new URL("./mvp-increment-scope-reviewer-assignment-harness.mjs", import.meta.url));
  const source = readFileSync(sourcePath, "utf8");
  assert.doesNotMatch(source, /from\s+["']node:(?:fs|http|https|net|tls|child_process)["']/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\bprocess\.env\b/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|unlink|rename|mkdir|rmdir)\s*\(/);
  assert.equal(BOUNDARY.gitReads, 0);
  assert.equal(BOUNDARY.fileReads, 0);
  assert.equal(BOUNDARY.fileWrites, 0);
  assert.equal(BOUNDARY.contactRecordReads, 0);
  assert.equal(BOUNDARY.signatureArtifactReads, 0);
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.externalMessagesSent, 0);
  assert.equal(BOUNDARY.businessWrites, 0);
});
