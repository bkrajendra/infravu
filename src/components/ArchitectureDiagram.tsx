
import React, { useState } from 'react';
import type { ArchitectureConfig, DataCenter as IDataCenter, Microservice as IMicroservice, Namespace as INamespace, ServiceGroup as IServiceGroup } from '../constants';
import { ChevronDownIcon, ChevronRightIcon, DeploymentIcon, ServiceIcon } from './icons';

interface ArchitectureDiagramProps {
  config: ArchitectureConfig;
}

const Connector = ({ isHorizontal = false, isVertical = false, className = '' }) => {
  if (isHorizontal) {
    return <div className={`flex-grow border-t-2 border-dashed border-sky-600 ${className}`}></div>;
  }
  if (isVertical) {
    return <div className={`w-0.5 h-8 bg-sky-600 border-dashed ${className}`}></div>;
  }
  return null;
};

const Box: React.FC<{ title: string; children: React.ReactNode; className?: string, titleClassName?:string, URL?:string }> = ({ title, children, className = '', titleClassName = '',URL = '' }) => (
  <div className={`bg-gray-800 border-2 border-gray-600 rounded-xl p-4 shadow-lg flex flex-col items-center w-full ${className}`}>
    <div className={`text-sm font-bold text-cyan-400 mb-4 px-3 py-1 bg-gray-700 rounded-md ${titleClassName}`}>{title}</div>
    <div className={`text-sm font-bold text-cyan-400 mb-4 px-3 bg-gray-700 rounded-md ${titleClassName}`}>{URL}</div>
    {/* <h2 className={`text-sm font-bold text-cyan-400 mb-4 px-3 py-1 bg-gray-700 rounded-md`}>{URL}</h2> */}
    {children}
  </div>
);

const Microservice: React.FC<{ service: IMicroservice }> = ({ service }) => (
    <div className="flex items-center gap-4 bg-gray-700 p-3 rounded-lg w-full transform transition-transform hover:scale-105 hover:bg-gray-600">
        <div className="flex-shrink-0 text-teal-400"><DeploymentIcon/></div>
        <span className="text-gray-200 font-medium flex-grow">{service.name}</span>
        <div className="flex-shrink-0 text-indigo-400"><ServiceIcon/></div>
    </div>
);

const ServiceGroup: React.FC<{ group: IServiceGroup }> = ({ group }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 w-full my-2 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left font-semibold text-lg text-indigo-300 hover:text-indigo-200"
      >
        <span>{group.name}</span>
        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </button>
      {isExpanded && (
        <div className="mt-4 space-y-3 pl-2 border-l-2 border-gray-500 ml-2">
          {group.services.map((service) => (
            <Microservice key={service.name} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

const Namespace: React.FC<{ namespace: INamespace }> = ({ namespace }) => (
  <Box title={namespace.name} className="border-purple-500 w-full" titleClassName="bg-purple-800/50 text-purple-300" >
    <div className="w-full flex flex-col items-center">
        <Box title={namespace.ltmName} className="bg-gray-900/40 border-teal-500 w-full mb-4" titleClassName="bg-teal-800/50 text-teal-300">
            <div className="w-full flex flex-col items-center">
                <Connector isVertical />
                <div className="w-full">
                {namespace.groups.map((group) => (
                    <ServiceGroup key={group.name} group={group} />
                ))}
                </div>
            </div>
        </Box>
    </div>
  </Box>
);

const DataCenter: React.FC<{ datacenter: IDataCenter }> = ({ datacenter }) => (
  <Box title={datacenter.name} className="border-sky-500 flex-1 min-w-[400px]" titleClassName='bg-sky-800/50 text-sky-300'>
    <div className="w-full flex flex-col items-center">
        <Box title={datacenter.mPaasName} className="bg-gray-900/40 border-indigo-500 w-full" titleClassName="bg-indigo-800/50 text-indigo-300" URL={datacenter.mPaasURL}>
            <Connector isVertical />
            <Namespace namespace={datacenter.namespace} />
        </Box>
    </div>
  </Box>
);


export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ config }) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full p-4 bg-gray-900/50 rounded-lg">
      <Box title={config.gtmName} className="max-w-md" titleClassName="bg-cyan-800/50 text-cyan-300" URL={config.gtmURL}>
        <Connector isVertical />
      </Box>

      <div className="w-full flex justify-center items-stretch relative">
        {config.dataCenters.length > 1 && (
            <div className="absolute top-[-16px] left-0 right-0 flex justify-center">
                <div className="w-1/2 h-0.5 bg-sky-600 border-dashed"></div>
            </div>
        )}
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
          {config.dataCenters.map((dc) => (
            <DataCenter key={dc.name} datacenter={dc} />
          ))}
        </div>
      </div>
    </div>
  );
};
