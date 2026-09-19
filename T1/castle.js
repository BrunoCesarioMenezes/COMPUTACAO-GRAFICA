import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

// ================================================================
// CASTELO DE BODIAM
// Modelagem simplificada com primitivas do Three.js.
//
// Frente = -Z
// Fundo  = +Z
// Oeste  = -X
// Leste  = +X
//
// Este arquivo contém:
// - muralhas
// - caminhos superiores
// - torres
// - gatehouse
// - pátio
// - construções internas
// - escadas
// - portas funcionais
//
// NÃO contém:
// - player
// - colisões
// - tiros
// ================================================================


// ================================================================
// CORES
// ================================================================

const COLORS = {

  stone:
    'rgb(132, 126, 112)',

  stoneLight:
    'rgb(154, 147, 128)',

  stoneDark:
    'rgb(102, 97, 86)',

  opening:
    'rgb(45, 43, 39)',

  wood:
    'rgb(88, 54, 31)',

  woodDark:
    'rgb(48, 30, 18)',

  iron:
    'rgb(42, 42, 39)',

  grass:
    'rgb(72, 103, 61)'
};


// ================================================================
// FUNÇÕES BÁSICAS
// ================================================================

function mesh(
  geometry,
  material,
  parent,
  x = 0,
  y = 0,
  z = 0
) {

  const obj =
    new THREE.Mesh(
      geometry,
      material
    );

  obj.position.set(
    x,
    y,
    z
  );

  obj.castShadow = true;
  obj.receiveShadow = true;

  parent.add(obj);

  return obj;
}


function box(
  parent,
  material,
  width,
  height,
  depth,
  x,
  y,
  z
) {

  return mesh(

    new THREE.BoxGeometry(
      width,
      height,
      depth
    ),

    material,

    parent,

    x,
    y,
    z
  );
}


function cylinder(
  parent,
  material,
  radius,
  height,
  x,
  y,
  z,
  segments = 32
) {

  return mesh(

    new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      segments
    ),

    material,

    parent,

    x,
    y,
    z
  );
}


// ================================================================
// MATERIAIS
// ================================================================

function createMaterials() {

  return {

    stone:
      setDefaultMaterial(
        COLORS.stone
      ),

    stoneLight:
      setDefaultMaterial(
        COLORS.stoneLight
      ),

    stoneDark:
      setDefaultMaterial(
        COLORS.stoneDark
      ),

    opening:
      setDefaultMaterial(
        COLORS.opening
      ),

    wood:
      setDefaultMaterial(
        COLORS.wood
      ),

    woodDark:
      setDefaultMaterial(
        COLORS.woodDark
      ),

    iron:
      setDefaultMaterial(
        COLORS.iron
      ),

    grass:
      setDefaultMaterial(
        COLORS.grass
      )
  };
}


// ================================================================
// SETEIRA
//
// Apenas vertical.
// Não há mais o detalhe em forma de cruz.
// ================================================================

function addArrowSlit(
  parent,
  mats,
  x,
  y,
  z,
  rotationY = 0,
  scale = 1
) {

  const group =
    new THREE.Group();

  group.position.set(
    x,
    y,
    z
  );

  group.rotation.y =
    rotationY;

  parent.add(group);


  box(
    group,
    mats.opening,

    0.28 * scale,
    1.8 * scale,
    0.13,

    0,
    0,
    0
  );
}


// ================================================================
// JANELA
// ================================================================

function addWindow(
  parent,
  mats,
  x,
  y,
  z,
  rotationY = 0,
  scale = 1
) {

  const group =
    new THREE.Group();

  group.position.set(
    x,
    y,
    z
  );

  group.rotation.y =
    rotationY;

  parent.add(group);


  box(
    group,
    mats.opening,

    0.9 * scale,
    1.65 * scale,
    0.13,

    0,
    0,
    0
  );


  // topo
  box(
    group,
    mats.stoneLight,

    1.25 * scale,
    0.18,
    0.20,

    0,
    0.95 * scale,
    0
  );


  // base
  box(
    group,
    mats.stoneLight,

    1.25 * scale,
    0.18,
    0.20,

    0,
    -0.95 * scale,
    0
  );


  // esquerda
  box(
    group,
    mats.stoneLight,

    0.18,
    2.0 * scale,
    0.20,

    -0.62 * scale,
    0,
    0
  );


  // direita
  box(
    group,
    mats.stoneLight,

    0.18,
    2.0 * scale,
    0.20,

    0.62 * scale,
    0,
    0
  );
}


// ================================================================
// AMEIAS RETAS
// ================================================================

function createCrenellationsLine(
  parent,
  material,
  cfg
) {

  const {

    axis,

    fixed,

    start,
    end,

    y,

    outward = 0,

    merlon = 1.8,

    gap = 1.35,

    depth = 1.3,

    height = 1.8

  } = cfg;


  const step =
    merlon + gap;


  for (
    let p = start;
    p <= end;
    p += step
  ) {

    if (
      axis === 'x'
    ) {

      box(
        parent,
        material,

        merlon,
        height,
        depth,

        p,
        y,
        fixed + outward
      );

    }

    else {

      box(
        parent,
        material,

        depth,
        height,
        merlon,

        fixed + outward,
        y,
        p
      );
    }
  }
}


// ================================================================
// AMEIAS CIRCULARES
// ================================================================

function createRoundCrenellations(
  parent,
  material,
  x,
  z,
  radius,
  y,
  count = 14
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const angle =
      i *
      Math.PI *
      2 /
      count;


    const block =
      box(
        parent,
        material,

        1.8,
        1.9,
        1.45,

        x +
        Math.cos(angle) *
        radius,

        y,

        z +
        Math.sin(angle) *
        radius
      );


    block.rotation.y =
      -angle;
  }
}


// ================================================================
// TORRE CIRCULAR DE CANTO
//
// Não possui porta.
//
// O personagem poderá chegar até a torre pelo caminho superior,
// mas não existe entrada modelada para o interior da torre.
// ================================================================

function createCornerTower(
  parent,
  mats,
  x,
  z,
  name
) {

  const group =
    new THREE.Group();

  group.name =
    name;

  parent.add(group);


  const radius =
    7.5;

  const height =
    25;


  // ==============================================================
  // CORPO
  // ==============================================================

  cylinder(
    group,
    mats.stone,

    radius,
    height,

    x,
    height / 2,
    z,

    40
  );


  // ==============================================================
  // CORNIJA SUPERIOR
  // ==============================================================

  cylinder(
    group,
    mats.stoneLight,

    radius + 0.35,
    0.5,

    x,
    height - 0.35,
    z,

    40
  );


  // ==============================================================
  // PISO SUPERIOR
  // ==============================================================

  cylinder(
    group,
    mats.stoneLight,

    radius + 0.45,
    0.45,

    x,
    height + 0.05,
    z,

    40
  );


  // ==============================================================
  // AMEIAS
  // ==============================================================

  createRoundCrenellations(
    group,
    mats.stoneLight,

    x,
    z,

    radius,

    height + 1.1,

    14
  );


  // ==============================================================
  // SETEIRAS
  // ==============================================================

  const levels =
    [
      7.5,
      15.5
    ];


  for (
    const yy of levels
  ) {

    // frente
    addArrowSlit(
      group,
      mats,

      x,
      yy,
      z - radius - 0.04,

      0,
      0.85
    );


    // fundo
    addArrowSlit(
      group,
      mats,

      x,
      yy,
      z + radius + 0.04,

      Math.PI,
      0.85
    );


    // oeste
    addArrowSlit(
      group,
      mats,

      x - radius - 0.04,
      yy,
      z,

      Math.PI / 2,
      0.85
    );


    // leste
    addArrowSlit(
      group,
      mats,

      x + radius + 0.04,
      yy,
      z,

      -Math.PI / 2,
      0.85
    );
  }


  return group;
}


// ================================================================
// TORRE RETANGULAR
// ================================================================

function createRectTower(
  parent,
  mats,
  cfg
) {

  const {

    x,
    z,

    width = 9,

    depth = 8,

    height = 21,

    rotationY = 0,

    name =
      'Torre retangular'

  } = cfg;


  const group =
    new THREE.Group();

  group.name =
    name;

  group.position.set(
    x,
    0,
    z
  );

  group.rotation.y =
    rotationY;

  parent.add(group);


  // ==============================================================
  // CORPO
  // ==============================================================

  box(
    group,
    mats.stone,

    width,
    height,
    depth,

    0,
    height / 2,
    0
  );


  // ==============================================================
  // PISO SUPERIOR
  // ==============================================================

  box(
    group,
    mats.stoneLight,

    width + 0.45,
    0.45,
    depth + 0.45,

    0,
    height + 0.1,
    0
  );


  // ==============================================================
  // AMEIAS
  // ==============================================================

  createCrenellationsLine(
    group,
    mats.stoneLight,
    {

      axis: 'x',

      fixed:
        -depth / 2,

      start:
        -width / 2 + 0.8,

      end:
        width / 2 - 0.8,

      y:
        height + 1.05,

      merlon:
        1.5,

      gap:
        1.0,

      depth:
        1.15
    }
  );


  createCrenellationsLine(
    group,
    mats.stoneLight,
    {

      axis: 'x',

      fixed:
        depth / 2,

      start:
        -width / 2 + 0.8,

      end:
        width / 2 - 0.8,

      y:
        height + 1.05,

      merlon:
        1.5,

      gap:
        1.0,

      depth:
        1.15
    }
  );


  createCrenellationsLine(
    group,
    mats.stoneLight,
    {

      axis: 'z',

      fixed:
        -width / 2,

      start:
        -depth / 2 + 0.8,

      end:
        depth / 2 - 0.8,

      y:
        height + 1.05,

      merlon:
        1.4,

      gap:
        1.0,

      depth:
        1.15
    }
  );


  createCrenellationsLine(
    group,
    mats.stoneLight,
    {

      axis: 'z',

      fixed:
        width / 2,

      start:
        -depth / 2 + 0.8,

      end:
        depth / 2 - 0.8,

      y:
        height + 1.05,

      merlon:
        1.4,

      gap:
        1.0,

      depth:
        1.15
    }
  );


  // ==============================================================
  // SETEIRAS
  // ==============================================================

  addArrowSlit(
    group,
    mats,

    0,
    7,
    -depth / 2 - 0.03,

    0,
    0.85
  );


  addArrowSlit(
    group,
    mats,

    0,
    14,
    -depth / 2 - 0.03,

    0,
    0.85
  );


  return group;
}


// ================================================================
// MURALHA HORIZONTAL
//
// IMPORTANTE:
//
// A muralha agora possui 6 unidades de profundidade.
//
// Isso cria um caminho de aproximadamente 4 unidades no topo,
// suficiente para o personagem andar.
//
// As extremidades entram dentro das torres para não deixar
// espaços visuais.
// ================================================================

function createWallX(
  parent,
  mats,
  z,
  x1,
  x2,
  height = 13
) {

  const thickness =
    6.0;


  const length =
    x2 - x1;


  const center =
    (x1 + x2) / 2;


  // ==============================================================
  // CORPO
  // ==============================================================

  box(
    parent,
    mats.stone,

    length,
    height,
    thickness,

    center,
    height / 2,
    z
  );


  // ==============================================================
  // CAMINHO SUPERIOR
  // ==============================================================

  box(
    parent,
    mats.stoneLight,

    length,
    0.45,
    4.3,

    center,
    height + 0.22,
    z
  );


  // ==============================================================
  // PARAPEITO EXTERNO
  // ==============================================================

  createCrenellationsLine(
    parent,
    mats.stoneLight,
    {

      axis:
        'x',

      fixed:
        z,

      start:
        x1,

      end:
        x2,

      y:
        height + 1.15,

      outward:
        -2.35,

      merlon:
        1.8,

      gap:
        1.25,

      depth:
        1.1
    }
  );


  // ==============================================================
  // PARAPEITO INTERNO
  // ==============================================================

  createCrenellationsLine(
    parent,
    mats.stoneLight,
    {

      axis:
        'x',

      fixed:
        z,

      start:
        x1,

      end:
        x2,

      y:
        height + 1.15,

      outward:
        2.35,

      merlon:
        1.8,

      gap:
        1.25,

      depth:
        1.1
    }
  );
}


// ================================================================
// MURALHA VERTICAL
// ================================================================

function createWallZ(
  parent,
  mats,
  x,
  z1,
  z2,
  height = 13
) {

  const thickness =
    6.0;


  const length =
    z2 - z1;


  const center =
    (z1 + z2) / 2;


  // ==============================================================
  // CORPO
  // ==============================================================

  box(
    parent,
    mats.stone,

    thickness,
    height,
    length,

    x,
    height / 2,
    center
  );


  // ==============================================================
  // CAMINHO SUPERIOR
  // ==============================================================

  box(
    parent,
    mats.stoneLight,

    4.3,
    0.45,
    length,

    x,
    height + 0.22,
    center
  );


  // ==============================================================
  // PARAPEITO OESTE
  // ==============================================================

  createCrenellationsLine(
    parent,
    mats.stoneLight,
    {

      axis:
        'z',

      fixed:
        x,

      start:
        z1,

      end:
        z2,

      y:
        height + 1.15,

      outward:
        -2.35,

      merlon:
        1.8,

      gap:
        1.25,

      depth:
        1.1
    }
  );


  // ==============================================================
  // PARAPEITO LESTE
  // ==============================================================

  createCrenellationsLine(
    parent,
    mats.stoneLight,
    {

      axis:
        'z',

      fixed:
        x,

      start:
        z1,

      end:
        z2,

      y:
        height + 1.15,

      outward:
        2.35,

      merlon:
        1.8,

      gap:
        1.25,

      depth:
        1.1
    }
  );
}


// ================================================================
// PLATAFORMA DE LIGAÇÃO COM TORRE
//
// Serve para garantir continuidade visual e física entre o caminho
// da muralha e a torre.
//
// Não cria entrada.
// ================================================================

function createTowerConnection(
  parent,
  mats,
  x,
  z,
  width,
  depth
) {

  box(
    parent,
    mats.stoneLight,

    width,
    0.48,
    depth,

    x,
    13.25,
    z
  );
}


// ================================================================
// PORTA ANIMÁVEL
// ================================================================

function createDoor(
  parent,
  mats,
  cfg
) {

  const {

    x,
    y,
    z,

    width,
    height,

    rotationY = 0,

    hinge = 'left',

    name = 'Porta',

    openAngle =
      Math.PI / 2,

    triggerDistance = 8,

    detailSide = -1

  } = cfg;


  const pivot =
    new THREE.Group();


  pivot.name =
    `${name} - pivô`;


  pivot.position.set(
    x,
    y,
    z
  );


  pivot.rotation.y =
    rotationY;


  parent.add(
    pivot
  );


  const direction =
    hinge === 'left'
      ? 1
      : -1;


  const panel =
    box(
      pivot,
      mats.wood,

      width,
      height,
      0.38,

      direction *
      width / 2,

      0,
      0
    );


  panel.name =
    name;


  // ==============================================================
  // DETALHES DA PORTA
  // ==============================================================

  for (
    const yy of [
      -height * 0.3,
      0,
      height * 0.3
    ]
  ) {

    box(
      panel,
      mats.woodDark,

      width * 0.9,
      0.18,
      0.08,

      0,
      yy,
      detailSide * 0.23
    );
  }


  box(
    panel,
    mats.iron,

    0.12,
    height * 0.8,
    0.08,

    -direction *
    width *
    0.28,

    0,

    detailSide *
    0.25
  );


  return {

    name,

    pivot,
    panel,

    closedAngle:
      0,

    openAngle:
      direction *
      openAngle,

    progress:
      0,

    target:
      0,

    triggerDistance,

    triggerPosition:
      new THREE.Vector3(
        x,
        y,
        z
      ),

    manualOpen:
      false
  };
}


// ================================================================
// PORTARIA PRINCIPAL
// ================================================================

function createGatehouse(
  parent,
  mats,
  doors
) {

  const group =
    new THREE.Group();


  group.name =
    'Portaria principal';


  parent.add(
    group
  );


  const openingWidth =
    7;


  const openingHeight =
    7.8;


  const towerWidth =
    8;


  const towerDepth =
    9;


  const towerHeight =
    22;


  // ==============================================================
  // TORRE ESQUERDA
  // ==============================================================

  createRectTower(
    group,
    mats,
    {

      x:
        -7.5,

      z:
        -0.5,

      width:
        towerWidth,

      depth:
        towerDepth,

      height:
        towerHeight,

      name:
        'Torre esquerda da portaria'
    }
  );


  // ==============================================================
  // TORRE DIREITA
  // ==============================================================

  createRectTower(
    group,
    mats,
    {

      x:
        7.5,

      z:
        -0.5,

      width:
        towerWidth,

      depth:
        towerDepth,

      height:
        towerHeight,

      name:
        'Torre direita da portaria'
    }
  );


  // ==============================================================
  // BLOCO CENTRAL
  // ==============================================================

  box(
    group,
    mats.stone,

    openingWidth,
    12,
    7,

    0,
    openingHeight + 6,
    -0.3
  );


  // ==============================================================
  // CAMINHO SOBRE A PORTARIA
  //
  // Liga o caminho da muralha esquerda ao da direita.
  // ==============================================================

  box(
    group,
    mats.stoneLight,

    23,
    0.5,
    4.3,

    0,
    13.25,
    0
  );


  // ==============================================================
  // MOLDURA DO PORTÃO
  // ==============================================================

  box(
    group,
    mats.stoneLight,

    openingWidth + 0.8,
    0.45,
    0.55,

    0,
    openingHeight + 0.1,
    -4.35
  );


  box(
    group,
    mats.stoneLight,

    0.45,
    openingHeight,
    0.55,

    -openingWidth / 2 -
    0.2,

    openingHeight / 2,
    -4.35
  );


  box(
    group,
    mats.stoneLight,

    0.45,
    openingHeight,
    0.55,

    openingWidth / 2 +
    0.2,

    openingHeight / 2,
    -4.35
  );


  // ==============================================================
  // SETEIRAS
  // ==============================================================

  addArrowSlit(
    group,
    mats,

    -7.5,
    8,
    -5.05
  );


  addArrowSlit(
    group,
    mats,

    -7.5,
    15,
    -5.05
  );


  addArrowSlit(
    group,
    mats,

    7.5,
    8,
    -5.05
  );


  addArrowSlit(
    group,
    mats,

    7.5,
    15,
    -5.05
  );


  addArrowSlit(
    group,
    mats,

    0,
    14,
    -3.85
  );


  // ==============================================================
  // PORTÃO PRINCIPAL
  // ==============================================================

  const doorZ =
    -4.15;


  const left =
    createDoor(
      group,
      mats,
      {

        x:
          -openingWidth / 2,

        y:
          openingHeight / 2,

        z:
          doorZ,

        width:
          openingWidth / 2,

        height:
          7.3,

        hinge:
          'left',

        name:
          'Porta principal - folha esquerda',

        triggerDistance:
          10,

        detailSide:
          -1
      }
    );


  const right =
    createDoor(
      group,
      mats,
      {

        x:
          openingWidth / 2,

        y:
          openingHeight / 2,

        z:
          doorZ,

        width:
          openingWidth / 2,

        height:
          7.3,

        hinge:
          'right',

        name:
          'Porta principal - folha direita',

        triggerDistance:
          10,

        detailSide:
          -1
      }
    );


  left.groupId =
    'mainGate';


  right.groupId =
    'mainGate';


  doors.push(
    left,
    right
  );


  // Frente do castelo
  group.position.z =
    -42;


  return group;
}


// ================================================================
// ESCADA
// ================================================================

function createStoneStair(parent, mats, cfg) {
    const { x, z, width = 4, length = 10, height = 7, steps = 12, axis = 'z', reverse = false } = cfg;
    const stepLength = length / steps;
    const wallThickness = 0.15;

    for (let i = 0; i < steps; i++) {
        const level = reverse ? i + 1 : steps - i;
        const h = height * level / steps;
        const offset = -length / 2 + stepLength * (i + 0.5);
        const sx = axis === 'x' ? x + offset : x;
        const sz = axis === 'z' ? z + offset : z;

        const step = box(parent, mats.stoneLight,
            axis === 'z' ? width : stepLength,
            h,
            axis === 'z' ? stepLength : width,
            sx, h / 2, sz
        );

        step.userData.isStep = true;

        if (axis === 'z') {
            box(parent, mats.stoneLight, wallThickness, h, stepLength, x - width / 2, h / 2, sz);
            box(parent, mats.stoneLight, wallThickness, h, stepLength, x + width / 2, h / 2, sz);
        } else {
            box(parent, mats.stoneLight, stepLength, h, wallThickness, sx, h / 2, z - width / 2);
            box(parent, mats.stoneLight, stepLength, h, wallThickness, sx, h / 2, z + width / 2);
        }
    }
}


// ================================================================
// CONSTRUÇÃO INTERNA
// ================================================================

function createInternalBuilding(
  parent,
  mats,
  doors,
  cfg
) {

  const {

    x,
    z,

    width,
    depth,
    height,

    name,

    stairSide =
      'east'

  } = cfg;


  const group =
    new THREE.Group();


  group.name =
    name;


  parent.add(
    group
  );


  const wallThickness =
    1;


  const doorWidth =
    3;


  const doorHeight =
    4.2;


  const frontZ =
    z -
    depth / 2;


  const backZ =
    z +
    depth / 2;


  const sideWidth =
    (width -
    doorWidth) /
    2;


  // ==============================================================
  // FACHADA - ESQUERDA
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    sideWidth,
    height,
    wallThickness,

    x -
    (
      doorWidth / 2 +
      sideWidth / 2
    ),

    height / 2,

    frontZ
  );


  // ==============================================================
  // FACHADA - DIREITA
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    sideWidth,
    height,
    wallThickness,

    x +
    (
      doorWidth / 2 +
      sideWidth / 2
    ),

    height / 2,

    frontZ
  );


  // ==============================================================
  // SOBRE A PORTA
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    doorWidth,

    height -
    doorHeight,

    wallThickness,

    x,

    doorHeight +
    (
      height -
      doorHeight
    ) / 2,

    frontZ
  );


  // ==============================================================
  // FUNDO
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    width,
    height,
    wallThickness,

    x,
    height / 2,
    backZ
  );


  // ==============================================================
  // LATERAL ESQUERDA
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    wallThickness,
    height,
    depth,

    x - width / 2,
    height / 2,
    z
  );


  // ==============================================================
  // LATERAL DIREITA
  // ==============================================================

  box(
    group,
    mats.stoneDark,

    wallThickness,
    height,
    depth,

    x + width / 2,
    height / 2,
    z
  );


  // ==============================================================
  // COBERTURA
  // ==============================================================

  box(
    group,
    mats.stoneLight,

    width,
    0.45,
    depth,

    x,
    height + 0.2,
    z
  );


  // ==============================================================
  // AMEIAS
  // ==============================================================

  createCrenellationsLine(
    group,
    mats.stoneLight,
    {

      axis:
        'x',

      fixed:
        frontZ,

      start:
        x -
        width / 2 +
        1,

      end:
        x +
        width / 2 -
        1,

      y:
        height + 1.1,

      merlon:
        1.5,

      gap:
        1.1,

      depth:
        1.1
    }
  );


  // ==============================================================
  // JANELAS
  // ==============================================================

  addWindow(
    group,
    mats,

    x -
    width *
    0.27,

    height *
    0.62,

    frontZ -
    0.52,

    0,
    0.8
  );


  addWindow(
    group,
    mats,

    x +
    width *
    0.27,

    height *
    0.62,

    frontZ -
    0.52,

    0,
    0.8
  );


  // ==============================================================
  // PORTA
  // ==============================================================

  doors.push(

    createDoor(
      group,
      mats,
      {

        x:
          x -
          doorWidth / 2,

        y:
          doorHeight / 2,

        z:
          frontZ -
          0.58,

        width:
          doorWidth,

        height:
          doorHeight,

        hinge:
          'left',

        name:
          `${name} - porta`,

        triggerDistance:
          7,

        detailSide:
          -1
      }
    )
  );


  // ==============================================================
  // ESCADA
  // ==============================================================

  const stairX =
    stairSide === 'east'
        ? x + width / 2 + 4.0
        : x - width / 2 - 4.0;


  createStoneStair(
    group,
    mats,
    {

      x:
        stairX,

      z,

      width:
        3.3,

      length:
        8,

      height:
        height + 0.3,

      steps:
        12,

      axis:
        'x',

      reverse:
        stairSide ===
        'west'
    }
  );


  return group;
}

// ================================================================
// ALAS INTERNAS
// ================================================================

function createInnerRange(
  parent,
  mats,
  cfg
) {

  const {

    x,
    z,

    width,
    depth,
    height

  } = cfg;


  box(
    parent,
    mats.stoneDark,

    width,
    height,
    depth,

    x,
    height / 2,
    z
  );


  box(
    parent,
    mats.stoneLight,

    width + 0.3,
    0.35,
    depth + 0.3,

    x,
    height + 0.15,
    z
  );
}


// ================================================================
// PÁTIO
// ================================================================

function createCourtyard(
  parent,
  mats
) {

  // Caminho longitudinal
  for (
    let z = -31;
    z <= 20;
    z += 5
  ) {

    box(
      parent,
      mats.stoneLight,

      4,
      0.10,
      4,

      0,
      0.05,
      z
    );
  }


  // Caminho transversal
  for (
    let x = -20;
    x <= 20;
    x += 5
  ) {

    box(
      parent,
      mats.stoneLight,

      4,
      0.10,
      4,

      x,
      0.05,
      7
    );
  }
}


// ================================================================
// CASTELO
// ================================================================

export function createCastle(
  scene
) {

  const root =
    new THREE.Group();


  root.name =
    'Castelo de Bodiam - Modelagem';


  scene.add(
    root
  );


  const mats =
    createMaterials();


  const doors =
    [];


  // ==============================================================
  // TERRENO
  // ==============================================================

  const ground =
    mesh(

      new THREE.PlaneGeometry(
        180,
        180
      ),

      mats.grass,

      root,

      0,
      0,
      0
    );


  ground.rotation.x =
    -Math.PI / 2;


  // ==============================================================
  // DIMENSÕES GERAIS
  // ==============================================================

  const HALF =
    42;


  // ------------------------------------------------
  // IMPORTANTE:
  //
  // As muralhas chegam agora até +/- 42.
  //
  // Como as torres possuem raio 7.5, a parede entra
  // dentro do volume da torre.
  //
  // Isso elimina os espaços entre parede e torre.
  // ------------------------------------------------


  // ==============================================================
  // MURALHA FRONTAL
  //
  // Deixamos somente o espaço central do gatehouse.
  // ==============================================================

  createWallX(
    root,
    mats,

    -HALF,

    -HALF,
    -10
  );


  createWallX(
    root,
    mats,

    -HALF,

    10,
    HALF
  );


  // ==============================================================
  // MURALHA TRASEIRA
  //
  // Passa atrás da torre intermediária.
  // A sobreposição é proposital para eliminar espaços.
  // ==============================================================

  createWallX(
    root,
    mats,

    HALF,

    -HALF,
    HALF
  );


  // ==============================================================
  // MURALHA OESTE
  // ==============================================================

  createWallZ(
    root,
    mats,

    -HALF,

    -HALF,
    HALF
  );


  // ==============================================================
  // MURALHA LESTE
  // ==============================================================

  createWallZ(
    root,
    mats,

    HALF,

    -HALF,
    HALF
  );


  // ==============================================================
  // QUATRO TORRES CILÍNDRICAS
  // ==============================================================

  createCornerTower(
    root,
    mats,

    -HALF,
    -HALF,

    'Torre frontal oeste'
  );


  createCornerTower(
    root,
    mats,

    HALF,
    -HALF,

    'Torre frontal leste'
  );


  createCornerTower(
    root,
    mats,

    -HALF,
    HALF,

    'Torre traseira oeste'
  );


  createCornerTower(
    root,
    mats,

    HALF,
    HALF,

    'Torre traseira leste'
  );


  // ==============================================================
  // LIGAÇÕES DO CAMINHO COM AS TORRES
  //
  // Não são entradas.
  //
  // São somente extensões do piso superior para que não exista
  // buraco entre a passarela e o volume das torres.
  // ==============================================================


  // Frente esquerda
  createTowerConnection(
    root,
    mats,

    -37.5,
    -42,

    9,
    4.3
  );


  // Frente direita
  createTowerConnection(
    root,
    mats,

    37.5,
    -42,

    9,
    4.3
  );


  // Fundo esquerdo
  createTowerConnection(
    root,
    mats,

    -37.5,
    42,

    9,
    4.3
  );


  // Fundo direito
  createTowerConnection(
    root,
    mats,

    37.5,
    42,

    9,
    4.3
  );


  // Oeste / frente
  createTowerConnection(
    root,
    mats,

    -42,
    -37.5,

    4.3,
    9
  );


  // Oeste / fundo
  createTowerConnection(
    root,
    mats,

    -42,
    37.5,

    4.3,
    9
  );


  // Leste / frente
  createTowerConnection(
    root,
    mats,

    42,
    -37.5,

    4.3,
    9
  );


  // Leste / fundo
  createTowerConnection(
    root,
    mats,

    42,
    37.5,

    4.3,
    9
  );


  // ==============================================================
  // TORRES INTERMEDIÁRIAS
  // ==============================================================

  createRectTower(
    root,
    mats,
    {

      x:
        -HALF,

      z:
        0,

      width:
        9,

      depth:
        9,

      height:
        21,

      rotationY:
        Math.PI / 2,

      name:
        'Torre intermediária oeste'
    }
  );


  createRectTower(
    root,
    mats,
    {

      x:
        HALF,

      z:
        0,

      width:
        9,

      depth:
        9,

      height:
        21,

      rotationY:
        -Math.PI / 2,

      name:
        'Torre intermediária leste'
    }
  );


  // ==============================================================
  // TORRE CENTRAL TRASEIRA
  // ==============================================================

  createRectTower(
    root,
    mats,
    {

      x:
        0,

      z:
        HALF,

      width:
        11,

      depth:
        9,

      height:
        22,

      rotationY:
        Math.PI,

      name:
        'Torre central traseira'
    }
  );


  // ==============================================================
  // PORTARIA
  // ==============================================================

  createGatehouse(
    root,
    mats,
    doors
  );



  // ==============================================================
  // DUAS CONSTRUÇÕES INTERNAS
  // ==============================================================

  createInternalBuilding(
    root,
    mats,
    doors,
    {

      x:
        -22,

      z:
        13,

      width:
        18,

      depth:
        12,

      height:
        9,

      name:
        'Edifício interno oeste',

      stairSide:
        'east'
    }
  );


  createInternalBuilding(
    root,
    mats,
    doors,
    {

      x:
        22,

      z:
        14,

      width:
        17,

      depth:
        12,

      height:
        9.5,

      name:
        'Edifício interno leste',

      stairSide:
        'west'
    }
  );


  // ==============================================================
  // ESCADA PARA O CAMINHO DA MURALHA
  //
  // Agora a altura final coincide com o piso superior da muralha.
  // ==============================================================

  createStoneStair(
  root,
  mats,
  {
    x: 37.0,
    z: -20.0,

    width: 4.0,
    length: 18.0,

    height: 13.2,

    steps: 22,

    axis: 'z',

    // Faz os degraus subirem em direção à muralha.
    reverse: true
  }
);


  // ==============================================================
  // PLATAFORMA SUPERIOR DA ESCADA
  //
  // Liga a escada ao caminho da muralha frontal.
  // ==============================================================

  box(
  root,
  mats.stoneLight,

  7.0,
  0.48,
  5.0,

  39.0,
  13.25,
  -8.5
);


  // ==============================================================
  // PÁTIO
  // ==============================================================

  createCourtyard(
    root,
    mats
  );


  // ==============================================================
  // RETORNO
  // ==============================================================

  return {

    root,

    doors,

    materials:
      mats
  };
}