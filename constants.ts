import type { ArchitectureConfig } from "./types";

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
              { name: "iap-dataservices" },
              { name: "iap-governance" },
              { name: "iap-datapublishing" },
              { name: "iap-dat" },
              { name: "cag-common" },
              { name: "cag-action" },
              { name: "cag-task" },
              { name: "cag-event" },
            ],
          },
          {
            name: "IDENTITY-ANALYTICS",
            services: [{ name: "ia-ui" }, { name: "ia-processing" }],
          },
          {
            name: "Studios",
            services: [
              { name: "studios-ui" },
              { name: "studios-processing" },
              { name: "iam-entstudios" },
              { name: "iam-rolestudios" },
            ],
          },
          {
            name: "DSP",
            services: [
              { name: "dsp-ui" },
              { name: "dsp-service" },
              { name: "dsp-batch" },
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
              { name: "iap-dataservices" },
              { name: "iap-governance" },
              { name: "iap-datapublishing" },
              { name: "iap-dat" },
              { name: "cag-common" },
              { name: "cag-action" },
              { name: "cag-task" },
              { name: "cag-event" },
            ],
          },
          {
            name: "IDENTITY-ANALYTICS",
            services: [{ name: "ia-ui" }, { name: "ia-processing" }],
          },
          {
            name: "STUDIOS",
            services: [
              { name: "studios-ui" },
              { name: "studios-processing" },
              { name: "iam-entstudios" },
              { name: "iam-rolestudios" },
            ],
          },
          {
            name: "DSP",
            services: [
              { name: "dsp-ui" },
              { name: "dsp-service" },
              { name: "dsp-batch" },
            ],
          },
        ],
      },
    },
  ],
};
