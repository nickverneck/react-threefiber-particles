import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Line, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useControls, button } from 'leva';

extend({ Line_: THREE.Line });
const WireframeBackground = () => {
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial color="white" wireframe={true} transparent={true} opacity={0.1} />
    </mesh>
  );
};
const Particle = ({ position, color, mass, glow }) => {
  const meshRef = useRef();
  const size = Math.cbrt(mass) * 0.2;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshPhongMaterial 
        color={color} 
        emissive={glow ? color : 'black'} 
        emissiveIntensity={glow ? 0.5 : 0}
        shininess={glow ? 15 : 0}
      />
      <Html distanceFactor={10}>
        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 5px', borderRadius: '3px' }}>
          Mass: {mass.toFixed(2)}
        </div>
      </Html>
    </mesh>
  );
};

const Trail = ({ positions, color }) => {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.geometry.setFromPoints(positions.map(p => new THREE.Vector3(...p)));
    }
  });

  return (
    <line_ ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color={color} />
    </line_>
  );
};

const Force = ({ start, end, color }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  return <Line points={points} color={color} lineWidth={1} />;
};

const ParticleSystem = () => {
  const {
    G,
    useRepulsion,
    repelThreshold,
    trailLength,
    showForces,
    timeStep,
    particleCount,
    showOrbits,
    pause,
    glowingParticles
  } = useControls({
    G: { value: 0.5, min: 0, max: 2, step: 0.1 },
    useRepulsion: { value: true },
    repelThreshold: { value: 2, min: 0, max: 5, step: 0.1 },
    trailLength: { value: 100, min: 10, max: 500, step: 10 },
    showForces: true,
    timeStep: { value: 0.01, min: 0.001, max: 0.1, step: 0.001 },
    particleCount: { value: 3, min: 2, max: 100, step: 1 },
    showOrbits: false,
    pause: false,
    glowingParticles: true,
    resetSimulation: button(() => setParticles(generateInitialParticles(particleCount)))
  });

  const generateInitialParticles = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ],
      velocity: [
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ],
      color: `hsl(${(i / count) * 360}, 100%, 50%)`,
      mass: Math.random() * 2 + 0.5,
      trail: []
    }));
  };

  const [particles, setParticles] = useState(() => generateInitialParticles(particleCount));
  const [forces, setForces] = useState([]);
  const [centerOfMass, setCenterOfMass] = useState([0, 0, 0]);

  useEffect(() => {
    setParticles(generateInitialParticles(particleCount));
  }, [particleCount]);

  useFrame(() => {
    if (pause) return;

    setParticles(prevParticles => {
      const newParticles = prevParticles.map((particle, i) => {
        let totalForce = [0, 0, 0];
        const particleForces = [];

        prevParticles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = otherParticle.position[0] - particle.position[0];
            const dy = otherParticle.position[1] - particle.position[1];
            const dz = otherParticle.position[2] - particle.position[2];
            const distanceSquared = dx * dx + dy * dy + dz * dz;
            const distance = Math.sqrt(distanceSquared);

            let force = G * particle.mass * otherParticle.mass / distanceSquared;
            if (useRepulsion && distance < repelThreshold) {
              force *= -1;
            }

            const forceVector = [
              force * dx / distance,
              force * dy / distance,
              force * dz / distance
            ];

            totalForce[0] += forceVector[0];
            totalForce[1] += forceVector[1];
            totalForce[2] += forceVector[2];

            if (showForces) {
              particleForces.push({
                start: particle.position,
                end: [
                  particle.position[0] + forceVector[0] * 10 / particle.mass,
                  particle.position[1] + forceVector[1] * 10 / particle.mass,
                  particle.position[2] + forceVector[2] * 10 / particle.mass
                ],
                color: useRepulsion && distance < repelThreshold ? 'purple' : 'yellow'
              });
            }
          }
        });

        const acceleration = [
          totalForce[0] / particle.mass,
          totalForce[1] / particle.mass,
          totalForce[2] / particle.mass
        ];

        const newVelocity = [
          particle.velocity[0] + acceleration[0] * timeStep,
          particle.velocity[1] + acceleration[1] * timeStep,
          particle.velocity[2] + acceleration[2] * timeStep
        ];

        const newPosition = [
          particle.position[0] + newVelocity[0] * timeStep,
          particle.position[1] + newVelocity[1] * timeStep,
          particle.position[2] + newVelocity[2] * timeStep
        ];

        const newTrail = [...particle.trail, newPosition].slice(-trailLength);

        return { 
          ...particle, 
          position: newPosition, 
          velocity: newVelocity, 
          trail: newTrail,
          forces: particleForces 
        };
      });

      const newForces = newParticles.flatMap(particle => particle.forces);
      setForces(newForces);

      // Calculate center of mass
      const totalMass = newParticles.reduce((sum, p) => sum + p.mass, 0);
      const com = newParticles.reduce((sum, p) => [
        sum[0] + p.position[0] * p.mass / totalMass,
        sum[1] + p.position[1] * p.mass / totalMass,
        sum[2] + p.position[2] * p.mass / totalMass
      ], [0, 0, 0]);
      setCenterOfMass(com);

      return newParticles;
    });
  });

  return (
    <>
      {particles.map((particle, index) => (
        <React.Fragment key={index}>
          <Particle 
            position={particle.position} 
            color={particle.color} 
            mass={particle.mass} 
            glow={glowingParticles}
          />
          {showOrbits && <Trail positions={particle.trail} color={particle.color} />}
        </React.Fragment>
      ))}
      {showForces && forces.map((force, index) => (
        <Force key={index} {...force} />
      ))}
      <mesh position={centerOfMass}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <Line points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(...centerOfMass)]} color="white" lineWidth={1} />
    </>
  );
};

const ThreeBodySimulation = () => {
  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
    <color attach="background" args={['black']} />
    <WireframeBackground />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <ParticleSystem />
      <OrbitControls />
      <Text
        position={[0, 5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        3D N-Body Simulation
      </Text>
      
    </Canvas>
  );
};

export default ThreeBodySimulation;