import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GEOGRAPHIC_REGIONS, GEOGRAPHIC_BORDERS, getThreatLevelColor } from '../../services/geographicData';

const EARTH_AXIAL_TILT = THREE.MathUtils.degToRad(23.4);
const DAY_SECONDS = 86400;
const ZOOM_DETAIL_THRESHOLD = 1.5; // Zoom level at which details show
const DEEP_ZOOM_THRESHOLD = 2.0; // Zoom for maximum detail

const HOTSPOTS = [
  { name: 'New York', lat: 40.7, lng: -74, activity: 0.95 },
  { name: 'London', lat: 51.5, lng: -0.1, activity: 0.9 },
  { name: 'Tokyo', lat: 35.7, lng: 139.7, activity: 0.88 },
  { name: 'Beijing', lat: 39.9, lng: 116.4, activity: 0.85 },
  { name: 'Mumbai', lat: 19.1, lng: 72.9, activity: 0.75 },
  { name: 'Sydney', lat: -33.9, lng: 151.2, activity: 0.7 },
  { name: 'Dubai', lat: 25.2, lng: 55.3, activity: 0.72 },
  { name: 'Singapore', lat: 1.3, lng: 103.8, activity: 0.82 },
  { name: 'Sao Paulo', lat: -23.5, lng: -46.6, activity: 0.68 },
  { name: 'Moscow', lat: 55.8, lng: 37.6, activity: 0.78 },
  { name: 'Los Angeles', lat: 34.1, lng: -118.2, activity: 0.85 },
  { name: 'Berlin', lat: 52.5, lng: 13.4, activity: 0.72 },
  { name: 'Seoul', lat: 37.6, lng: 127, activity: 0.8 },
  { name: 'Toronto', lat: 43.7, lng: -79.4, activity: 0.7 },
  { name: 'Paris', lat: 48.9, lng: 2.3, activity: 0.75 },
  { name: 'Hong Kong', lat: 22.3, lng: 114.2, activity: 0.83 },
  { name: 'Tel Aviv', lat: 32.1, lng: 34.8, activity: 0.76 },
  { name: 'Amsterdam', lat: 52.4, lng: 4.9, activity: 0.71 },
  { name: 'Bangalore', lat: 12.97, lng: 77.59, activity: 0.79 },
  { name: 'Shanghai', lat: 31.2, lng: 121.5, activity: 0.87 },
];

const latLngToVector3 = (lat, lng, radius = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const attackColor = (attackType = '') => {
  const t = String(attackType).toLowerCase();
  if (t.includes('ransom')) return '#fb7185';
  if (t.includes('apt')) return '#f97316';
  if (t.includes('phish')) return '#fde047';
  if (t.includes('sql')) return '#a78bfa';
  if (t.includes('malware')) return '#f43f5e';
  return '#22d3ee';
};

const normalizeCityName = (name = '') => String(name).replace(/ã/g, 'a').trim();

const getSunDirectionFromUtc = () => {
  const now = new Date();
  const secondsToday =
    now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const angle = (secondsToday / DAY_SECONDS) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0.26, Math.sin(angle)).normalize();
};

const CityLabel = ({ name, position, zoom, isHovered }) => {
  const shouldRender = zoom >= ZOOM_DETAIL_THRESHOLD;
  if (!shouldRender) return null;

  const fontSize = Math.min(0.055, 0.02 + (zoom - ZOOM_DETAIL_THRESHOLD) * 0.045);

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={isHovered ? '#ffd96b' : '#95deff'}
      outlineWidth={0.0025}
      outlineColor="#000000"
      anchorX="center"
      anchorY="middle"
      maxWidth={3.2}
      overflowWrap="break-word"
      renderOrder={10}
    >
      {name}
    </Text>
  );
};

const CityDetailHotspot = ({ city, zoom, threats, onSelect }) => {
  const shouldShowDetail = zoom >= ZOOM_DETAIL_THRESHOLD;
  if (!shouldShowDetail) return null;

  const pos = latLngToVector3(city.lat, city.lng, 1.025);
  const threatCount = threats.filter(
    (t) =>
      (normalizeCityName(t?.from?.name || t?.from) === normalizeCityName(city.name) ||
        normalizeCityName(t?.to?.name || t?.to) === normalizeCityName(city.name))
  ).length;

  return (
    <mesh
      position={pos}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(city.name);
      }}
    >
      <sphereGeometry args={[0.008 + (threatCount * 0.003), 8, 8]} />
      <meshBasicMaterial
        color={threatCount > 5 ? '#ff2e63' : threatCount > 2 ? '#ff6b35' : '#4ecdc4'}
        emissive={threatCount > 5 ? '#ff2e63' : threatCount > 2 ? '#ff6b35' : '#4ecdc4'}
        emissiveIntensity={0.6}
      />
    </mesh>
  );
};

// Geographic border rendering component
const GeographicBorders = ({ zoom }) => {
  const borderLines = useMemo(() => {
    if (zoom < 1.3) return [];

    const lines = [];
    GEOGRAPHIC_BORDERS.forEach((border, idx) => {
      const start = latLngToVector3(border.start.lat, border.start.lng, 1.003);
      const end = latLngToVector3(border.end.lat, border.end.lng, 1.003);
      
      const segments = 20;
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = start.clone().lerp(end, t).normalize().multiplyScalar(1.003);
        points.push(p);
      }

      const opacity = Math.min(0.9, 0.2 + (zoom - 1.3) * 0.8);
      lines.push({
        points,
        color: getThreatLevelColor(0.5),
        opacity,
        id: `border-${idx}`,
      });
    });

    return lines;
  }, [zoom]);

  return (
    <>
      {borderLines.map((line) => (
        <Line key={line.id} points={line.points} color={line.color} lineWidth={1.2} transparent opacity={line.opacity} />
      ))}
    </>
  );
};

// Regional threat indicator zones
const RegionalThreatZones = ({ zoom }) => {
  const zones = useMemo(() => {
    if (zoom < 1.4) return [];

    const regionList = [];
    Object.entries(GEOGRAPHIC_REGIONS).forEach(([regionName, regionData]) => {
      const threatLevel = Object.values(regionData.countries).reduce((avg, c) => avg + c.threatLevel, 0) 
        / Object.keys(regionData.countries).length;
      regionList.push({ name: regionName, threat: threatLevel, color: regionData.color });
    });

    return regionList;
  }, [zoom]);

  return (
    <>
      {zones.map((zone) => (
        <mesh key={zone.name} position={[0, 0, 0]}>
          <sphereGeometry args={[1.002, 32, 32]} />
          <meshBasicMaterial
            color={zone.color}
            transparent
            opacity={Math.min(0.15, (zoom - 1.4) * 0.1)}
            emissive={zone.color}
            emissiveIntensity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </>
  );
};

const AtmosphereShell = ({ lightDir }) => {
  return (
    <mesh scale={[1.065, 1.065, 1.065]}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uLightDir: { value: lightDir },
        }}
        vertexShader={`
          varying vec3 vNormalW;
          varying vec3 vViewDir;

          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vViewDir = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uLightDir;
          varying vec3 vNormalW;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormalW);
            vec3 V = normalize(vViewDir);
            vec3 L = normalize(uLightDir);

            float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
            float litEdge = max(dot(N, L), 0.0);
            vec3 dayGlow = vec3(0.38, 0.65, 1.0) * fresnel * litEdge * 0.55;
            vec3 nightGlow = vec3(0.05, 0.14, 0.24) * fresnel * (1.0 - litEdge) * 0.35;
            vec3 color = dayGlow + nightGlow;
            gl_FragColor = vec4(color, fresnel * 0.62);
          }
        `}
      />
    </mesh>
  );
};

const GlobeScene = ({
  isTyping,
  isExecuting,
  zoom,
  rotationOffset,
  liveAttacks,
  hoveredCity,
  onCityHover,
  onCityClick,
  onAttackClick,
  onZoomChange,
}) => {
  const earthSystemRef = useRef(null);
  const globeRef = useRef(null);
  const cloudsRef = useRef(null);
  const nightRef = useRef(null);
  const nightMaterialRef = useRef(null);
  const sunLightRef = useRef(null);
  const atmosphereLightDirRef = useRef(new THREE.Vector3(1.0, 0.22, 0.72).normalize());
  const [currentZoom, setCurrentZoom] = useState(1);
  const orbitControlsRef = useRef(null);
  const lastAppliedZoomRef = useRef(zoom || 1);
  const lastEmittedZoomRef = useRef(1);

  const textures = useTexture({
    day: '/images/earth/earth_day.jpg',
    normal: '/images/earth/earth_normal.jpg',
    specular: '/images/earth/earth_specular.jpg',
    night: '/images/earth/earth_night.png',
    clouds: '/images/earth/earth_clouds.png',
  });

  useMemo(() => {
    textures.day.colorSpace = THREE.SRGBColorSpace;
    textures.night.colorSpace = THREE.SRGBColorSpace;
    textures.day.anisotropy = 8;
    textures.normal.anisotropy = 8;
    textures.specular.anisotropy = 8;
    textures.night.anisotropy = 8;
    textures.clouds.anisotropy = 8;
    textures.clouds.wrapS = THREE.RepeatWrapping;
    textures.clouds.wrapT = THREE.ClampToEdgeWrapping;
  }, [textures]);

  const cityVectors = useMemo(() => {
    const map = new Map();
    HOTSPOTS.forEach((city) => {
      map.set(normalizeCityName(city.name), latLngToVector3(city.lat, city.lng, 1.01));
    });
    return map;
  }, []);

  const attackPaths = useMemo(() => {
    return (liveAttacks || [])
      .slice(-32)
      .map((attack, idx) => {
        const fromName = normalizeCityName(attack?.from?.name || attack?.from || '');
        const toName = normalizeCityName(attack?.to?.name || attack?.to || '');
        const fromVec = cityVectors.get(fromName);
        const toVec = cityVectors.get(toName);

        if (!fromVec || !toVec) return null;

        const start = fromVec.clone();
        const end = toVec.clone();
        const arcHeight = 1.2 + ((idx % 5) * 0.025);
        const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(45);

        const eventTime = Number(attack?.id) || new Date(attack?.timestamp || Date.now()).getTime();
        const elapsed = Math.max(0, (Date.now() - eventTime) / 1000);
        const progress = (elapsed * 0.28) % 1;
        const packetPosition = curve.getPointAt(progress);

        return {
          id: String(attack?.id || `${fromName}-${toName}-${idx}`),
          points,
          packetPosition,
          color: attackColor(attack?.type),
          attack,
        };
      })
      .filter(Boolean);
  }, [liveAttacks, cityVectors]);

  useFrame((state, delta) => {
    const typingBoost = isTyping ? 0.015 : 0;
    const execBoost = isExecuting ? 0.03 : 0;
    const spin = 0.028 + typingBoost + execBoost;

    if (globeRef.current) {
      globeRef.current.rotation.y += delta * spin;
      globeRef.current.rotation.x = THREE.MathUtils.lerp(
        globeRef.current.rotation.x,
        (rotationOffset?.x || 0) * 0.0024,
        0.07
      );
      globeRef.current.rotation.y += (rotationOffset?.y || 0) * 0.00002;
    }

    if (nightRef.current) {
      nightRef.current.rotation.copy(globeRef.current.rotation);
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.012;
      textures.clouds.offset.x += delta * 0.001;
    }

    // Respect external zoom changes, but don't lock camera every frame.
    if (Math.abs((zoom || 1) - lastAppliedZoomRef.current) > 0.001) {
      const externalZoom = Math.max(0.65, Math.min(2.2, zoom || 1));
      const targetDistance = 3.3 / externalZoom;
      const dir = state.camera.position.clone().normalize();
      state.camera.position.copy(dir.multiplyScalar(targetDistance));
      orbitControlsRef.current?.update();
      lastAppliedZoomRef.current = externalZoom;
    }

    const cameraDistance = orbitControlsRef.current?.getDistance?.() || state.camera.position.length();
    const zoomLevel = Math.max(0.65, Math.min(2.2, 3.3 / cameraDistance));
    if (Math.abs(zoomLevel - lastEmittedZoomRef.current) > 0.01) {
      setCurrentZoom(zoomLevel);
      onZoomChange?.(zoomLevel);
      lastEmittedZoomRef.current = zoomLevel;
    }

    state.camera.lookAt(0, 0, 0);

    const sunDir = getSunDirectionFromUtc();
    atmosphereLightDirRef.current.copy(sunDir);

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunDir.clone().multiplyScalar(5));
    }

    if (nightMaterialRef.current) {
      nightMaterialRef.current.uniforms.uLightDir.value.copy(sunDir);
    }
  });

  return (
    <>
      <color attach="background" args={['#00050b']} />
      <fog attach="fog" args={['#02070d', 5.5, 13]} />

      <ambientLight intensity={0.12} color="#8db7e6" />
      <directionalLight ref={sunLightRef} position={[4.2, 1.5, 2.4]} intensity={1.35} color="#fff7df" />
      <directionalLight position={[-2.5, -1.3, -3]} intensity={0.08} color="#1f4f96" />

      <Stars radius={30} depth={120} count={1600} factor={2.1} fade speed={0.12} />

      <group ref={earthSystemRef} rotation={[0, 0, EARTH_AXIAL_TILT]}>
      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1, 128, 128]} />
          <meshPhongMaterial
            map={textures.day}
            normalMap={textures.normal}
            normalScale={new THREE.Vector2(0.9, 0.9)}
            specularMap={textures.specular}
            specular={new THREE.Color('#d9ecff')}
            shininess={22}
          />
        </mesh>

        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.012, 96, 96]} />
          <meshPhongMaterial
            map={textures.clouds}
            alphaMap={textures.clouds}
            transparent
            opacity={0.22}
            shininess={4}
            depthWrite={false}
          />
        </mesh>

        <mesh scale={[1.06, 1.06, 1.06]}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshBasicMaterial
            color="#61c5ff"
            transparent
            opacity={0.13}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {HOTSPOTS.map((city) => {
          const pos = latLngToVector3(city.lat, city.lng, 1.018);
          const isHovered = hoveredCity === city.name;
          const labelPos = latLngToVector3(city.lat, city.lng, 1.045);
          return (
            <group key={city.name}>
              <mesh
                position={pos}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onCityHover?.(city.name);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  onCityHover?.(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCityClick?.(city.name);
                }}
              >
                <sphereGeometry args={[isHovered ? 0.0105 : 0.0065, 10, 10]} />
                <meshBasicMaterial
                  color={isHovered ? '#ffd96b' : '#95deff'}
                  transparent
                  opacity={Math.min(0.82, 0.24 + city.activity * 0.28)}
                />
              </mesh>
              <CityLabel 
                name={city.name} 
                position={labelPos} 
                zoom={currentZoom} 
                isHovered={isHovered} 
              />
              <CityDetailHotspot
                city={city}
                zoom={currentZoom}
                threats={liveAttacks || []}
                onSelect={onCityClick}
              />
            </group>
          );
        })}

        <GeographicBorders zoom={currentZoom} />
        <RegionalThreatZones zoom={currentZoom} />
      </group>

      <mesh ref={nightRef}>
        <sphereGeometry args={[1.001, 96, 96]} />
        <shaderMaterial
          ref={nightMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uNightMap: { value: textures.night },
            uLightDir: { value: new THREE.Vector3(1.0, 0.22, 0.72).normalize() },
          }}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormalW;

            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vUv = uv;
              vNormalW = normalize(mat3(modelMatrix) * normal);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `}
          fragmentShader={`
            uniform sampler2D uNightMap;
            uniform vec3 uLightDir;
            varying vec2 vUv;
            varying vec3 vNormalW;

            void main() {
              vec3 N = normalize(vNormalW);
              float lightDot = dot(N, normalize(uLightDir));
              float nightFactor = smoothstep(0.16, -0.28, lightDot);
              vec3 nightCol = texture2D(uNightMap, vUv).rgb * nightFactor * 1.08;
              gl_FragColor = vec4(nightCol, nightFactor * 0.95);
            }
          `}
        />
      </mesh>

      <AtmosphereShell lightDir={atmosphereLightDirRef.current} />
      </group>

      {attackPaths.map((path) => (
        <group key={path.id}>
          <Line points={path.points} color={path.color} lineWidth={0.92} transparent opacity={0.68} />
          <mesh
            position={path.packetPosition}
            onClick={(e) => {
              e.stopPropagation();
              onAttackClick?.(path.attack);
            }}
          >
            <sphereGeometry args={[0.014, 10, 10]} />
            <meshBasicMaterial color={path.color} />
          </mesh>
        </group>
      ))}

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.56}
        zoomSpeed={0.68}
        minDistance={2.1}
        maxDistance={4.8}
      />
    </>
  );
};

const RealTimeCyberGlobe3D = (props) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.2], fov: 39 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <GlobeScene {...props} />
    </Canvas>
  );
};

export default RealTimeCyberGlobe3D;
