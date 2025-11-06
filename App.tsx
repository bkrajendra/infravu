
import React, { useState, useCallback } from 'react';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { ConfigEditor } from './components/ConfigEditor';
import { INITIAL_CONFIG } from './constants';
import type { ArchitectureConfig } from './types';
import { GithubIcon } from './components/icons';

function App() {
  const [config, setConfig] = useState<ArchitectureConfig>(INITIAL_CONFIG);
  const [error, setError] = useState<string>('');
  const [isEditorVisible, setEditorVisible] = useState(false);

  const handleConfigChange = useCallback((newConfigStr: string) => {
    try {
      const newConfig = JSON.parse(newConfigStr);
      // Basic validation can be expanded here
      if (newConfig.gtmName && Array.isArray(newConfig.dataCenters)) {
        setConfig(newConfig);
        setError('');
      } else {
        setError('Invalid configuration structure.');
      }
    } catch (e) {
      setError('Invalid JSON format.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 lg:p-8 relative">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">Interactive K8s Architecture Visualizer</h1>
          <p className="text-gray-400 mt-1">Visualize and configure your microservice deployment flow.</p>
        </div>
        <div className="flex items-center gap-4">
           <a href="https://github.com/bkrajendra/infravu" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <GithubIcon />
            </a>
          <button
            onClick={() => setEditorVisible(!isEditorVisible)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          >
            {isEditorVisible ? 'Hide' : 'Show'} Config Editor
          </button>
        </div>
      </header>

      <main className="flex flex-col xl:flex-row gap-8">
        <div className="flex-grow">
          <ArchitectureDiagram config={config} />
        </div>
        {isEditorVisible && (
          <div className="w-full xl:w-1/3 xl:max-w-xl">
            <ConfigEditor
              initialConfig={config}
              onConfigChange={handleConfigChange}
              error={error}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
