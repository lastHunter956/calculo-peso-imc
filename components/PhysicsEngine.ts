"use client"

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Particle3DPhysics {
  id: number
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  mass: number
  radius: number
  life: number
  maxLife: number
  size: number
  color: [number, number, number, number]
  rotation: number
  rotationSpeed: number
  elasticity: number
  friction: number
  magnetism: number
  charge: number
  isStatic: boolean
  collisionGroup: number
}

export class PhysicsEngine {
  private particles: Particle3DPhysics[] = []
  private spatialGrid: Map<string, Particle3DPhysics[]> = new Map()
  private gridSize = 0.2
  private bounds: { min: Vector3; max: Vector3 }

  constructor(bounds: { min: Vector3; max: Vector3 }) {
    this.bounds = bounds
  }

  addParticle(particle: Particle3DPhysics): void {
    this.particles.push(particle)
  }

  removeParticle(id: number): void {
    this.particles = this.particles.filter((p) => p.id !== id)
  }

  private getGridKey(position: Vector3): string {
    const x = Math.floor(position.x / this.gridSize)
    const y = Math.floor(position.y / this.gridSize)
    const z = Math.floor(position.z / this.gridSize)
    return `${x},${y},${z}`
  }

  private updateSpatialGrid(): void {
    this.spatialGrid.clear()

    this.particles.forEach((particle) => {
      const key = this.getGridKey(particle.position)
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, [])
      }
      this.spatialGrid.get(key)!.push(particle)
    })
  }

  private getNearbyParticles(particle: Particle3DPhysics): Particle3DPhysics[] {
    const nearby: Particle3DPhysics[] = []
    const baseKey = this.getGridKey(particle.position)
    const [bx, by, bz] = baseKey.split(",").map(Number)

    // Check surrounding grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${bx + dx},${by + dy},${bz + dz}`
          const cellParticles = this.spatialGrid.get(key) || []
          nearby.push(...cellParticles.filter((p) => p.id !== particle.id))
        }
      }
    }

    return nearby
  }

  private distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private normalize(vector: Vector3): Vector3 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
    if (length === 0) return { x: 0, y: 0, z: 0 }
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length,
    }
  }

  private dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  private handleCollision(p1: Particle3DPhysics, p2: Particle3DPhysics): void {
    const dist = this.distance(p1.position, p2.position)
    const minDist = p1.radius + p2.radius

    if (dist < minDist && dist > 0) {
      // Calculate collision normal
      const normal = this.normalize({
        x: p2.position.x - p1.position.x,
        y: p2.position.y - p1.position.y,
        z: p2.position.z - p1.position.z,
      })

      // Separate particles
      const overlap = minDist - dist
      const separation = overlap * 0.5

      if (!p1.isStatic) {
        p1.position.x -= normal.x * separation
        p1.position.y -= normal.y * separation
        p1.position.z -= normal.z * separation
      }

      if (!p2.isStatic) {
        p2.position.x += normal.x * separation
        p2.position.y += normal.y * separation
        p2.position.z += normal.z * separation
      }

      // Calculate relative velocity
      const relativeVelocity = {
        x: p1.velocity.x - p2.velocity.x,
        y: p1.velocity.y - p2.velocity.y,
        z: p1.velocity.z - p2.velocity.z,
      }

      // Calculate relative velocity along normal
      const velocityAlongNormal = this.dot(relativeVelocity, normal)

      // Don't resolve if velocities are separating
      if (velocityAlongNormal > 0) return

      // Calculate restitution (bounce)
      const restitution = Math.min(p1.elasticity, p2.elasticity)

      // Calculate impulse scalar
      let impulse = -(1 + restitution) * velocityAlongNormal
      impulse /= 1 / p1.mass + 1 / p2.mass

      // Apply impulse
      const impulseVector = {
        x: impulse * normal.x,
        y: impulse * normal.y,
        z: impulse * normal.z,
      }

      if (!p1.isStatic) {
        p1.velocity.x += impulseVector.x / p1.mass
        p1.velocity.y += impulseVector.y / p1.mass
        p1.velocity.z += impulseVector.z / p1.mass
      }

      if (!p2.isStatic) {
        p2.velocity.x -= impulseVector.x / p2.mass
        p2.velocity.y -= impulseVector.y / p2.mass
        p2.velocity.z -= impulseVector.z / p2.mass
      }

      // Apply friction
      const tangent = {
        x: relativeVelocity.x - velocityAlongNormal * normal.x,
        y: relativeVelocity.y - velocityAlongNormal * normal.y,
        z: relativeVelocity.z - velocityAlongNormal * normal.z,
      }

      const tangentNormalized = this.normalize(tangent)
      const frictionMagnitude = Math.abs(impulse) * Math.min(p1.friction, p2.friction)

      const frictionImpulse = {
        x: frictionMagnitude * tangentNormalized.x,
        y: frictionMagnitude * tangentNormalized.y,
        z: frictionMagnitude * tangentNormalized.z,
      }

      if (!p1.isStatic) {
        p1.velocity.x -= frictionImpulse.x / p1.mass
        p1.velocity.y -= frictionImpulse.y / p1.mass
        p1.velocity.z -= frictionImpulse.z / p1.mass
      }

      if (!p2.isStatic) {
        p2.velocity.x += frictionImpulse.x / p2.mass
        p2.velocity.y += frictionImpulse.y / p2.mass
        p2.velocity.z += frictionImpulse.z / p2.mass
      }

      // Trigger collision effects
      this.onCollision(p1, p2, normal, impulse)
    }
  }

  private handleMagneticForces(p1: Particle3DPhysics, p2: Particle3DPhysics): void {
    if (p1.collisionGroup !== p2.collisionGroup) return

    const dist = this.distance(p1.position, p2.position)
    if (dist === 0 || dist > 1.0) return

    const direction = this.normalize({
      x: p2.position.x - p1.position.x,
      y: p2.position.y - p1.position.y,
      z: p2.position.z - p1.position.z,
    })

    // Calculate magnetic force (attraction/repulsion)
    const forceMagnitude = (p1.magnetism * p2.magnetism) / (dist * dist + 0.01)
    const chargeInteraction = p1.charge * p2.charge

    // Same charges repel, opposite charges attract
    const finalForce = forceMagnitude * (chargeInteraction < 0 ? 1 : -1) * 0.001

    const force = {
      x: direction.x * finalForce,
      y: direction.y * finalForce,
      z: direction.z * finalForce,
    }

    if (!p1.isStatic) {
      p1.acceleration.x += force.x / p1.mass
      p1.acceleration.y += force.y / p1.mass
      p1.acceleration.z += force.z / p1.mass
    }

    if (!p2.isStatic) {
      p2.acceleration.x -= force.x / p2.mass
      p2.acceleration.y -= force.y / p2.mass
      p2.acceleration.z -= force.z / p2.mass
    }
  }

  private handleBoundaryCollisions(particle: Particle3DPhysics): void {
    // X boundaries
    if (particle.position.x - particle.radius < this.bounds.min.x) {
      particle.position.x = this.bounds.min.x + particle.radius
      particle.velocity.x *= -particle.elasticity
    } else if (particle.position.x + particle.radius > this.bounds.max.x) {
      particle.position.x = this.bounds.max.x - particle.radius
      particle.velocity.x *= -particle.elasticity
    }

    // Y boundaries
    if (particle.position.y - particle.radius < this.bounds.min.y) {
      particle.position.y = this.bounds.min.y + particle.radius
      particle.velocity.y *= -particle.elasticity
    } else if (particle.position.y + particle.radius > this.bounds.max.y) {
      particle.position.y = this.bounds.max.y - particle.radius
      particle.velocity.y *= -particle.elasticity
    }

    // Z boundaries
    if (particle.position.z - particle.radius < this.bounds.min.z) {
      particle.position.z = this.bounds.min.z + particle.radius
      particle.velocity.z *= -particle.elasticity
    } else if (particle.position.z + particle.radius > this.bounds.max.z) {
      particle.position.z = this.bounds.max.z - particle.radius
      particle.velocity.z *= -particle.elasticity
    }
  }

  private onCollision(p1: Particle3DPhysics, p2: Particle3DPhysics, normal: Vector3, impulse: number): void {
    // Create spark effects on collision
    const sparkIntensity = Math.min(Math.abs(impulse) * 10, 1)

    // Color mixing on collision
    if (sparkIntensity > 0.3) {
      const mixFactor = 0.1
      const newColor1: [number, number, number, number] = [
        p1.color[0] * (1 - mixFactor) + p2.color[0] * mixFactor,
        p1.color[1] * (1 - mixFactor) + p2.color[1] * mixFactor,
        p1.color[2] * (1 - mixFactor) + p2.color[2] * mixFactor,
        p1.color[3],
      ]

      const newColor2: [number, number, number, number] = [
        p2.color[0] * (1 - mixFactor) + p1.color[0] * mixFactor,
        p2.color[1] * (1 - mixFactor) + p1.color[1] * mixFactor,
        p2.color[2] * (1 - mixFactor) + p1.color[2] * mixFactor,
        p2.color[3],
      ]

      p1.color = newColor1
      p2.color = newColor2
    }

    // Increase rotation speed on collision
    p1.rotationSpeed += impulse * 0.1
    p2.rotationSpeed += impulse * 0.1
  }

  update(deltaTime: number): void {
    // Update spatial grid
    this.updateSpatialGrid()

    // Reset accelerations
    this.particles.forEach((particle) => {
      particle.acceleration = { x: 0, y: -0.002, z: 0 } // Gravity
    })

    // Handle particle interactions
    this.particles.forEach((particle) => {
      const nearby = this.getNearbyParticles(particle)

      nearby.forEach((other) => {
        if (particle.id < other.id) {
          // Avoid duplicate checks
          this.handleCollision(particle, other)
          this.handleMagneticForces(particle, other)
        }
      })
    })

    // Update particle physics
    this.particles.forEach((particle) => {
      if (particle.isStatic) return

      // Apply acceleration to velocity
      particle.velocity.x += particle.acceleration.x * deltaTime
      particle.velocity.y += particle.acceleration.y * deltaTime
      particle.velocity.z += particle.acceleration.z * deltaTime

      // Apply air resistance
      const airResistance = 0.99
      particle.velocity.x *= airResistance
      particle.velocity.y *= airResistance
      particle.velocity.z *= airResistance

      // Update position
      particle.position.x += particle.velocity.x * deltaTime
      particle.position.y += particle.velocity.y * deltaTime
      particle.position.z += particle.velocity.z * deltaTime

      // Handle boundary collisions
      this.handleBoundaryCollisions(particle)

      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime
      particle.rotationSpeed *= 0.98 // Rotational damping

      // Update life
      particle.life += deltaTime

      // Fade out over time
      const lifeRatio = particle.life / particle.maxLife
      particle.color[3] = (1 - lifeRatio) * 0.8
      particle.size *= 0.999
    })

    // Remove dead particles
    this.particles = this.particles.filter((p) => p.life < p.maxLife && p.size > 0.5)
  }

  getParticles(): Particle3DPhysics[] {
    return this.particles
  }

  clear(): void {
    this.particles = []
    this.spatialGrid.clear()
  }
}
