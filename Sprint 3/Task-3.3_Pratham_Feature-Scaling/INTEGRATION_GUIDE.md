# Integration Guide — Task 3.3

## Component contract
`FeatureScaling` accepts:
- `rows`: array of row objects
- `datasetName`: optional source filename used for export naming
- `onScalingComplete`: optional callback receiving the result object

Callback result shape:
```js
{
  rows, method, columns, parameters,
  profiles, constantColumns, validation
}
```

## Minimal integration
1. Copy `frontend/src/utils/featureScaling.js` into the shared frontend utilities directory.
2. Copy `frontend/src/components/FeatureScaling.jsx` into the shared frontend components directory.
3. Import and render the component after dataset loading/validation and before model training.
4. Pass the current dataset rows and update the application's processed dataset from `onScalingComplete`.
5. Run the included unit tests and the shared application's test/build commands.

## ML leakage warning
Do not fit scaling separately on the full dataset before splitting. The production pipeline should split first, fit scaling parameters on the training split only, and apply the same saved parameters to the test split. The utility exposes fitted parameters and an `applyScalingParameters` function to support this pattern. Ensure Task 3.4 integration follows this order.
