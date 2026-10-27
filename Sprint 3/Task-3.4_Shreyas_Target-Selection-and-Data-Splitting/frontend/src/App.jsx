import React from 'react';
import TargetAndSplit from './components/TargetAndSplit';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <main className="flex-1 py-8">
        <TargetAndSplit />
      </main>
    </div>
  );
}

export default App;