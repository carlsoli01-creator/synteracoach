import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorBendsProps {
  colors?: string[];
  rotation?: number;
  speed?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  transparent?: boolean;
  autoRotate?: number;
  color?: string;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uFrequency;
  uniform float uWarpStrength;
  uniform float uNoise;
  uniform float uScale;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  
  varying vec2 vUv;
  
  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    vec2 uv = vUv * uScale;
    
    // Mouse influence
    vec2 mouseOffset = (uMouse - 0.5) * uMouseInfluence * 0.3;
    uv += mouseOffset;
    
    // Warp
    float n1 = snoise(uv * uFrequency + uTime * 0.3);
    float n2 = snoise(uv * uFrequency * 1.5 - uTime * 0.2);
    float n3 = snoise(uv * uFrequency * 0.5 + uTime * 0.15);
    
    vec2 warp = vec2(n1, n2) * uWarpStrength;
    uv += warp;
    
    // Color mixing
    float blend1 = snoise(uv * 0.8 + uTime * 0.1) * 0.5 + 0.5;
    float blend2 = snoise(uv * 1.2 - uTime * 0.15 + 3.0) * 0.5 + 0.5;
    
    // Noise grain
    float grain = snoise(vUv * 200.0 + uTime) * uNoise;
    
    vec3 col = mix(uColor1, uColor2, blend1);
    col = mix(col, uColor3, blend2 * 0.6);
    col += grain;
    
    // Subtle vignette
    float vig = 1.0 - length((vUv - 0.5) * 1.2);
    vig = smoothstep(0.0, 0.7, vig);
    col *= 0.7 + vig * 0.3;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

function ColorBendsMesh({
  colors = ['#ff5c7a', '#8a5cff', '#00ffd1'],
  speed = 0.2,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  noise = 0.1,
}: Omit<ColorBendsProps, 'transparent' | 'autoRotate' | 'color' | 'rotation' | 'parallax'>) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(colors[0]) },
    uColor2: { value: new THREE.Color(colors[1]) },
    uColor3: { value: new THREE.Color(colors[2]) },
    uFrequency: { value: frequency },
    uWarpStrength: { value: warpStrength },
    uNoise: { value: noise },
    uScale: { value: scale },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseInfluence: { value: mouseInfluence },
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta * speed;
    mat.uniforms.uMouse.value.lerp(
      new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
      0.05
    );
  });

  return (
    <mesh
      ref={meshRef}
      scale={[2, 2, 1]}
      onPointerMove={(e) => {
        if (e.uv) {
          mouseRef.current = { x: e.uv.x, y: e.uv.y };
        }
      }}
    >
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ColorBends(props: ColorBendsProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 1], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: false }}
    >
      <ColorBendsMesh {...props} />
    </Canvas>
  );
}
