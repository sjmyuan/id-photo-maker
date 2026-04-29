# Refactor Plan: Frontend → Backend API

Refactor the id-photo-maker frontend to replace browser-side AI inference with calls to the id-photo-maker-backend API.

## Steps

- [x] Step 1: Write focused tests for `apiClient.ts`
- [x] Step 2: Confirm test failure (file doesn't exist yet)
- [x] Step 3: Implement `apiClient.ts`
- [x] Step 4: Verify `apiClient` tests pass
- [x] Step 5: Update `imageProcessingOrchestrator.test.ts` (mock apiClient, remove model params)
- [x] Step 6: Confirm orchestrator test failure
- [x] Step 7: Refactor `imageProcessingOrchestrator.ts` to delegate to `apiClient`
- [x] Step 8: Verify orchestrator tests pass
- [x] Step 9: Update `useImageDownload.test.ts` for new `downloadLayout(url)` signature
- [x] Step 10: Confirm download hook test failure
- [x] Step 11: Refactor `useImageDownload.ts` (drop canvas/background-color, accept URL string)
- [x] Step 12: Verify download hook tests pass
- [x] Step 13: Refactor `MainWorkflow.tsx` + `Step1Settings.tsx` (remove model loading)
- [x] Step 14: Delete all unused service/hook/util files and their tests
- [x] Step 15: Run full test suite — verify no regressions
- [x] Step 16: Run lint + type-check — validate code quality
