import {
  HeroAsistente,
  CategoriasDestacadas,
  PreciosCongeladosBanner,
  ParaComerciosCTA,
} from "@/components/home";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroAsistente />
      <CategoriasDestacadas />
      <PreciosCongeladosBanner />
      <ParaComerciosCTA />
    </main>
  );
}
