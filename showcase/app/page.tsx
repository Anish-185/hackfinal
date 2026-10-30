import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Pipeline from "@/components/Pipeline";
import TrailMap from "@/components/TrailMap";
import Tiers from "@/components/Tiers";
import Trust from "@/components/Trust";
import Assistant from "@/components/Assistant";
import Product from "@/components/Product";
import Progress from "@/components/Progress";
import Stack from "@/components/Stack";
import Team from "@/components/Team";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <TrailMap />
        <Tiers />
        <Trust />
        <Product />
        <Assistant />
        <Progress />
        <Stack />
      </main>
      <Team />
    </>
  );
}
