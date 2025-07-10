"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { PhysicsEngine, type Particle3DPhysics } from "./PhysicsEngine"

interface AdvancedWebGLParticleSystemProps {
  isActive: boolean
  audioType: "hover" | "click" | "success" | "navigation" | "error" | "toggle"
  intensity?: number
  className?: string
  enableCollisions?: boolean
  enableMagnetism?: boolean
}

export function AdvancedWebGLParticleSystem({
  isActive,
  audioType,
  intensity = 1,
  className = "",
  enableCollisions = true,
  enableMagnetism = true,
}: AdvancedWebGLParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const physicsEngineRef = useRef<PhysicsEngine | null>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const particleIdCounter = useRef(0)
  const [webglSupported, setWebglSupported] = useState(true)

  // Enhanced vertex shader with collision effects
  const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec4 a_color;
    attribute float a_size;
    attribute float a_rotation;
    attribute float a_collision_intensity;
    
    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform float u_time;
    
    varying vec4 v_color;
    varying float v_rotation;
    varying float v_collision_intensity;
    
    void main() {
      vec3 pos = a_position;
      
      // Add collision shake effect
      if (a_collision_intensity > 0.0) {
        pos.x += sin(u_time * 0.1 + a_position.x * 10.0) * a_collision_intensity * 0.02;
        pos.y += cos(u_time * 0.12 + a_position.y * 10.0) * a_collision_intensity * 0.02;
      }
      
      // Wave motion
      pos.y += sin(u_time * 0.01 + a_position.x * 0.1) * 0.05;
      pos.x += cos(u_time * 0.008 + a_position.z * 0.1) * 0.03;
      
      gl_Position = u_projection * u_view * vec4(pos, 1.0);
      gl_PointSize = a_size * (1.0 + a_collision_intensity * 0.5);
      
      v_color = a_color;
      v_rotation = a_rotation;
      v_collision_intensity = a_collision_intensity;
    }
  `

  // Enhanced fragment shader with collision effects
  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying float v_rotation;
    varying float v_collision_intensity;
    
    void main() {
      vec2 center = gl_PointCoord - 0.5;
      
      // Rotate the point
      float cos_r = cos(v_rotation);
      float sin_r = sin(v_rotation);
      vec2 rotated = vec2(
        center.x * cos_r - center.y * sin_r,
        center.x * sin_r + center.y * cos_r
      );
      
      float dist = length(rotated);
      
      // Create different shapes based on collision intensity
      float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
      
      // Add collision spark effect
      if (v_collision_intensity > 0.3) {
        float sparkle = sin(dist * 30.0) * 0.5 + 0.5;
        alpha *= (0.5 + sparkle * 0.5);
        
        // Add bright center for collision
        if (dist < 0.1) {
          alpha = 1.0;
        }
      } else {
        // Normal sparkle effect
        float sparkle = sin(dist * 20.0) * 0.5 + 0.5;
        alpha *= (0.7 + sparkle * 0.3);
      }
      
      // Enhance color on collision
      vec3 finalColor = v_color.rgb;
      if (v_collision_intensity > 0.2) {
        finalColor += vec3(0.3, 0.3, 0.3) * v_collision_intensity;
      }
      
      gl_FragColor = vec4(finalColor, v_color.a * alpha);
    }
  `

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }, [])

  const createProgram = useCallback(
    (gl: WebGLRenderingContext) => {
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

      if (!vertexShader || !fragmentShader) return null

      const program = gl.createProgram()
      if (!program) return null

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
      }

      return program
    },
    [createShader],
  )

  const getParticleConfig = useCallback((type: string) => {
    switch (type) {
      case "hover":
        return {
          count: 12,
          color: [0.4, 0.5, 0.6, 0.6],
          speed: 0.015,
          spread: 0.4,
          life: 180,
          size: 6,
          mass: 1.0,
          elasticity: 0.7,
          friction: 0.3,
          magnetism: 0.5,
          charge: 1,
          collisionGroup: 1,
        }
      case "click":
        return {
          count: 20,
          color: [0.3, 0.4, 0.5, 0.8],
          speed: 0.03,
          spread: 0.6,
          life: 150,
          size: 10,
          mass: 1.2,
          elasticity: 0.8,
          friction: 0.2,
          magnetism: 0.7,
          charge: -1,
          collisionGroup: 2,
        }
      case "success":
        return {
          count: 35,
          color: [0.1, 0.8, 0.4, 0.9],
          speed: 0.04,
          spread: 0.8,
          life: 200,
          size: 12,
          mass: 0.8,
          elasticity: 0.9,
          friction: 0.1,
          magnetism: 1.0,
          charge: 1,
          collisionGroup: 3,
        }
      case "navigation":
        return {
          count: 25,
          color: [0.2, 0.5, 0.9, 0.8],
          speed: 0.035,
          spread: 0.7,
          life: 170,
          size: 11,
          mass: 1.1,
          elasticity: 0.75,
          friction: 0.25,
          magnetism: 0.8,
          charge: -1,
          collisionGroup: 4,
        }
      case "error":
        return {
          count: 15,
          color: [0.9, 0.3, 0.3, 0.7],
          speed: 0.025,
          spread: 0.5,
          life: 120,
          size: 8,
          mass: 1.5,
          elasticity: 0.6,
          friction: 0.4,
          magnetism: 0.3,
          charge: 1,
          collisionGroup: 5,
        }
      case "toggle":
        return {
          count: 18,
          color: [0.6, 0.4, 0.9, 0.8],
          speed: 0.03,
          spread: 0.65,
          life: 160,
          size: 9,
          mass: 0.9,
          elasticity: 0.85,
          friction: 0.15,
          magnetism: 0.9,
          charge: -1,
          collisionGroup: 6,
        }
      default:
        return {
          count: 20,
          color: [0.5, 0.5, 0.5, 0.7],
          speed: 0.03,
          spread: 0.6,
          life: 150,
          size: 10,
          mass: 1.0,
          elasticity: 0.7,
          friction: 0.3,
          magnetism: 0.5,
          charge: 1,
          collisionGroup: 1,
        }
    }
  }, [])

  const createParticles = useCallback(
    (config: ReturnType<typeof getParticleConfig>) => {
      if (!physicsEngineRef.current) return

      const particles: Particle3DPhysics[] = []

      for (let i = 0; i < config.count * intensity; i++) {
        const angle = (Math.PI * 2 * i) / (config.count * intensity)
        const radius = Math.random() * config.spread
        const height = (Math.random() - 0.5) * 0.3

        const particle: Particle3DPhysics = {
          id: particleIdCounter.current++,
          position: {
            x: Math.cos(angle) * radius * 0.3,
            y: Math.sin(angle) * radius * 0.3 + height,
            z: (Math.random() - 0.5) * 0.4,
          },
          velocity: {
            x: (Math.random() - 0.5) * config.speed,
            y: Math.random() * config.speed * 0.5,
            z: (Math.random() - 0.5) * config.speed * 0.3,
          },
          acceleration: { x: 0, y: 0, z: 0 },
          mass: config.mass + Math.random() * 0.5,
          radius: config.size / 100 + Math.random() * 0.02,
          life: 0,
          maxLife: config.life + Math.random() * 50,
          size: config.size + Math.random() * 4,
          color: [
            config.color[0] + (Math.random() - 0.5) * 0.2,
            config.color[1] + (Math.random() - 0.5) * 0.2,
            config.color[2] + (Math.random() - 0.5) * 0.2,
            config.color[3],
          ],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05,
          elasticity: config.elasticity + (Math.random() - 0.5) * 0.2,
          friction: config.friction,
          magnetism: enableMagnetism ? config.magnetism : 0,
          charge: config.charge,
          isStatic: false,
          collisionGroup: config.collisionGroup,
        }

        particles.push(particle)
        physicsEngineRef.current.addParticle(particle)
      }

      return particles
    },
    [intensity, enableMagnetism],
  )

  const renderParticles = useCallback(
    (gl: WebGLRenderingContext, program: WebGLProgram, particles: Particle3DPhysics[]) => {
      if (particles.length === 0) return

      // Create projection matrix (perspective)
      const aspect = gl.canvas.width / gl.canvas.height
      const fov = Math.PI / 4
      const near = 0.1
      const far = 100
      const f = Math.tan(Math.PI * 0.5 - 0.5 * fov)
      const rangeInv = 1.0 / (near - far)

      const projection = new Float32Array([
        f / aspect,
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (near + far) * rangeInv,
        -1,
        0,
        0,
        near * far * rangeInv * 2,
        0,
      ])

      // Create view matrix (camera)
      const view = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 1])

      // Set uniforms
      const projectionLocation = gl.getUniformLocation(program, "u_projection")
      const viewLocation = gl.getUniformLocation(program, "u_view")
      const timeLocation = gl.getUniformLocation(program, "u_time")

      gl.uniformMatrix4fv(projectionLocation, false, projection)
      gl.uniformMatrix4fv(viewLocation, false, view)
      gl.uniform1f(timeLocation, timeRef.current)

      // Prepare particle data
      const positions: number[] = []
      const colors: number[] = []
      const sizes: number[] = []
      const rotations: number[] = []
      const collisionIntensities: number[] = []

      particles.forEach((particle) => {
        positions.push(particle.position.x, particle.position.y, particle.position.z)
        colors.push(...particle.color)
        sizes.push(particle.size)
        rotations.push(particle.rotation)

        // Calculate collision intensity based on velocity magnitude
        const velocityMagnitude = Math.sqrt(
          particle.velocity.x * particle.velocity.x +
            particle.velocity.y * particle.velocity.y +
            particle.velocity.z * particle.velocity.z,
        )
        collisionIntensities.push(Math.min(velocityMagnitude * 10, 1))
      })

      // Create and bind buffers
      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

      const positionLocation = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

      const colorBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW)

      const colorLocation = gl.getAttribLocation(program, "a_color")
      gl.enableVertexAttribArray(colorLocation)
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)

      const sizeBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW)

      const sizeLocation = gl.getAttribLocation(program, "a_size")
      gl.enableVertexAttribArray(sizeLocation)
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0)

      const rotationBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, rotationBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rotations), gl.DYNAMIC_DRAW)

      const rotationLocation = gl.getAttribLocation(program, "a_rotation")
      gl.enableVertexAttribArray(rotationLocation)
      gl.vertexAttribPointer(rotationLocation, 1, gl.FLOAT, false, 0, 0)

      const collisionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, collisionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(collisionIntensities), gl.DYNAMIC_DRAW)

      const collisionLocation = gl.getAttribLocation(program, "a_collision_intensity")
      gl.enableVertexAttribArray(collisionLocation)
      gl.vertexAttribPointer(collisionLocation, 1, gl.FLOAT, false, 0, 0)

      // Render particles
      gl.drawArrays(gl.POINTS, 0, particles.length)

      // Cleanup
      gl.deleteBuffer(positionBuffer)
      gl.deleteBuffer(colorBuffer)
      gl.deleteBuffer(sizeBuffer)
      gl.deleteBuffer(rotationBuffer)
      gl.deleteBuffer(collisionBuffer)
    },
    [],
  )

  const animate = useCallback(() => {
    const gl = glRef.current
    const program = programRef.current
    const physicsEngine = physicsEngineRef.current

    if (!gl || !program || !physicsEngine) return

    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016) // Cap at 60fps
    lastTimeRef.current = currentTime

    timeRef.current += 1

    // Clear canvas
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Update physics
    if (enableCollisions) {
      physicsEngine.update(deltaTime * 60) // Scale for consistent physics
    }

    // Get particles from physics engine
    const particles = physicsEngine.getParticles()

    // Render particles
    if (particles.length > 0) {
      renderParticles(gl, program, particles)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [enableCollisions, renderParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) {
        setWebglSupported(false)
        return
      }

      glRef.current = gl as WebGLRenderingContext

      // Set canvas size
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)

      // Enable blending for transparency
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      // Create shader program
      const program = createProgram(gl)
      if (!program) {
        setWebglSupported(false)
        return
      }

      programRef.current = program

      // Initialize physics engine
      const bounds = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 },
      }
      physicsEngineRef.current = new PhysicsEngine(bounds)

      // Start animation loop
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    } catch (error) {
      console.error("WebGL initialization failed:", error)
      setWebglSupported(false)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (physicsEngineRef.current) {
        physicsEngineRef.current.clear()
      }
    }
  }, [createProgram, animate])

  useEffect(() => {
    if (isActive && webglSupported && physicsEngineRef.current) {
      const config = getParticleConfig(audioType)
      createParticles(config)
    }
  }, [isActive, audioType, webglSupported, getParticleConfig, createParticles])

  if (!webglSupported) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-400 ${className}`}>WebGL not supported</div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  )
}
