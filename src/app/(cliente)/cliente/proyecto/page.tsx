import ProyectoWizard from "./ProyectoWizard";

export default function NuevoProyectoPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Nuevo proyecto</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Contá qué querés hacer, ajustá los materiales y comparé comercios.
      </p>
      <div className="mt-6">
        <ProyectoWizard />
      </div>
    </div>
  );
}
