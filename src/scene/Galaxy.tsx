import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { GalaxyDisk } from './galaxy-disk'
import { Core, Flare } from './core'
import { Nebula, SpaceGrid, Meteors } from './environment'
import { WarpDust, Sparks } from './particles'
import { Headline } from './headline'
import { WireWords } from './wire-words'
import { Intro, Rig, Fx } from './director'

/* ─── the scene · one persistent fixed canvas behind the whole page ───
   composition order = render order:
     Stars/Meteors/Nebula  deep background
     Rig                   the tilted galaxy plane the camera flies around
     Flare/WarpDust        screen-space depth (dust in FRONT of the headline)
     Headline              the title lives IN the cosmos (not a DOM layer)
     Fx                    bloom · CRT chromatic · scanline · grain · vignette */
export default function Galaxy3D() {
  return (
    <Canvas
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.5, 11], fov: 50 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={['#030617']} />
      <fog attach="fog" args={['#030617', 10, 30]} />
      <Stars radius={160} depth={90} count={4500} factor={3.5} saturation={0} fade speed={0.3} />
      <Intro />
      <Meteors />
      <Rig>
        <Nebula />
        <SpaceGrid />
        <GalaxyDisk />
        <Core />
        <Sparks />
      </Rig>
      <Flare />
      <WarpDust />
      <Headline />
      <WireWords />
      <Fx />
    </Canvas>
  )
}
