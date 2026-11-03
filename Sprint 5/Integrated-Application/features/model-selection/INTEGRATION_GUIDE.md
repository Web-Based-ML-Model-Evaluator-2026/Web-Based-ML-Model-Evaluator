# Integration Guide — Task 4.1

## 1. Copy files into your project
- Copy `frontend/src/components/ModelSelection.jsx` into the existing frontend's `src/components/`.
- Copy `frontend/src/utils/modelSelection.js` into the existing frontend's `src/utils/`.
- Adjust the import path only if your team uses a different folder structure.

## 2. Render the component
```jsx
import { useState } from "react";
import ModelSelection from "./components/ModelSelection";

export default function ModelTrainingPage() {
  const [selection, setSelection] = useState(null);

  return (
    <main>
      <ModelSelection onSelectionChange={setSelection} />
      {selection && <pre>{JSON.stringify(selection, null, 2)}</pre>}
    </main>
  );
}
```
Adjust the import path based on the file where you use it.

## 3. Connect to the next task
The callback receives `taskType` (`classification` or `regression`) and `algorithm` (an ID from `modelSelection.js`). Agree on field names with teammates before connecting it to model configuration/training.

## 4. Manual tests
1. Choose Classification; verify only classification algorithms appear.
2. Choose Logistic Regression; confirm the selection.
3. Switch to Regression; verify the algorithm list changes.
4. Choose Linear Regression; confirm the selection.
5. Check invalid task/algorithm combinations with `validateSelection`.
6. Run the team's regular frontend build/test commands.

## Backend note
This component performs frontend selection and validation only. It does not train a model. The backend must independently validate the task type and algorithm before training.
