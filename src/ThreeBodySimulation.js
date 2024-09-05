import React, { useRef, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';

extend({ Line_: THREE.Line });

const Particle = ({ position, color }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color={color} />
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
    timeStep
  } = useControls({
    G: { value: 0.5, min: 0, max: 2, step: 0.1 },
    useRepulsion: { value: true },
    repelThreshold: { value: 2, min: 0, max: 5, step: 0.1 },
    trailLength: { value: 100, min: 10, max: 500, step: 10 },
    showForces: true,
    timeStep: { value: 0.01, min: 0.001, max: 0.1, step: 0.001 }
  });

  const [particles, setParticles] = useState([
    { position: [2, 0, 0], velocity: [0, 0.1, 0], color: 'red', trail: [] },
    { position: [-2, 0, 0], velocity: [0, -0.1, 0], color: 'green', trail: [] },
    { position: [0, 2, 0], velocity: [0.1, 0, 0], color: 'blue', trail: [] },
  ]);

  const [forces, setForces] = useState([]);

  useFrame(() => {
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

            let force = G / distanceSquared;
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
                  particle.position[0] + forceVector[0] * 10,
                  particle.position[1] + forceVector[1] * 10,
                  particle.position[2] + forceVector[2] * 10
                ],
                color: useRepulsion && distance < repelThreshold ? 'purple' : 'yellow'
              });
            }
          }
        });

        const newVelocity = [
          particle.velocity[0] + totalForce[0] * timeStep,
          particle.velocity[1] + totalForce[1] * timeStep,
          particle.velocity[2] + totalForce[2] * timeStep
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

      return newParticles;
    });
  });

  return (
    <>
      {particles.map((particle, index) => (
        <React.Fragment key={index}>
          <Particle position={particle.position} color={particle.color} />
          <Trail positions={particle.trail} color={particle.color} />
        </React.Fragment>
      ))}
      {showForces && forces.map((force, index) => (
        <Force key={index} {...force} />
      ))}
    </>
  );
};

const ThreeBodySimulation = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <ParticleSystem />
      <OrbitControls />
      <Text
        position={[0, 3.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Three Body Simulation
      </Text>
    </Canvas>
  );
};

export default ThreeBodySimulation;