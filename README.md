# 3D N-Body particles system

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) to test the capbilities of R3F particle system
I've added several new features to enhance the simulation:

Variable number of particles:

Added a particleCount control to allow users to change the number of particles (2 to 10).
Implemented generateInitialParticles function to create random initial conditions.


Particle mass:

Each particle now has a random mass between 0.5 and 2.5.
Particle size is now proportional to its mass (cube root scaling).
Force calculations now take mass into account (F = G * m1 * m2 / r^2).


Center of mass visualization:

Calculated and displayed the center of mass as a white sphere.
Added a line from the origin to the center of mass.


Pause/Resume functionality:

Added a pause toggle to stop and resume the simulation.


Reset button:

Added a "Reset Simulation" button to generate new random initial conditions.


Orbit toggling:

Added a showOrbits toggle to show/hide particle trails.


Mass labels:

Each particle now displays its mass value above it.


Improved force visualization:

Force arrows are now scaled inversely with particle mass to better represent acceleration.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.
