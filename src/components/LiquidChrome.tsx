import { useEffect, useRef } from "react";

interface LiquidChromeProps {
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  interactive?: boolean;
}

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uAmplitude;
  uniform float uFrequencyX;
  uniform float uFrequencyY;
  uniform vec2 uMouse;
  uniform float uInteractive;

  #define PI 3.14159265359

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    float t = uTime;

    // Liquid distortion
    float nx = fbm(vec2(p.x * uFrequencyX + t * 0.3, p.y * uFrequencyY + t * 0.2));
    float ny = fbm(vec2(p.y * uFrequencyX - t * 0.25, p.x * uFrequencyY + t * 0.35));

    p += vec2(nx, ny) * uAmplitude;

    // Chrome-like reflections
    float r1 = fbm(p * 1.5 + t * 0.1);
    float r2 = fbm(p * 2.0 - t * 0.15 + vec2(5.2, 1.3));
    float r3 = fbm(p * 1.8 + t * 0.12 + vec2(1.7, 9.2));

    // Metallic color palette
    vec3 col1 = vec3(0.15, 0.15, 0.2);  // Dark base
    vec3 col2 = vec3(0.4, 0.4, 0.5);    // Mid chrome
    vec3 col3 = vec3(0.7, 0.75, 0.85);  // Light chrome
    vec3 col4 = vec3(0.95, 0.95, 1.0);  // Highlight

    vec3 color = mix(col1, col2, smoothstep(0.2, 0.5, r1));
    color = mix(color, col3, smoothstep(0.4, 0.7, r2));
    color = mix(color, col4, smoothstep(0.6, 0.85, r3));

    // Add subtle iridescence
    float iridescence = sin(r1 * PI * 3.0 + t * 0.5) * 0.5 + 0.5;
    color += vec3(0.05, 0.02, 0.08) * iridescence;

    // Specular highlights
    float spec = pow(max(r3, 0.0), 4.0);
    color += vec3(0.3) * spec;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function LiquidChrome({
  speed = 0.25,
  amplitude = 0.3,
  frequencyX = 3,
  frequencyY = 3,
  interactive = false,
}: LiquidChromeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    // Compile shaders
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "uTime");
    const uRes = gl.getUniformLocation(program, "uResolution");
    const uAmp = gl.getUniformLocation(program, "uAmplitude");
    const uFx = gl.getUniformLocation(program, "uFrequencyX");
    const uFy = gl.getUniformLocation(program, "uFrequencyY");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uInter = gl.getUniformLocation(program, "uInteractive");

    gl.uniform1f(uAmp, amplitude);
    gl.uniform1f(uFx, frequencyX);
    gl.uniform1f(uFy, frequencyY);
    gl.uniform1f(uInter, interactive ? 1.0 : 0.0);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", handleMouse);

    const startTime = performance.now();
    function render() {
      const t = (performance.now() - startTime) * 0.001 * speed;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [speed, amplitude, frequencyX, frequencyY, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
