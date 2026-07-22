const stub = `data:text/javascript,${encodeURIComponent(
  "export const env = Object.create(null); export class WorkerEntrypoint {}; export class DurableObject {}; export class WorkflowEntrypoint {};",
)}`;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: stub, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
