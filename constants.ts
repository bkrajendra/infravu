
import type { ArchitectureConfig } from './types';

export const INITIAL_CONFIG: ArchitectureConfig = {
  gtmName: "GTM - Global Traffic Manager",
  dataCenters: [
    {
      name: "OCE Datacenter",
      mPaasName: "mPAAS (Reverse Proxy)",
      namespace: {
        name: "production-namespace",
        ltmName: "LTM - Local Traffic Manager",
        groups: [
          {
            name: "BASE",
            services: [
              { name: "base-ui" },
              { name: "base-service" },
              { name: "base-uiconfig" },
            ],
          },
          {
            name: "IAP",
            services: [
              { name: "iap-datacollection" },
              { name: "cag-action" },
            ],
          },
          {
            name: "INDENTITY-NALYTICS",
            services: [
              { name: "ia-ui" },
              { name: "ia-processing" },
            ],
          },
        ],
      },
    },
    {
      name: "OCC Datacenter",
      mPaasName: "mPAAS (Reverse Proxy)",
      namespace: {
        name: "production-namespace",
        ltmName: "LTM - Local Traffic Manager",
        groups: [
            {
                name: "STUDIOS",
                services: [
                  { name: "studios-ui" },
                  { name: "iam-rolestudios" },
                ],
              },
              {
                name: "DSP",
                services: [
                  { name: "dsp-ui" },
                  { name: "dsp-service" },
                ],
              },
        ],
      },
    },
  ],
};
