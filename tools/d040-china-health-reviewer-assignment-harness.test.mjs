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
  COMPETENCE_SCOPES,
  REVIEW_PACKET_IDENTITY,
  SYNTHETIC_RECORD_KIND,
  computeAssignmentContentSha256,
  evaluateD040ChinaHealthReviewerAssignment,
  normalizeD040ChinaHealthReviewerAssignment,
  validateD040ChinaHealthReviewerAssignmentResult,
} from "./d040-china-health-reviewer-assignment-harness.mjs";

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
    candidateId: "D040-CHINA-HEALTH-SYNTHETIC-C001",
    reviewerName: "Example Reviewer One",
    controlledContactRef: "urn:nuttie.example.test:contact:reviewer-one",
    qualificationType: "Example Clinical Nutrition Qualification",
    qualificationIssuer: "Example Health Registry",
    qualificationReference: "urn:nuttie.example.test:qualification:reviewer-one",
    competenceScopeIds: [...COMPETENCE_SCOPES],
    competenceVerificationByScope: COMPETENCE_SCOPES.map((competenceScopeId, index) => ({
      competenceScopeId,
      evidenceRefs: [`urn:nuttie.example.test:competence:${index + 1}`],
      state: "VERIFIED",
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
    qualificationVerification: {
      state: "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
      verifiedByName: "Example Qualification Verifier",
      verificationRef: "urn:nuttie.example.test:verification:qualification:one",
      verifiedAt: "2026-08-22T21:25:00+08:00",
      qualificationObservedValidAt: "2026-08-22T21:24:00+08:00",
    },
    localeAndRegionFit: {
      state: "PASS",
      rationaleRef: "urn:nuttie.example.test:locale:zh-hans-cn:one",
      verifiedByName: "Example Locale Verifier",
      verificationRef: "urn:nuttie.example.test:verification:locale:one",
      verifiedAt: "2026-08-22T21:30:00+08:00",
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
    assignmentId: "D040-CHINA-HEALTH-SYNTHETIC-A001",
    intakePacketId: INTAKE_PACKET_ID,
    reviewPacketIdentity: clone(REVIEW_PACKET_IDENTITY),
    reviewerCandidates: [reviewer],
    selectedCandidateId: reviewer.candidateId,
    requiredScopeCoverage: COMPETENCE_SCOPES.map((competenceScopeId) => ({
      competenceScopeId,
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

function makeFormalFixture() {
  const input = makeSyntheticFixture();
  input.recordKind = FORMAL_RECORD_KIND;
  input.assignmentId = "D040-CHINA-HEALTH-ASSIGNMENT-A001";
  const reviewer = input.reviewerCandidates[0];
  reviewer.candidateId = "D040-CHINA-HEALTH-REVIEWER-C001";
  reviewer.reviewerName = "Avery Lin";
  reviewer.controlledContactRef = "urn:nuttie:controlled:contact:reviewer-001";
  reviewer.qualificationType = "Clinical Nutrition Qualification";
  reviewer.qualificationIssuer = "Controlled Health Registry";
  reviewer.qualificationReference = "urn:nuttie:controlled:qualification:reviewer-001";
  reviewer.competenceVerificationByScope.forEach((entry, index) => {
    entry.evidenceRefs = [`urn:nuttie:controlled:competence:${index + 1}`];
    entry.verifiedByName = "Morgan Chen";
    entry.verificationRef = `urn:nuttie:controlled:verification:competence:${index + 1}`;
  });
  reviewer.identityVerification.verifiedByName = "Jordan Wu";
  reviewer.identityVerification.verificationRef = "urn:nuttie:controlled:verification:identity:001";
  reviewer.qualificationVerification.verifiedByName = "Morgan Chen";
  reviewer.qualificationVerification.verificationRef = "urn:nuttie:controlled:verification:qualification:001";
  reviewer.localeAndRegionFit.rationaleRef = "urn:nuttie:controlled:locale:zh-hans-cn:001";
  reviewer.localeAndRegionFit.verifiedByName = "Jordan Wu";
  reviewer.localeAndRegionFit.verificationRef = "urn:nuttie:controlled:verification:locale:001";
  reviewer.conflictOfInterest.disclosureRef = "urn:nuttie:controlled:disclosure:conflict:001";
  reviewer.signatureReferencePlanned = "urn:nuttie:controlled:signature-plan:001";
  reviewer.externalContactAuthorizationRef = "urn:nuttie:controlled:authorization:contact:001";
  input.selectedCandidateId = reviewer.candidateId;
  for (const coverage of input.requiredScopeCoverage) coverage.candidateIds = [reviewer.candidateId];
  input.externalContactAuthorizationRef = "urn:nuttie:controlled:authorization:contact:bundle-001";
  input.assignedByName = "Taylor Zhao";
  input.assignmentEvidenceRefs = ["urn:nuttie:controlled:assignment:evidence:001"];
  return withDigest(input);
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

test("完整合成五项健康评审人指派只覆盖算法且现实授权全部保持关闭", () => {
  const input = makeSyntheticFixture();
  const result = evaluateD040ChinaHealthReviewerAssignment(input);
  assert.equal(result.schemaVersion, RESULT_SCHEMA_VERSION);
  assert.equal(result.contractId, CONTRACT_ID);
  assert.equal(result.disposition, "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY");
  assert.equal(result.reviewerCandidateCount, 1);
  assert.equal(result.selectedCandidateId, "D040-CHINA-HEALTH-SYNTHETIC-C001");
  assert.equal(result.requiredCompetenceScopeCount, 5);
  assert.equal(result.coveredRequiredScopeCount, 5);
  assert.equal(result.completeReviewerCount, 1);
  assert.equal(result.incompleteReviewerCount, 0);
  assert.equal(result.structurallyReady, true);
  assert.equal(result.selectedCandidateStructurallyReady, true);
  assert.equal(result.healthReviewerAssignmentReadyCandidate, false);
  assert.equal(result.syntheticWouldBeAssignmentReadyCandidate, true);
  assert.equal(result.reviewerAssignedReturned, false);
  assert.equal(result.reviewCanStartReturned, false);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.equal(result.boundary.reviewerCandidateCount, 0);
  assert.equal(result.boundary.reviewerAssignmentRecordCount, 0);
  assert.equal(result.boundary.controlledContactRecordCount, 0);
  assert.equal(result.boundary.externalMessagesSent, 0);
  assert.equal(result.boundary.reviewerAssigned, false);
  assert.equal(result.boundary.reviewerQualificationVerified, false);
  assert.equal(result.boundary.reviewerLocaleFitVerified, false);
  assert.equal(result.boundary.healthReviewStarted, false);
  assert.equal(result.boundary.ownerChoiceRecorded, false);
  assert.equal(result.boundary.d068OwnerReady, false);
  assert.equal(result.boundary.d069OwnerReady, false);
  assert.equal(result.boundary.d063OwnerReady, false);
  assert.equal(result.boundary.healthReviewStillRequired, true);
  assert.equal(result.boundary.healthContentApproved, false);
  assert.equal(result.boundary.contentQaPassed, false);
  assert.equal(result.boundary.px1Authorized, false);
  assert.equal(result.boundary.px2Authorized, false);
  assert.equal(result.boundary.formalImplementationAuthorized, false);
  assert.match(result.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
});

test("结构完整正式输入只返回调用方声明的 candidate 而不形成现实指派", () => {
  const result = evaluateD040ChinaHealthReviewerAssignment(makeFormalFixture());
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_HEALTH_REVIEWER_ASSIGNMENT_CANDIDATE");
  assert.equal(result.requiredCompetenceScopeCount, 5);
  assert.equal(result.coveredRequiredScopeCount, 5);
  assert.equal(result.healthReviewerAssignmentReadyCandidate, true);
  assert.equal(result.syntheticWouldBeAssignmentReadyCandidate, false);
  assert.equal(result.reviewerAssignedReturned, false);
  assert.equal(result.reviewCanStartReturned, false);
  assert.deepEqual(result.blockers, [
    "INPUT_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
    "IDENTITY_QUALIFICATION_COMPETENCE_LOCALE_INDEPENDENCE_CALLER_ASSERTED_NOT_VERIFIED",
    "CONTACT_AUTHORIZATION_CALLER_ASSERTED_NOT_VERIFIED",
    "FORMAL_ASSIGNMENT_NOT_CREATED",
    "HEALTH_REVIEW_NOT_STARTED",
    "D040_CHINA_HEALTH_OWNER_PX_AND_IMPLEMENTATION_GATES_UNCHANGED",
  ]);
  for (const field of [
    "externalContactAuthorized", "reviewerAssigned", "reviewerIdentityVerified",
    "reviewerQualificationVerified", "reviewerCompetenceVerified", "reviewerLocaleFitVerified",
    "reviewerIndependenceVerified", "reviewerSignatureVerified", "conflictOfInterestResolved",
    "healthReviewStarted", "d068OwnerReady", "d069OwnerReady", "d063OwnerReady",
    "firstThreeBatchesIndependentReviewPassed", "healthContentApproved", "contentQaPassed",
    "ownerIntakeChanged", "ownerCardsScheduled", "px1Authorized", "px2Authorized",
    "ownerReviewAuthorized", "ownerChoiceRecorded", "decisionAcceptedRecorded",
    "healthCopyImplementationAuthorized", "formulaImplementationAuthorized",
    "formalRootProjectAuthorized", "nativeIosWorkAuthorized", "formalImplementationAuthorized",
    "gateStatesChanged",
  ]) assert.equal(result.boundary[field], false, `${field} must remain false`);
});

test("正式记录拒绝合成 identity 与 example.test 引用", () => {
  const input = mutateFixture((draft) => {
    draft.recordKind = FORMAL_RECORD_KIND;
    draft.assignmentId = "D040-CHINA-HEALTH-ASSIGNMENT-A001";
    draft.reviewerCandidates[0].candidateId = "D040-CHINA-HEALTH-REVIEWER-C001";
    draft.selectedCandidateId = "D040-CHINA-HEALTH-REVIEWER-C001";
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds = ["D040-CHINA-HEALTH-REVIEWER-C001"];
  });
  assert.throws(
    () => normalizeD040ChinaHealthReviewerAssignment(input),
    /synthetic identity|synthetic reference/,
  );
});

test("PENDING 身份产生 ASSIGNMENT_INCOMPLETE 而不形成健康评审人指派候选", () => {
  const input = mutateFixture((draft) => {
    draft.reviewerCandidates[0].identityVerification = {
      state: "PENDING",
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    };
    draft.reviewCanStart = false;
  });
  const result = evaluateD040ChinaHealthReviewerAssignment(input);
  assert.equal(result.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(result.completeReviewerCount, 0);
  assert.equal(result.coveredRequiredScopeCount, 0);
  assert.equal(result.selectedCandidateStructurallyReady, false);
  assert.equal(result.healthReviewerAssignmentReadyCandidate, false);
  assert.equal(result.syntheticWouldBeAssignmentReadyCandidate, false);
  assert.equal(result.reviewCanStartReturned, false);
});

test("顶层字段缺失、额外字段和 record kind 漂移时失败关闭", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    delete draft.assignedAt;
  })), /assignedAt is required/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.unexpected = false;
  })), /unexpected is unsupported/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.recordKind = "ASSIGNED";
  })), /unsupported recordKind/);
});

test("冻结 packet 身份任一漂移都被拒绝", () => {
  for (const [field, value] of [
    ["packetVersion", "PACKET-002-R1"],
    ["packetEventId", "EVT-20260820-999"],
    ["inputCommit", "0".repeat(40)],
    ["packetArtifactCommit", "3".repeat(40)],
    ["packetArtifactBlobOid", "1".repeat(40)],
    ["packetArtifactSha256", "2".repeat(64)],
  ]) {
    const input = mutateFixture((draft) => { draft.reviewPacketIdentity[field] = value; });
    assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(input), /frozen packet/);
  }
});

test("candidate ID、角色名和重复身份不能冒充具名复核人", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].candidateId = "D040-CHINA-HEALTH-REVIEWER-C001";
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds = [draft.reviewerCandidates[0].candidateId];
  })), /wrong record-kind prefix/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].reviewerName = "QA";
  })), /role or agent name/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].reviewerName = "ProjectContentOwner";
  })), /role or agent name/);
  const duplicate = mutateFixture((draft) => {
    draft.reviewerCandidates.push(clone(draft.reviewerCandidates[0]));
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds.push(draft.reviewerCandidates[0].candidateId);
  });
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(duplicate), /duplicate candidate IDs/);

  const duplicateName = mutateFixture((draft) => {
    const duplicateCandidate = clone(draft.reviewerCandidates[0]);
    duplicateCandidate.candidateId = "D040-CHINA-HEALTH-SYNTHETIC-C002";
    duplicateCandidate.reviewerName = "Example reviewer one";
    duplicateCandidate.controlledContactRef = "urn:nuttie.example.test:contact:reviewer-two";
    draft.reviewerCandidates.push(duplicateCandidate);
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds.push(duplicateCandidate.candidateId);
  });
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(duplicateName), /duplicate names/);

  const duplicateContact = mutateFixture((draft) => {
    const duplicateCandidate = clone(draft.reviewerCandidates[0]);
    duplicateCandidate.candidateId = "D040-CHINA-HEALTH-SYNTHETIC-C002";
    duplicateCandidate.reviewerName = "Example Reviewer Two";
    draft.reviewerCandidates.push(duplicateCandidate);
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds.push(duplicateCandidate.candidateId);
  });
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(duplicateContact), /duplicate contact references/);
});

test("唯一入选候选人必须存在、不能自我指派且不要求未入选候选人全部就绪", () => {
  const notSelected = mutateFixture((draft) => {
    draft.selectedCandidateId = null;
    draft.reviewCanStart = false;
  });
  const notSelectedResult = evaluateD040ChinaHealthReviewerAssignment(notSelected);
  assert.equal(notSelectedResult.selectedCandidateStructurallyReady, false);
  assert.equal(notSelectedResult.coveredRequiredScopeCount, 0);
  assert.equal(notSelectedResult.disposition, "ASSIGNMENT_INCOMPLETE");

  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.selectedCandidateId = "D040-CHINA-HEALTH-SYNTHETIC-C999";
  })), /existing candidate/);

  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.assignedByName = "Example reviewer one";
  })), /cannot self-assign/);

  const unselectedPending = mutateFixture((draft) => {
    const pending = clone(draft.reviewerCandidates[0]);
    pending.candidateId = "D040-CHINA-HEALTH-SYNTHETIC-C002";
    pending.reviewerName = "Example Reviewer Two";
    pending.controlledContactRef = "urn:nuttie.example.test:contact:reviewer-two";
    pending.identityVerification = {
      state: "PENDING",
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    };
    draft.reviewerCandidates.push(pending);
    for (const coverage of draft.requiredScopeCoverage) coverage.candidateIds.push(pending.candidateId);
  });
  const pendingResult = evaluateD040ChinaHealthReviewerAssignment(unselectedPending);
  assert.equal(pendingResult.reviewerCandidateCount, 2);
  assert.equal(pendingResult.completeReviewerCount, 1);
  assert.equal(pendingResult.incompleteReviewerCount, 1);
  assert.equal(pendingResult.selectedCandidateStructurallyReady, true);
  assert.equal(pendingResult.structurallyReady, true);
});

test("候选人的五项胜任范围必须去重并使用固定顺序", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].competenceScopeIds.reverse();
    draft.reviewerCandidates[0].competenceVerificationByScope.reverse();
  })), /fixed scope order/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].competenceScopeIds[1] = draft.reviewerCandidates[0].competenceScopeIds[0];
    draft.reviewerCandidates[0].competenceVerificationByScope[1].competenceScopeId = draft.reviewerCandidates[0].competenceScopeIds[0];
  })), /duplicates/);
});

test("逐项胜任核验必须与声明范围一一对应且 PENDING 不得夹带证据", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].competenceVerificationByScope[0].competenceScopeId = COMPETENCE_SCOPES[1];
  })), /match declared scope order/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    const competence = draft.reviewerCandidates[0].competenceVerificationByScope[0];
    competence.state = "PENDING";
    competence.verifiedByName = null;
    competence.verificationRef = null;
    competence.verifiedAt = null;
  })), /PENDING metadata must be empty or null/);
});

test("身份、资质、胜任与地域核验拒绝自核验和伪造的未核验元数据", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].identityVerification.verifiedByName = draft.reviewerCandidates[0].reviewerName;
  })), /self-verified/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].identityVerification.verifiedByName = "Example reviewer one";
  })), /self-verified/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    const identity = draft.reviewerCandidates[0].identityVerification;
    identity.state = "PENDING";
  })), /PENDING metadata must be null/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].competenceVerificationByScope[1].verifiedByName = draft.reviewerCandidates[0].reviewerName;
  })), /self-verified/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].qualificationVerification.verifiedByName = draft.reviewerCandidates[0].reviewerName;
  })), /self-verified/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].qualificationVerification.state = "NOT_VERIFIED";
  })), /NOT_VERIFIED metadata must be null/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].localeAndRegionFit.state = "NOT_VERIFIED";
  })), /NOT_VERIFIED metadata must be null/);
});

test("未核验或拒绝的资质与地域适配只能保持 assignment incomplete", () => {
  for (const mutate of [
    (candidate) => {
      candidate.qualificationVerification = {
        state: "NOT_VERIFIED",
        verifiedByName: null,
        verificationRef: null,
        verifiedAt: null,
        qualificationObservedValidAt: null,
      };
    },
    (candidate) => {
      candidate.qualificationVerification.state = "REJECTED";
      candidate.qualificationVerification.qualificationObservedValidAt = null;
    },
    (candidate) => {
      candidate.localeAndRegionFit = {
        state: "NOT_VERIFIED",
        rationaleRef: "urn:nuttie.example.test:locale:not-verified:one",
        verifiedByName: null,
        verificationRef: null,
        verifiedAt: null,
      };
    },
    (candidate) => { candidate.localeAndRegionFit.state = "FAIL"; },
  ]) {
    const input = mutateFixture((draft) => {
      mutate(draft.reviewerCandidates[0]);
      draft.reviewCanStart = false;
    });
    const result = evaluateD040ChinaHealthReviewerAssignment(input);
    assert.equal(result.selectedCandidateStructurallyReady, false);
    assert.equal(result.healthReviewerAssignmentReadyCandidate, false);
    assert.equal(result.disposition, "ASSIGNMENT_INCOMPLETE");
  }
});

test("利益冲突状态与 resolution 引用必须一致", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].conflictOfInterest.state = "OPEN";
    draft.reviewerCandidates[0].conflictOfInterest.resolutionRef = "urn:nuttie.example.test:conflict:resolution";
  })), /must exist only for RESOLVED/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].conflictOfInterest.state = "RESOLVED";
  })), /must exist only for RESOLVED/);
});

test("参与起草的候选人不计入健康评审人就绪状态", () => {
  const input = mutateFixture((draft) => {
    draft.reviewerCandidates[0].participatedInDrafting = true;
    draft.reviewerCandidates[0].draftingArtifactRefs = ["urn:nuttie.example.test:artifact:draft:one"];
    draft.reviewCanStart = false;
  });
  const result = evaluateD040ChinaHealthReviewerAssignment(input);
  assert.equal(result.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(result.completeReviewerCount, 0);
  assert.equal(result.coveredRequiredScopeCount, 0);
  assert.equal(result.reviewerAssignedReturned, false);
});

test("五项胜任覆盖矩阵拒绝顺序漂移、未知 candidate 和未核验声明", () => {
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    [draft.requiredScopeCoverage[0], draft.requiredScopeCoverage[1]] = [draft.requiredScopeCoverage[1], draft.requiredScopeCoverage[0]];
  })), /fixed order/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.requiredScopeCoverage[2].candidateIds = ["D040-CHINA-HEALTH-SYNTHETIC-C999"];
  })), /exactly match verified candidate scopes/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].competenceScopeIds.pop();
    draft.reviewerCandidates[0].competenceVerificationByScope.pop();
  })), /exactly match verified candidate scopes/);
});

test("未授权联络或缺少 assignment evidence 只能保持 incomplete", () => {
  const unauthorized = mutateFixture((draft) => {
    draft.externalContactAuthorized = false;
    draft.externalContactAuthorizationRef = null;
    draft.reviewerCandidates[0].externalContactAuthorizationRef = null;
    draft.reviewCanStart = false;
  });
  const unauthorizedResult = evaluateD040ChinaHealthReviewerAssignment(unauthorized);
  assert.equal(unauthorizedResult.disposition, "ASSIGNMENT_INCOMPLETE");
  assert.equal(unauthorizedResult.reviewerAssignedReturned, false);

  const noEvidence = mutateFixture((draft) => {
    draft.assignmentEvidenceRefs = [];
    draft.reviewCanStart = false;
  });
  const noEvidenceResult = evaluateD040ChinaHealthReviewerAssignment(noEvidence);
  assert.equal(noEvidenceResult.completeReviewerCount, 1);
  assert.equal(noEvidenceResult.coveredRequiredScopeCount, 5);
  assert.equal(noEvidenceResult.disposition, "ASSIGNMENT_INCOMPLETE");

  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.externalContactAuthorized = false;
  })), /flag and reference must match/);
});

test("packet 接受、指派、截止时间与签署计划失败关闭", () => {
  const lateAssignment = mutateFixture((draft) => {
    draft.reviewerCandidates[0].expectedReviewDueAt = "2026-08-22T22:09:59+08:00";
    draft.reviewCanStart = false;
  });
  const lateResult = evaluateD040ChinaHealthReviewerAssignment(lateAssignment);
  assert.equal(lateResult.completeReviewerCount, 0);
  assert.equal(lateResult.disposition, "ASSIGNMENT_INCOMPLETE");

  const beyondNinetyDays = mutateFixture((draft) => {
    draft.reviewerCandidates[0].expectedReviewDueAt = "2026-11-21T22:10:01+08:00";
    draft.reviewCanStart = false;
  });
  assert.equal(
    evaluateD040ChinaHealthReviewerAssignment(beyondNinetyDays).selectedCandidateStructurallyReady,
    false,
  );

  const verificationAfterAssignment = mutateFixture((draft) => {
    draft.reviewerCandidates[0].localeAndRegionFit.verifiedAt = "2026-08-22T22:11:00+08:00";
    draft.reviewCanStart = false;
  });
  assert.equal(
    evaluateD040ChinaHealthReviewerAssignment(verificationAfterAssignment).selectedCandidateStructurallyReady,
    false,
  );

  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].signatureReferencePlanned = null;
  })), /both null or both present/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].packetAccepted.packetVersion = "PACKET-002-R1";
  })), /bind the frozen packet/);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.reviewerCandidates[0].packetAccepted.acceptedAt = "2026-02-30T22:00:00+08:00";
  })), /RFC 3339 timestamp/);
});

test("reviewCanStart 必须由 validator 重算，调用方不能伪造", () => {
  const forged = mutateFixture((draft) => {
    draft.reviewerCandidates[0].identityVerification = {
      state: "PENDING",
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    };
  });
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(forged), /does not match recomputed/);
});

test("assignmentContentSha256 绑定删除自身后的完整 bundle", () => {
  const input = makeSyntheticFixture();
  assert.equal(input.assignmentContentSha256, computeAssignmentContentSha256(input));
  input.assignedAt = "2026-08-22T22:11:00+08:00";
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(input), /does not match the canonical bundle/);
  const malformed = makeSyntheticFixture();
  malformed.assignmentContentSha256 = "A".repeat(64);
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(malformed), /lowercase SHA-256/);
});

test("敏感字段名和值在解析前拒绝且错误不回显原值", () => {
  const email = "private.person@example.com";
  const emailInput = makeSyntheticFixture();
  emailInput.reviewerCandidates[0].email = email;
  const fieldError = captureError(() => normalizeD040ChinaHealthReviewerAssignment(emailInput));
  assert.equal(fieldError.code, "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(fieldError.message, new RegExp(email.replace(".", "\\.")));

  const secret = "Bearer top-secret-token-value";
  const valueInput = makeSyntheticFixture();
  valueInput.reviewerCandidates[0].controlledContactRef = secret;
  const valueError = captureError(() => normalizeD040ChinaHealthReviewerAssignment(valueInput));
  assert.equal(valueError.code, "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(valueError.message, /top-secret-token-value/);

  const phoneInput = makeSyntheticFixture();
  phoneInput.reviewerCandidates[0].controlledContactRef = "tel:+8613812345678";
  const phoneError = captureError(() => normalizeD040ChinaHealthReviewerAssignment(phoneInput));
  assert.equal(phoneError.code, "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT");
  assert.doesNotMatch(phoneError.message, /13812345678/);

  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mutateFixture((draft) => {
    draft.containsIdentityDocument = true;
  })), (error) => error.code === "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT");
});

test("特殊对象、accessor、cycle、超长字符串和 reviewer 上限都被拒绝", () => {
  const mapInput = makeSyntheticFixture();
  mapInput.reviewPacketIdentity = new Map();
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(mapInput), /plain records/);

  const accessorInput = makeSyntheticFixture();
  Object.defineProperty(accessorInput, "assignedByName", {
    enumerable: true,
    get() { return "Example Accessor"; },
  });
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(accessorInput), /non-data properties/);

  const cycleInput = makeSyntheticFixture();
  cycleInput.loop = cycleInput;
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(cycleInput), /cycle/);

  const longInput = makeSyntheticFixture();
  longInput.reviewerCandidates[0].controlledContactRef = `urn:nuttie.example.test:${"x".repeat(600)}`;
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(longInput), /resource limits/);

  const crowded = makeSyntheticFixture();
  crowded.reviewerCandidates = Array.from({ length: 21 }, () => clone(crowded.reviewerCandidates[0]));
  assert.throws(() => normalizeD040ChinaHealthReviewerAssignment(crowded), /one to twenty candidates/);
});

test("规范化与结果深冻结，伪造结果或指纹无法通过重建", () => {
  const input = makeSyntheticFixture();
  const normalized = normalizeD040ChinaHealthReviewerAssignment(input);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.reviewerCandidates), true);
  assert.equal(Object.isFrozen(normalized.reviewerCandidates[0].identityVerification), true);
  assert.throws(() => { normalized.reviewCanStart = false; }, TypeError);

  const result = evaluateD040ChinaHealthReviewerAssignment(input);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(validateD040ChinaHealthReviewerAssignmentResult(result, input), result);
  const forged = clone(result);
  forged.healthReviewerAssignmentReadyCandidate = true;
  forged.reviewerAssignedReturned = true;
  forged.boundary.reviewerAssigned = true;
  forged.resultFingerprint = "f".repeat(64);
  assert.throws(() => validateD040ChinaHealthReviewerAssignmentResult(forged, input), /changed/);
});

test("源码审计固定无 Git、文件、联系人、签署、网络、消息或业务副作用", () => {
  const sourcePath = fileURLToPath(new URL("./d040-china-health-reviewer-assignment-harness.mjs", import.meta.url));
  const source = readFileSync(sourcePath, "utf8");
  assert.doesNotMatch(source, /from\s+["']node:(?:fs|http|https|net|tls|child_process)["']/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\bprocess\.env\b/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|unlink|rename|mkdir|rmdir)\s*\(/);
  assert.equal(BOUNDARY.gitReads, 0);
  assert.equal(BOUNDARY.fileReads, 0);
  assert.equal(BOUNDARY.fileWrites, 0);
  assert.equal(BOUNDARY.qualificationRegistryReads, 0);
  assert.equal(BOUNDARY.contactRecordReads, 0);
  assert.equal(BOUNDARY.signatureArtifactReads, 0);
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.externalMessagesSent, 0);
  assert.equal(BOUNDARY.businessWrites, 0);
});
