"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface Particle3D {
  position: [number, number, number]
  velocity: [number, number, number]
  acceleration: [number, number, number]
  life: number
  maxLife: number
  size: number
  color: [number, number, number, number]
  rotation: number
  rotationSpeed: number
}

interface WebGLParticleSystemProps {
  isActive: boolean
  audioType: "hover" | "click" | "success" | "navigation" | "error" | "toggle"
  intensity?: number
  className?: string
}

export function WebGLParticleSystem({ isActive, audioType, intensity = 1, className = "" }: WebGLParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const particlesRef = useRef<Particle3D[]>([])
  const animationRef = useRef<number>()
  const timeRef = useRef(0)
  const [webglSupported, setWebglSupported] = useState(true)

  // Vertex shader source
  const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec4 a_color;
    attribute float a_size;
    attribute float a_rotation;
    
    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform float u_time;
    
    varying vec4 v_color;
    varying float v_rotation;
    
    void main() {
      // Apply some wave motion based on time
      vec3 pos = a_position;
      pos.y += sin(u_time * 0.01 + a_position.x * 0.1) * 0.1;
      pos.x += cos(u_time * 0.008 + a_position.z * 0.1) * 0.05;
      
      gl_Position = u_projection * u_view * vec4(pos, 1.0);
      gl_PointSize = a_size;
      
      v_color = a_color;
      v_rotation = a_rotation;
    }
  `

  // Fragment shader source
  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying float v_rotation;
    
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
      
      // Create different shapes based on distance
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      
      // Add some sparkle effect
      float sparkle = sin(dist * 20.0) * 0.5 + 0.5;
      alpha *= (0.7 + sparkle * 0.3);
      
      gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
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
          count: 15,
          color: [0.4, 0.5, 0.6, 0.6],
          speed: 0.02,
          spread: 0.5,
          life: 120,
          size: 8,
          gravity: -0.001,
        }
      case "click":
        return {
          count: 25,
          color: [0.3, 0.4, 0.5, 0.8],
          speed: 0.04,
          spread: 0.8,
          life: 100,
          size: 12,
          gravity: -0.002,
        }
      case "success":
        return {
          count: 50,
          color: [0.1, 0.8, 0.4, 0.9],
          speed: 0.06,
          spread: 1.2,
          life: 150,
          size: 15,
          gravity: -0.001,
        }
      case "navigation":
        return {
          count: 35,
          color: [0.2, 0.5, 0.9, 0.8],
          speed: 0.05,
          spread: 1.0,
          life: 130,
          size: 13,
          gravity: -0.0015,
        }
      case "error":
        return {
          count: 20,
          color: [0.9, 0.3, 0.3, 0.7],
          speed: 0.03,
          spread: 0.6,
          life: 90,
          size: 10,
          gravity: -0.003,
        }
      case "toggle":
        return {
          count: 30,
          color: [0.6, 0.4, 0.9, 0.8],
          speed: 0.045,
          spread: 0.9,
          life: 110,
          size: 11,
          gravity: -0.0018,
        }
      default:
        return {
          count: 25,
          color: [0.5, 0.5, 0.5, 0.7],
          speed: 0.04,
          spread: 0.8,
          life: 100,
          size: 12,
          gravity: -0.002,
        }
    }
  }, [])

  const createParticles = useCallback(
    (config: ReturnType<typeof getParticleConfig>) => {
      const particles: Particle3D[] = []

      for (let i = 0; i < config.count * intensity; i++) {
        const angle = (Math.PI * 2 * i) / (config.count * intensity)
        const radius = Math.random() * config.spread

        particles.push({
          position: [Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3, (Math.random() - 0.5) * 0.5],
          velocity: [
            (Math.random() - 0.5) * config.speed,
            Math.random() * config.speed * 0.5,
            (Math.random() - 0.5) * config.speed * 0.3,
          ],
          acceleration: [0, config.gravity, 0],
          life: 0,
          maxLife: config.life + Math.random() * 50,
          size: config.size + Math.random() * 5,
          color: [
            config.color[0] + (Math.random() - 0.5) * 0.2,
            config.color[1] + (Math.random() - 0.5) * 0.2,
            config.color[2] + (Math.random() - 0.5) * 0.2,
            config.color[3],
          ],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
        })
      }

      return particles
    },
    [intensity],
  )

  const updateParticles = useCallback((particles: Particle3D[]) => {
    return particles.filter((particle) => {
      // Update physics
      particle.velocity[0] += particle.acceleration[0]
      particle.velocity[1] += particle.acceleration[1]
      particle.velocity[2] += particle.acceleration[2]

      particle.position[0] += particle.velocity[0]
      particle.position[1] += particle.velocity[1]
      particle.position[2] += particle.velocity[2]

      particle.rotation += particle.rotationSpeed
      particle.life++

      // Fade out over time
      const lifeRatio = particle.life / particle.maxLife
      particle.color[3] = (1 - lifeRatio) * 0.8
      particle.size *= 0.995

      // Add some turbulence
      particle.velocity[0] += (Math.random() - 0.5) * 0.001
      particle.velocity[2] += (Math.random() - 0.5) * 0.001

      return particle.life < particle.maxLife && particle.size > 0.5
    })
  }, [])

  const renderParticles = useCallback((gl: WebGLRenderingContext, program: WebGLProgram, particles: Particle3D[]) => {
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

    particles.forEach((particle) => {
      positions.push(...particle.position)
      colors.push(...particle.color)
      sizes.push(particle.size)
      rotations.push(particle.rotation)
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

    // Render particles
    gl.drawArrays(gl.POINTS, 0, particles.length)

    // Cleanup
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(colorBuffer)
    gl.deleteBuffer(sizeBuffer)
    gl.deleteBuffer(rotationBuffer)
  }, [])

  const animate = useCallback(() => {
    const gl = glRef.current
    const program = programRef.current

    if (!gl || !program) return

    timeRef.current += 1

    // Clear canvas
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current)

    // Render particles
    if (particlesRef.current.length > 0) {
      renderParticles(gl, program, particlesRef.current)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [updateParticles, renderParticles])

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

      // Start animation loop
      animationRef.current = requestAnimationFrame(animate)
    } catch (error) {
      console.error("WebGL initialization failed:", error)
      setWebglSupported(false)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [createProgram, animate])

  useEffect(() => {
    if (isActive && webglSupported) {
      const config = getParticleConfig(audioType)
      const newParticles = createParticles(config)
      particlesRef.current = [...particlesRef.current, ...newParticles]
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
