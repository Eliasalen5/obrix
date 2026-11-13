import {
  HeroAsistente,
  CategoriasDestacadas,
  PreciosCongeladosBanner,
  ParaComerciosCTA,
} from "@/components/home";

export default function Home() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <HeroAsistente />
      <CategoriasDestacadas />
      <PreciosCongeladosBanner />
      <ParaComerciosCTA />
    </main>
  );
}
