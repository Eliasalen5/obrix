const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const sharedLib = path.resolve(workspaceRoot, "src/lib");

const config = getDefaultConfig(projectRoot);

// Observa solo el código compartido (src/lib), no todo el repo: en Windows
// observar la raíz (con su node_modules y .next) cuelga el arranque de Metro.
config.watchFolders = [sharedLib];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "@shared": sharedLib,
  "@/lib": sharedLib,
  "@": path.resolve(projectRoot, "src"),
};

// Los clientes/validadores compartidos usan el alias de la web `@/lib/*`.
// Metro no soporta comodines en paths, así que lo reescribimos a `@shared/*`
// (que ya está mapeado arriba) para reutilizar el mismo código sin duplicar.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolved = moduleName.startsWith("@/lib/")
    ? `@shared/${moduleName.slice("@/lib/".length)}`
    : moduleName;

  const resolver = originalResolveRequest || context.resolveRequest;
  return resolver(context, resolved, platform);
};

module.exports = config;
