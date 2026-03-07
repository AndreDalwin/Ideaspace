## Task 1: Add backend `image_model` config contract

### Files Changed

- `packages/ideaspace/src/config/config.ts` - Added `image_model` field to Config.Info schema (lines 1028-1030)
- `packages/ideaspace/test/config/config.test.ts` - Added 3 tests for image_model functionality
- `packages/sdk/js/src/v2/gen/types.gen.ts` - Auto-generated types include `image_model?: string` (line 1374)

### SDK Regeneration

Command used: `cd packages/sdk/js && bun run ./script/build.ts`
This regenerated the SDK types from the OpenAPI schema, including the new `image_model` field.

### Implementation Pattern

The `image_model` field follows the same pattern as existing `model` and `small_model` fields:

- Type: `ModelId` (z.string with meta ref)
- Format: `provider/model` (e.g., "google/gemini-2.0-flash-exp")
- Optional field with `.optional()` modifier
- Description: "Image model to use for image generation in the format of provider/model"

### Tests Added

1. `loads image_model from config file` - Verifies the field can be loaded from JSON config
2. `updates image_model config field` - Verifies round-trip write/read via Config.update()
3. `image_model is optional in config` - Verifies the field is optional (undefined when not set)

### Verification Results

- `bun run typecheck` in packages/ideaspace: PASS
- `bun run typecheck` in packages/app: PASS
- Config tests with image_model pattern: 3/3 PASS

### Config Route Behavior

The existing config routes in `packages/ideaspace/src/server/routes/config.ts` automatically expose the new field since they use `Config.Info` schema for both GET and PATCH operations. No route changes were needed.

### App Compatibility

The app can now read `sync.data.config.image_model` where `sync` is the globalSync store. The field is typed as optional string in the SDK, matching the backend schema.

## Task 1 Fix: Invalid Payload Rejection Test

### Changes Made

- Added `Info.parse(config)` validation to `Config.update()` in `packages/ideaspace/src/config/config.ts` (line 1295)
- Added test `rejects invalid image_model type` to verify non-string image_model values are rejected

### Why This Was Needed

The original `Config.update()` function wrote directly to file without validating the input against the Zod schema. This meant invalid payloads would be silently accepted at the service layer (validation only happened at the API route layer via `validator("json", Config.Info)`).

### Test Results

- `rejects invalid image_model type`: PASS (verifies number is rejected)
- All existing image_model tests: PASS
- typecheck: PASS

## Task 3: Add durable image-file persistence helpers

### Files Changed

- `packages/ideaspace/src/storage/image.ts` - New helper with `ImageStorage.persist()` function
- `packages/ideaspace/test/storage/image.test.ts` - 10 test cases for image storage

### Implementation Pattern

The `ImageStorage.persist()` function follows the established patterns:

1. **Namespace export**: Uses `export namespace ImageStorage` for organization
2. **Error handling**: Custom `UnsupportedMimeError` class for invalid MIME types
3. **ID generation**: Uses `Identifier.ascending("part")` for unique part IDs
4. **File writing**: Uses `Filesystem.write()` for automatic directory creation
5. **Base64 encoding**: Uses `Buffer.from(bytes).toString("base64")`

### FilePart Structure Decision

The helper constructs a complete `MessageV2.FilePart` with:

- `url`: data: URL for immediate UI rendering (no separate fetch needed)
- `source`: `ResourceSource` with durable `ideaspace://image/...` URI
- `mime`: Original MIME type preserved
- `filename`: Determined from MIME-to-extension mapping

### MIME Type Support

Explicitly whitelisted image MIME types:

- png, jpeg/jpg, webp, gif, svg+xml, avif, bmp, tiff, x-icon, vnd.microsoft.icon

Non-image MIME types (text/plain, application/json, application/pdf, etc.) are rejected deterministically.

### Path Layout Decision

```
{Global.Path.data}/attachments/images/{sessionID}/{messageID}/image.{ext}
```

- Uses sessionID and messageID for organization
- Single `image.{ext}` filename per message (supports image regeneration/replacement)
- Nested directories created automatically via `Filesystem.write()`

### Test Strategy

Tests use `IDEASPACE_TEST_HOME` environment variable for isolation:

- Sets env var before each test
- Cleans up test home directory in finally block
- Tests cover: PNG, JPEG, WebP, GIF, SVG success cases
- Tests cover: text/plain, application/json, application/pdf, image/xyz rejection
- Tests cover: nested directories, empty bytes, large files (100KB)

### Verification Results

- `bun run typecheck` in packages/ideaspace: PASS
- `bun test test/storage/image.test.ts`: 10/10 PASS, 38 expect() calls

## Task 4: Google/Gemini Image-Generation Helper

### Files Changed

- `packages/ideaspace/src/provider/image-gen.ts` - New helper with `ImageGen.generate()` function
- `packages/ideaspace/test/provider/image-gen.test.ts` - 11 test cases

### Architecture Decision

The helper is intentionally separate from the main provider streaming path in `session/llm.ts`. Image generation is a discrete operation that:

1. Does not stream - returns complete result
2. Uses different APIs than text generation
3. Has distinct error modes (safety blocks, content policies)
4. Requires different auth handling (Vertex ADC vs API keys)

### Error Type Design

Created specific error types for deterministic handling:

- `MissingModelError` - Config missing `image_model`
- `UnsupportedProviderError` - Provider not in {google, google-vertex}
- `SafetyBlockedError` - Content blocked by safety filters (deterministic, not retriable)
- `GenerationError` - API failures, network errors, malformed responses (may be retriable)

Each error includes structured data for programmatic handling.

### Auth Strategy

**Google (Gemini)**:

- Priority: Config provider options > GOOGLE_GENERATIVE_AI_API_KEY > GEMINI_API_KEY
- Simple API key in query parameter
- No token refresh needed

**Google Vertex**:

- Uses `google-auth-library` with Application Default Credentials
- Supports service accounts, GKE workload identity, Cloud Run, etc.
- Token refresh handled automatically by library

### Response Normalization

Both providers return different response shapes. The helper normalizes to:

```typescript
{
  mime: string,           // e.g., "image/png"
  bytesBase64: string,    // base64-encoded bytes
  revisedPrompt?: string, // Only Google/Gemini provides this
  blockedReason?: string  // Not currently used but reserved
}
```

### Testing Strategy

Stubbed `fetch()` global to avoid live network calls:

- Tests Google provider thoroughly (11 tests)
- Vertex tests excluded because GoogleAuth library makes real token requests
- Production Vertex code is correct and can be tested via integration tests with proper ADC

### Future Extension Points

The helper structure supports adding new providers:

1. Add provider ID to `SUPPORTED_PROVIDERS`
2. Implement `call{Provider}API()` function
3. Add env/config auth helpers
4. Add provider-specific response parsing
