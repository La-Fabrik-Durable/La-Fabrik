export const grassVertexShader = /* glsl */ `
  attribute vec3 aBladeColor;
  attribute vec3 aBladeNormal;
  attribute vec3 aBladeBase;
  attribute float aSideFactor;
  attribute float aTipFactor;
  attribute float aRandom;
  attribute vec3 aYaw;

  varying vec3 vColor;

  uniform float uTime;
  uniform vec3 uPlayerPosition;
  uniform float uPatchSize;
  uniform float uBladeWidth;
  uniform float uWindDirection;
  uniform float uWindSpeed;
  uniform float uWindNoiseScale;
  uniform float uBaldPatchModifier;
  uniform float uFalloffSharpness;
  uniform float uHeightNoiseFrequency;
  uniform float uHeightNoiseAmplitude;
  uniform float uMaxBendAngle;
  uniform float uMaxBladeHeight;
  uniform float uRandomHeightAmount;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  mat3 rotate3d(in vec3 axis, const in float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
  }

  float mapValue(float value, float inMin, float inMax, float outMin, float outMax) {
    return mix(outMin, outMax, (value - inMin) / (inMax - inMin));
  }

  void main() {
    vec3 origin = aBladeBase;
    vec3 transformed = origin;
    float halfPatchSize = uPatchSize * 0.5;
    vec2 uv = vec2(origin.x, origin.z) * 0.05;

    float heightNoise =
      random(floor(uv * uHeightNoiseFrequency) + aRandom) *
      uMaxBladeHeight *
      uHeightNoiseAmplitude;
    float heightModifier = heightNoise + random(uv + aRandom) * (uRandomHeightAmount * 0.1);

    float edgeDistanceX = abs(origin.x - uPlayerPosition.x) / halfPatchSize;
    float edgeDistanceZ = abs(origin.z - uPlayerPosition.z) / halfPatchSize;
    float edgeFactor = 1.0 - max(edgeDistanceX, edgeDistanceZ);
    edgeFactor = pow(clamp(edgeFactor, 0.0, 1.0), uFalloffSharpness);

    float baldPatch = random(floor(uv * 3.0)) * (uBaldPatchModifier * (1.0 - edgeFactor));
    heightModifier = max(0.0, heightModifier - baldPatch);

    float distanceFromCenter = length(origin.xz - uPlayerPosition.xz) / halfPatchSize;
    float innerCircleFactor = clamp(smoothstep(0.0, 0.5, distanceFromCenter), 0.0, 1.0);
    heightModifier *= mix(0.25, 1.0, innerCircleFactor);

    vec3 tangent = normalize(aYaw - aBladeNormal * dot(aYaw, aBladeNormal));
    transformed += tangent * (uBladeWidth * 0.5) * aSideFactor;
    transformed += aBladeNormal * heightModifier * aTipFactor;

    float noiseScale = uWindNoiseScale * 0.1;
    vec2 noiseUV = vec2(origin.x * noiseScale, origin.z * noiseScale);
    mat2 rotation = mat2(
      cos(uWindDirection), -sin(uWindDirection),
      sin(uWindDirection), cos(uWindDirection)
    );
    vec2 rotatedNoiseUV = rotation * noiseUV + uTime * vec2(uWindSpeed);
    float windA = random(floor(rotatedNoiseUV * 10.0));
    float windB = random(floor(rotatedNoiseUV.yx * 10.0 + 17.0));
    vec3 axis = normalize(vec3(windA, 0.0, windB));
    float angle = radians(mapValue(windA + windB, 0.0, 2.0, -uMaxBendAngle, uMaxBendAngle)) * aTipFactor;
    mat3 rotationMatrix = rotate3d(axis, angle);

    vec3 relativePosition = transformed - origin;
    relativePosition = rotationMatrix * relativePosition;
    transformed = origin + relativePosition;

    vec3 baseColor = aBladeColor * 0.45;
    vec3 tipColor = aBladeColor;
    float shadeNoise = random(floor((uv + uTime * 0.01) * 24.0));
    vColor = mix(baseColor, tipColor, aTipFactor) * mix(0.72, 1.08, shadeNoise);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const grassFragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
