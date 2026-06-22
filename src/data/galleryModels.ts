import { assetUrl } from "@/utils/assetUrl";

export interface GalleryModel {
  id: string;
  name: string;
  path: string;
}

export const galleryModels: GalleryModel[] = [
  { id: "arbre", name: "Arbre", path: assetUrl("/models/arbre/model.gltf") },
  { id: "blocking", name: "Blocking", path: assetUrl("/models/blocking/terrain.gltf") },
  {
    id: "boiteimmeuble",
    name: "Boîte immeuble",
    path: assetUrl("/models/boiteimmeuble/model.gltf"),
  },
  {
    id: "boitesimple",
    name: "Boîte simple",
    path: assetUrl("/models/boitesimple/model.gltf"),
  },
  { id: "buisson", name: "Buisson", path: assetUrl("/models/buisson/model.gltf") },
  {
    id: "buisson-animated",
    name: "Buisson animé",
    path: assetUrl("/models/buisson-animated/model.gltf"),
  },
  { id: "cable1", name: "Câble 1", path: assetUrl("/models/cable1/model.gltf") },
  { id: "cable2", name: "Câble 2", path: assetUrl("/models/cable2/model.gltf") },
  { id: "chemins", name: "Chemins", path: assetUrl("/models/chemins/model.gltf") },
  {
    id: "createurdepluie",
    name: "Créateur de pluie",
    path: assetUrl("/models/createurdepluie/model.gltf"),
  },
  { id: "ebike", name: "E-bike", path: assetUrl("/models/ebike/model.gltf") },
  { id: "ecole", name: "École", path: assetUrl("/models/ecole/model.gltf") },
  { id: "elec", name: "Électricité", path: assetUrl("/models/elec/model.gltf") },
  {
    id: "electricienne",
    name: "Électricienne",
    path: assetUrl("/models/electricienne/model.gltf"),
  },
  {
    id: "entreetuyaux",
    name: "Entrée tuyaux",
    path: assetUrl("/models/entreetuyaux/model.gltf"),
  },
  { id: "eolienne", name: "Éolienne", path: assetUrl("/models/eolienne/model.gltf") },
  {
    id: "fermeverticale",
    name: "Ferme verticale",
    path: assetUrl("/models/fermeverticale/model.gltf"),
  },
  { id: "fermier", name: "Fermier", path: assetUrl("/models/fermier/model.gltf") },
  {
    id: "fermier-animated",
    name: "Fermier animé",
    path: assetUrl("/models/fermier-animated/model.gltf"),
  },
  { id: "galet", name: "Galet", path: assetUrl("/models/galet/model.gltf") },
  { id: "gant_l", name: "Gant gauche", path: assetUrl("/models/gant_l/model.gltf") },
  {
    id: "gant_l_pad",
    name: "Pad gant gauche",
    path: assetUrl("/models/gant_l_pad/model.gltf"),
  },
  { id: "gant_r", name: "Gant droit", path: assetUrl("/models/gant_r/model.gltf") },
  {
    id: "gant_r_pad",
    name: "Pad gant droit",
    path: assetUrl("/models/gant_r_pad/model.gltf"),
  },
  {
    id: "generateur",
    name: "Générateur",
    path: assetUrl("/models/generateur/model.gltf"),
  },
  { id: "gerant", name: "Gérant", path: assetUrl("/models/gerant/model.gltf") },
  {
    id: "gerant_anim",
    name: "Gérant animé",
    path: assetUrl("/models/gerant_anim/model.gltf"),
  },
  {
    id: "habitant1",
    name: "Habitant 1",
    path: assetUrl("/models/habitant1/model.gltf"),
  },
  {
    id: "habitant1-animated",
    name: "Habitant 1 animé",
    path: assetUrl("/models/habitant1-animated/model.gltf"),
  },
  {
    id: "habitant2",
    name: "Habitant 2",
    path: assetUrl("/models/habitant2/model.gltf"),
  },
  {
    id: "habitant2-animated",
    name: "Habitant 2 animé",
    path: assetUrl("/models/habitant2-animated/model.gltf"),
  },
  { id: "immeuble1", name: "Immeuble", path: assetUrl("/models/immeuble1/model.gltf") },
  { id: "lafabrik", name: "La Fabrik", path: assetUrl("/models/lafabrik/model.glb") },
  { id: "maison1", name: "Maison", path: assetUrl("/models/maison1/model.gltf") },
  {
    id: "packderelance",
    name: "Pack de relance",
    path: assetUrl("/models/packderelance/model.gltf"),
  },
  {
    id: "panneauaffichage",
    name: "Panneau d'affichage",
    path: assetUrl("/models/panneauaffichage/model.gltf"),
  },
  {
    id: "panneauclassique",
    name: "Panneau classique",
    path: assetUrl("/models/panneauclassique/model.gltf"),
  },
  {
    id: "panneaufleche",
    name: "Panneau flèche",
    path: assetUrl("/models/panneaufleche/model.gltf"),
  },
  {
    id: "persoprincipal",
    name: "Personnage principal",
    path: assetUrl("/models/persoprincipal/model.gltf"),
  },
  {
    id: "persoprincipal-animated",
    name: "Personnage principal animé",
    path: assetUrl("/models/persoprincipal-animated/model.gltf"),
  },
  { id: "potager", name: "Potager", path: assetUrl("/models/potager/potager.gltf") },
  { id: "puce", name: "Puce", path: assetUrl("/models/puce/model.gltf") },
  { id: "pylone", name: "Pylône", path: assetUrl("/models/pylone/model.glb") },
  {
    id: "refroidisseur",
    name: "Refroidisseur",
    path: assetUrl("/models/refroidisseur/model.gltf"),
  },
  { id: "sapin", name: "Sapin", path: assetUrl("/models/sapin/model.gltf") },
  { id: "skybox", name: "Skybox", path: assetUrl("/models/skybox/skybox.gltf") },
  { id: "talkie", name: "Talkie", path: assetUrl("/models/talkie/model.glb") },
  { id: "terrain", name: "Terrain", path: assetUrl("/models/terrain/model.gltf") },
  {
    id: "tuyauxlac",
    name: "Tuyaux lac",
    path: assetUrl("/models/tuyauxlac/model.gltf"),
  },
  {
    id: "tuyauxpuzzle",
    name: "Tuyaux puzzle",
    path: assetUrl("/models/tuyauxpuzzle/model.gltf"),
  },
  { id: "vase", name: "Vase", path: assetUrl("/models/vase/model.gltf") },
];
