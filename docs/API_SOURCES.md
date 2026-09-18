# Official API references

Checked September 15, 2026:
- Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Responses API: https://developers.openai.com/api/reference/resources/responses/methods/create
- Transcription: https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe

Use Responses API `text.format` with strict JSON Schema. Validate again at the application boundary. Keep canonical kernels immutable and outside generated output. Transcription uses `/v1/audio/transcriptions` and `gpt-4o-mini-transcribe`. No API key is configured in this workspace at initial inspection.
