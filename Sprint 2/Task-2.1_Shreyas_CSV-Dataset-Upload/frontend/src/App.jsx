// Root application container: renders the modular upload widget cleanly
import { DatasetUpload } from './components/DatasetUpload';

function App() {
  return (
    // Neutral full-page layout without conflicting sprint headers
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full">
        {/* DatasetUpload component instance ready for integration */}
        <DatasetUpload
          onUploadSuccess={(data) => {
            console.log('Dataset stored successfully:', data);
          }}
        />
      </div>
    </div>
  );
}

export default App;