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

---

## Refactor: Efficient Upload Pipeline (match Python backend API contract)

**Goal:**
- `/detect` receives a downscaled image; returns normalised face bbox (0–1), no `imageWidth`/`imageHeight`
- Frontend computes crop area client-side from normalised face + selectedSize.aspectRatio
- `/process` receives only the cropped face region (not full image)

- [x] Step 17: Write tests for `calculateCropAreaFromNormalisedFace` in new `src/utils/cropAreaCalculation.ts`
- [x] Step 18: Confirm tests fail
- [x] Step 19: Implement `cropAreaCalculation.ts`
- [x] Step 20: Verify tests pass
- [x] Step 21: Write tests for `imageCrop.ts` utilities (`downscaleImageForDetect`, `getImageDimensions`, `cropImageToArea`)
- [x] Step 22: Confirm tests fail
- [x] Step 23: Implement `imageCrop.ts`
- [x] Step 24: Verify tests pass
- [x] Step 25: Update `apiClient.ts` contracts + tests (remove `imageWidth`/`imageHeight` from detect response; normalised face type)
- [x] Step 26: Verify apiClient tests pass
- [x] Step 27: Update `imageProcessingOrchestrator.ts` + tests (accept `normalisedFace`, crop image before API call)
- [x] Step 28: Verify orchestrator tests pass
- [x] Step 29: Refactor `MainWorkflow.tsx` + update `MainWorkflow.test.tsx` (downscale before detect, store normalisedFace, pass to processImage)
- [x] Step 30: Run full test suite
- [x] Step 31: Run lint + type-check
