const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");
const {
  resourceFromAttributes,
} = require("@opentelemetry/resources");
const {
  ATTR_SERVICE_NAME,
} = require("@opentelemetry/semantic-conventions");

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME || "part-pack-backend",
});

const traceExporter = new OTLPTraceExporter({
  url: "http://jaeger:4318/v1/traces",
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry terminated"))
    .catch((error) => console.error("Error terminating OpenTelemetry:", error))
    .finally(() => process.exit(0));
});