# Live Channels and readable call detail

Proposal for review, 2026-09-07. The accompanying webpage is an offline, interactive mockup with invented sample transmissions. Its example channel window widths illustrate the design; they do not reproduce the production heuristic. This work creates design artifacts only. Production implementation, migrations, deployment, and live device validation are deferred.

## Visual direction: Neon Grid mash-up

The requested references are `D:/Documents/Projects/neon_grid_theme/web/nuxt`, `web/petite-vue`, and `web/reports`. The first two share a cockpit style; the report pages share a more editorial treatment. The mockup combines the cockpit's Orbitron branding, Share Tech Mono controls, compact navigation, and cyan/violet palette with the reports' outlined heading, square panels, corner brackets, numbered sections, and proportional transcript text. The background uses the shared 42-pixel grid. Soft glow can be turned off under View; transcript glyphs do not glow. Fonts and licenses are included locally, so the mockup needs no external assets. Production integration should reuse the vendored theme tokens/components and add report-inspired reading components, rather than copying the standalone CSS into every page.

## What needs to change

The Calls list shows received time, channel, sequence, duration, clock, processing state, and loss flags, but no spoken text (`portal/app/pages/calls/index.vue:32`). The individual call page leads with identifiers and capture metadata, then media properties; neighboring transcripts appear farther down in a table (`portal/app/pages/calls/[id].vue:187`, `:212`, `:265`). Those previews are limited to 80 characters (`core/vw-core/vw_core/conversation.py:59`, `:184`). The detail API returns only call and media objects (`core/vw-core/vw_core/portal_api.py:137`).

Make **Live Channels** the reading view: one full-width channel card stacked above another, a stable channel order, chronological transmission fragments, and the latest words visually emphasized. Every fragment keeps its capture time and a link to the original call. Show recent processing failures and pending transcription separately so missing words do not resemble a quiet channel.

Selecting a fragment opens a transcript-first detail panel: channel, capture time, full text, processing/quality indicators, and audio when retained. Keep neighboring transmissions readable beneath it. Put identifiers, hashes, and technical capture fields behind an expandable details section. Preserve the existing archive and conversation playback. Do not infer a speaker identity or claim all nearby calls concern one incident.

## The history rule

Show the newest **500 transcript characters per channel**, also bounded by a **rolling adaptive time window**. Stop at whichever limit removes older text first. Timestamps, status labels, and other interface text do not consume the character budget. The limit is a display rule; original calls remain available in history.

Reuse the existing traffic heuristic. It sizes context independently of transcription progress: a 90-second floor, four neighboring activity calls as the fill target, and a cap based on the 90th percentile of nearby start-time gaps, clamped between 5 and 60 minutes. Fewer than ten gaps uses the maximum cap. Activity has a three-second duration floor; the sample is bounded at 25 neighboring calls per side (`core/vw-core/vw_core/config.py:210`; `core/vw-core/vw_core/conversation.py:105`; `core/vw-core/vw_core/repository.py:2123`).

For each channel, anchor sizing on its latest placeable activity call and the preceding activity sample. Call `choose_window` with that call's start time and an empty following sample. Keep the existing complete identity tuple `(edge_id, receiver_id, channel_id)`, duration floor, and capture-time placement rule. Pending and failed activity still contributes to sizing.

**Explicit new behavior:** existing call context is centered on a selected call and has no clock. The live view instead filters call starts to `[server_now - half_ms, server_now]`. This lets old text expire even when no new calls arrive. Keep the last-heard timestamp and history link after expiry. Historical call context retains its existing semantics (`core/vw-core/vw_core/conversation.py:4`, `:285`).

Budget text newest-first, then render retained fragments oldest-first. If necessary, trim only the oldest retained fragment and mark it as an excerpt. A single oversized latest transcript shows its final 500 characters with an obvious full-call link. Normalize whitespace consistently, define Unicode counting across Python/JavaScript, and avoid broken characters at the boundary. Exclude unplaceable calls from this chronological feed while retaining access through history. Do not substitute receipt time to make a delayed upload look new.

## Derive the view from existing records

Add a bounded `GET /channels/live?edge_id=...&receiver_id=...` core endpoint and an authenticated portal proxy. Return configured channels, including quiet ones; window metadata; server snapshot time; last activity; pending/failed states; and fragments containing call ID, capture time, excerpt, truncation state, and playback availability. Return enough expiry information for a local timer to remove aged fragments without another event.

Store no separate conversation text or conversation membership. Read the authoritative rank-0 transcript, preserving call provenance and retention behavior. The existing joined activity query already selects that text; its public context projection is what truncates it to 80 characters (`core/vw-core/vw_core/repository.py:2069`). Extend call detail with the selected transcript and available word offsets/confidence for full-text inspection, keeping processing/no-speech/empty states explicit. Batch detail reads into one repository submission.

Batch all channel snapshots into one bounded repository operation. Use the existing channel/capture expression index and identical `COALESCE` expression (`migrations/v2/0008_call_conversation_index.sql:11`; `core/vw-core/vw_core/repository.py:2088`). Sample activity to determine width, then perform bounded text reads within the cutoff. Stop when the budget is filled; expose a fetch-limit flag if a safety bound prevents completion. Avoid one browser request per channel or per call. A disposable short-lived memory cache is optional after measurement; duplicated persisted text is unnecessary.

## Updating without losing the reader's place

This pipeline provides text after capture, ingestion, and transcription. The first release should describe this as automatic updates when transcripts finish. Word-by-word transcription and an actual on-air indicator require additional evidence and interfaces.

Reuse the shared outbox connection. `call_ingested` includes the channel tuple; `inference_result_committed` currently has only call ID and state (`core/vw-core/vw_core/repository.py:477`, `:2256`). Refresh after both, reconciliation, and processing outcomes. For targeted refresh, add the channel tuple or maintain a bounded call-to-channel map. Pending/failure presentation must consult processing-work state, including poison outcomes (`core/vw-core/vw_core/scheduler.py:115`, `:288`).

The current layout refreshes every Nuxt query after a resetting 200ms debounce (`portal/app/layouts/default.vue:9`). Use coalesced refreshes with a maximum wait, and reuse the shared subscription. Keep channel order and selection stable. A pause-reading control freezes displayed content and reports new arrivals until resumed.

Preserve cursor-reset invalidation (`portal/app/composables/useOutboxStream.ts:132`). Reconcile snapshots on reconnect, focus, and a bounded periodic interval: capture-time reconstruction, media tombstones, and metadata deletion currently lack their own outbox events (`core/vw-core/vw_core/repository.py:1977`, `:2307`, `:2705`, `:2796`). Add precise mutation events during implementation. Show disconnected/stale state separately from channel silence.

## Implementation and acceptance

Implement the pure projection and API contract first, then the channel cards and transcript-first detail, then focused refresh behavior. Keep existing playback and archive routes working.

Validate character/time boundaries, an oversized newest transcript, Unicode, equal timestamps, late ASR, delayed uploads, quiet expiry, missing timestamps, empty/no-speech/failed/pending calls, receiver isolation, retention, and reconnect/reset. Check query plans and bounded load on busy-channel fixtures. Exercise keyboard navigation, mobile stacking, pause/resume, selection stability, audio unavailable states, and safe transcript rendering. Measure deployed capture-to-text latency separately; the offline mockup does not qualify performance or live operation.
