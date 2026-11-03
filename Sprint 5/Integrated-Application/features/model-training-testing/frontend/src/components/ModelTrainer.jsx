import React, { useState } from 'react';
import axios from 'axios';
import { Play, Loader2, CheckCircle2, AlertTriangle, Cpu, Clock, Rows } from 'lucide-react';

export default function ModelTrainer() {
  // --- STATE MANAGEMENT ---
  // status: Tracks execution state ('idle', 'running', 'completed', 'error')
  const [status, setStatus] = useState('idle');
  // results: Stores the metadata returned by the backend after successful training
  const [results, setResults] = useState(null);
  // errorMessage: Stores user-friendly error messages if the backend fails
  const [errorMessage, setErrorMessage] = useState('');

  // --- TASK 4.3 CORE LOGIC: EXECUTE TRAINING ---
  const handleTrain = async () => {
    setStatus('running'); // Instantly update UI to show the loading spinner
    setErrorMessage('');  // Clear any previous errors
    
    try {
      // MOCK PAYLOAD (STRICT SCOPE ENFORCEMENT)
      // Simulates the data Teammate D (Task 4.1) and Teammate A (Task 4.2) 
      // will eventually pass to your function once you all merge your code.
      // You do not build the UI to select these, you only execute them.
      const mockPayload = {
        task_type: "classification",
        model_name: "Logistic Regression",
        hyperparameters: {} 
      };

      // POST request sending the configuration to the Flask backend
      const response = await axios.post('http://localhost:5000/api/train', mockPayload);
      
      // If successful, save the telemetry data and update UI status
      setResults(response.data);
      setStatus('completed');
    } catch (error) {
      // ERROR HANDLING: Catch and display errors without exposing internal Python stack traces
      setStatus('error');
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Network error: Unable to reach the training server.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* --- 4.3 EXECUTION PANEL --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Task 4.3: Training Execution Engine</h2>
        <p className="text-sm text-gray-500 mt-1">
          (Note: Task 4.1 & 4.2 UI components will be injected here by teammates later)
        </p>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <button
            onClick={handleTrain}
            disabled={status === 'running'} // Prevent duplicate requests while training
            className={`w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-all
              ${status === 'running' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          >
            {status === 'running' ? (
              <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Executing .fit() and .predict()...</>
            ) : (
              <><Play className="-ml-1 mr-2 h-4 w-4" /> Execute Training Pipeline</>
            )}
          </button>
        </div>
      </div>

      {/* --- 4.3 ERROR HANDLING STATE --- */}
      {status === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Execution Failure</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 4.3 TELEMETRY DASHBOARD (SUCCESS STATE) --- */}
      {status === 'completed' && results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Training Pipeline Successful</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Display the algorithm that was executed */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trained Algorithm</p>
                  <p className="mt-1 font-semibold text-gray-900">{results.model_name}</p>
                </div>
              </div>

              {/* Display the time taken for .fit() */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Compute Time</p>
                  <p className="mt-1 font-semibold text-gray-900">{results.training_duration_seconds}s</p>
                </div>
              </div>

              {/* Display the row count of .predict() to verify it ran on the test set */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-start gap-3">
                <Rows className="w-5 h-5 text-teal-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Test Inference (y_pred)</p>
                  <p className="mt-1 font-semibold text-gray-900">{results.test_samples_predicted} rows</p>
                </div>
              </div>
            </div>
            
            {/* Handoff proof for Teammate C (Task 4.4) */}
            <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
              <p><strong>Artifacts generated for Teammate C (Task 4.4):</strong></p>
              <ul className="list-disc ml-5 mt-1">
                <li>Model saved to: <code>{results.model_path}</code></li>
                <li>Predictions saved to: <code>{results.predictions_path}</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}