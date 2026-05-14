const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.join(__dirname, "../public/map_raw.json");
const OUTPUT_PATH = path.join(__dirname, "../public/map.json");

const MESH_NAME_MAPPINGS = {
  boitesauxlettres: "boiteauxlettres",
  pyloneelectrique: "pylone",
  eoliennes: "eolienne",
  immeuble_1: "immeuble1",
  buissons: "buisson",
  panneauxquartier: "panneauaffichage",
};

const REMOVED_NODE_NAMES = new Set(["ROOT", "mc"]);

function cloneNode(node) {
  return {
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function mapMeshName(node) {
  if (node.type !== "Mesh") {
    return cloneNode(node);
  }

  return {
    ...cloneNode(node),
    name: MESH_NAME_MAPPINGS[node.name] ?? node.name,
  };
}

function createGroup(node, children = []) {
  return {
    ...cloneNode(node),
    name: node.name === "Neutre" ? "blocking" : node.name,
    children,
  };
}

function transformMap() {
  console.log("Reading map_raw.json...");
  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  console.log(`Found ${rawData.length} nodes in raw file`);

  let removedCount = 0;
  let renamedCount = 0;

  const sceneRaw = rawData.find(
    (node) => node.name === "Scene" && node.type === "Object3D",
  );
  const terrainRaw = rawData.find(
    (node) => node.name === "terrain" && node.type === "Object3D",
  );
  const blockingRaw = rawData.find(
    (node) => node.name === "Neutre" && node.type === "Object3D",
  );

  if (!sceneRaw || !terrainRaw || !blockingRaw) {
    throw new Error("Missing required Scene, terrain, or Neutre node");
  }

  const scene = createGroup(sceneRaw);
  const terrain = createGroup(terrainRaw);
  const blocking = createGroup(blockingRaw);
  let currentGroup = null;

  for (const rawNode of rawData) {
    if (REMOVED_NODE_NAMES.has(rawNode.name)) {
      removedCount++;
      continue;
    }

    if (rawNode.name === "Scene" || rawNode.name === "Neutre") {
      continue;
    }

    if (rawNode.name === "terrain" && rawNode.type === "Object3D") {
      currentGroup = terrain;
      continue;
    }

    if (rawNode.type === "Object3D") {
      currentGroup = createGroup(rawNode);
      blocking.children.push(currentGroup);
      continue;
    }

    const mappedNode = mapMeshName(rawNode);
    if (mappedNode.name !== rawNode.name) {
      renamedCount++;
    }

    if (rawNode.name === "terrain" && currentGroup === terrain) {
      terrain.children.push(mappedNode);
      continue;
    }

    if (currentGroup) {
      currentGroup.children.push(mappedNode);
      continue;
    }

    blocking.children.push(mappedNode);
  }

  scene.children = [terrain, blocking];

  console.log(`\nTransformation complete:`);
  console.log(`  - Removed ${removedCount} mc/ROOT nodes`);
  console.log(`  - Renamed ${renamedCount} mesh nodes`);
  console.log(`  - Output: hierarchical Scene root`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(scene, null, 2));
  console.log(`\nWritten to ${OUTPUT_PATH}`);
}

transformMap();
