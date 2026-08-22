# Changelog

## [Unreleased]

## 2026-08-12

- **da5dbb9** Move Duplicate inactive logic from PUT listing to PUT visit
- **05c81f5** docs: update AGENT.md with accurate routes and schema
- **932e641** Mark listing inactive when `latestResponse` is `Duplicate`

## 2026-08-11

- **f8a1f08** Port changed to 5000, added scripts folder, listing source fix, conditional `visitHistory`

## 2026-06-29

- **f9222ab** feat: add bulk update endpoint for area and enhance versioning logic
- **4ac0237** feat: add new address entry endpoint and improve sequence generation logic

## 2026-06-25

- **79e7d4f** fix: `addressList /list` and `/filter/search/` support optional `unitId`
  - `/addressList/list/` now accepts `masjid_id` (required) and optional `unit_id`; filters by unit only when provided
  - `/addressList/filter/search/` skips `masjidId`/`unitId` from query when value is `NaN` (e.g. `'All'`, null, or missing), preventing broken MongoDB queries

## 2026-06-05

- **a8853fc** Enhance address update functionality to include `unitId` and improve error handling

## 2026-05-17

- **5a5a49b** Enhance search functionality with optional filters for inactive records and students
- **fbf41db** Remove example environment configuration file

## 2026-05-16

- **d06fb57** Enhance logging for update operations in `addressList` routes
- **4472cb4** Add database status endpoint and update test cases for invalid `masjid_id`

## 2026-05-04

- **23caec9** Update `.gitignore`, add visit update endpoint, and create test cases for API

## 2026-05-03

- **466a6b0** Initial commit
