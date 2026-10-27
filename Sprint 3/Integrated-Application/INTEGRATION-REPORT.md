# Sprint 3 Integration Report

## Unified application
This directory contains one frontend (`frontend/`) and one Python backend (`backend/server.py`) wired through `/api/preprocess`.

## Feature mapping
- Task 3.1: missing-value strategies mean/mode/zero/drop.
- Task 3.2: one-hot, label, or no encoding.
- Task 3.3: no scaling, min-max, or standardization.
- Task 3.4: optional target selection and configurable train/test split.

## Verification performed in build environment
- Python syntax compilation: run before packaging.
- Unit tests: 8 pipeline tests.
- HTTP health + preprocess endpoint smoke tests: run before packaging.
- ZIP integrity: run before delivery.

Browser testing on the user's Windows system remains a separate acceptance step. No claim is made that full browser testing was performed in this environment.
