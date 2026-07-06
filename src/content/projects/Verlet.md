---
title: "Verlet Physics Simulator"
description: "An efficient particle simulator utilizing Verlet Integration."
featured: true
themeColor: "#df8e14"
liveUrl: ""
githubUrl: "https://github.com/lbartron/Verlet"
detailsUrl: ""
devpostUrl: ""
projectTags: ["Physics Simulation", "CMake", "C++", ""]
---
# Project Highlights
### Key Features
**Single thread performance:** The simulator aims to provide optimized performance utilizing only one thread with potential future expansions to include multithreading and gpu utilization.
**Realistic Physics Simulation:** The simulator uses Verlet Integration to simulate the movement of particles over time. 
**2d Visualization:** The project uses the SFML library to provide a visual representation of the simulation so you can see how objects interact.
### Optimizations
**Time Step Control:** The program allows for variable time steps to fine tune a balance between performance and accuracy. 

# Verlet Integration
Verlet Integration is a method used to simulate the motion of particles in physics, commonly used for video game physics or the simulation of rigid bodies. Unlike traditional methods which calculate velocity then update a position, Verlet Integration updates a position based on previous positions and the forces acting on the object.

**Equation**

$$
P_{n+1}= 2P_{n}-P_{n-1}+a_{n} \Delta t^{2}
$$

Where:
- $P$ is the position of the particle at time $n$ 
- $a$ is the acceleration at position $n$
- $\Delta t$ is the time step

The equation calculates the future position of a particle using its current and previous positions and the forces, or accelerations, acting on it.
# How to Use
### Prerequisites
This project uses the C++ library, SFML in order to visualize the physics simulation. SFML must be locally installed in order to use the program. The GitHub link for it is [here](https://github.com/SFML/SFML).

On Linux you can use your package manager
```
sudo apt-get install libsfml-dev
```
On Windows you can download it from SFML's website [here](https://www.sfml-dev.org/download/).

### Building The Project
CMake is used to build the project. Follow these steps to compile the project on your system:
Clone the repository:
```
git clone 
cd 
```
Create a build directory and navigate to it:
```
mkdir build
cd build
```
Run CMake to generate the needed build files:
```
cmake ..
```
Build the project using CMake:
```
cmake --build
```
Once build, you can run the executable from the build directory
```
./VerletPhysicsSimulator
```