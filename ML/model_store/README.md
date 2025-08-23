# Model Store

This directory contains trained ML models and their metadata.

## Structure

- `*.pkl`: Trained model files (LightGBM classifiers)
- `*.meta.json`: Model metadata including:
  - Feature order
  - Encoding mappings
  - Risk thresholds
  - Training metrics
  - Version information

## Version Format

Models are versioned as: `risk-lgbm-YYYY-MM-DD-HHMM`

Example:
- `risk-lgbm-2025-01-15-1430.pkl`
- `risk-lgbm-2025-01-15-1430.meta.json`

## Usage

The FastAPI service automatically loads the latest model on startup. The model registry handles loading and saving operations.

**Note:** Model files are gitignored due to their size. Deploy models separately or train them in your deployment environment.