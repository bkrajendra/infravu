
import React, { useState } from 'react';
import type { ArchitectureConfig } from '../constants';

interface ConfigEditorProps {
  initialConfig: ArchitectureConfig;
  onConfigChange: (newConfigStr: string) => void;
  error: string;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ initialConfig, onConfigChange, error }) => {
  const [configStr, setConfigStr] = useState(JSON.stringify(initialConfig, null, 2));

  const handleUpdate = () => {
    onConfigChange(configStr);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-2xl h-full flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-indigo-300">Configuration Editor</h3>
      <textarea
        value={configStr}
        onChange={(e) => setConfigStr(e.target.value)}
        className={`w-full flex-grow bg-gray-900 text-gray-200 p-3 rounded-md font-mono text-sm border-2 ${
          error ? 'border-red-500' : 'border-gray-600'
        } focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition-colors`}
        spellCheck="false"
      />
      {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
      <button
        onClick={handleUpdate}
        className="mt-4 w-full py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!!error}
      >
        Update Diagram
      </button>
    </div>
  );
};
