
export interface Microservice {
  name: string;
}

export interface ServiceGroup {
  name: string;
  services: Microservice[];
}

export interface Namespace {
  name: string;
  ltmName: string;
  groups: ServiceGroup[];
}

export interface DataCenter {
  name:string;
  mPaasName: string;
  namespace: Namespace;
}

export interface ArchitectureConfig {
  gtmName: string;
  dataCenters: DataCenter[];
}
