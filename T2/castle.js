import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';
import { CSG } from '../libs/other/CSGMesh.js';

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
    'rgb(72, 103, 61)',

  grassDark:
    'rgb(49, 82, 46)',

  sand:
    'rgb(177, 151, 101)',

  water:
    'rgb(48, 102, 128)'
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
      ),

    grassDark:
      setDefaultMaterial(
        COLORS.grassDark
      ),

    sand:
      setDefaultMaterial(
        COLORS.sand
      ),

    water:
      setDefaultMaterial(
        COLORS.water
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

    height = 1.8,

    clearances = []

  } = cfg;


  const step =
    merlon + gap;


  for (
    let p = start;
    p <= end;
    p += step
  ) {

    const merlonStart = p - merlon / 2;
    const merlonEnd = p + merlon / 2;
    const crossesPassage = clearances.some(clearance =>
      merlonEnd >= clearance.min && merlonStart <= clearance.max
    );

    if (crossesPassage) continue;

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

  const towerBase = csgMesh(
    new THREE.CylinderGeometry(radius, radius, height, 40),
    x,
    height / 2,
    z
  );

  const passageLength = radius + 3;
  const inwardX = -Math.sign(x);
  const inwardZ = -Math.sign(z);
  // As duas passagens se cruzam exatamente no eixo central da torre.
  const horizontalPassageZ = z;
  const towerCutters = [
    // Corredores superiores em L: cada abertura segue somente para o
    // pátio, sem perfurar as faces externas das torres.
    csgMesh(
      new THREE.BoxGeometry(passageLength, 4.2, 5.2),
      x + inwardX * passageLength / 2,
      15.25,
      horizontalPassageZ
    ),
    csgMesh(
      new THREE.BoxGeometry(5.2, 4.2, passageLength),
      x,
      15.25,
      z + inwardZ * passageLength / 2
    )
  ];

  for (const slitBottom of [6.5, 18.2]) {
    towerCutters.push(...createArchedCutters({
      throughAxis: 'x', x, bottomY: slitBottom, z, depth: radius * 2 + 3
    }));
    towerCutters.push(...createArchedCutters({
      throughAxis: 'z', x, bottomY: slitBottom, z, depth: radius * 2 + 3
    }));
  }

  const towerBody = subtractCSG(
    group,
    towerBase,
    towerCutters,
    mats.stone,
    `${name} - corpo com acessos e seteiras CSG`
  );
  towerBody.userData.collisionOpenings = [
    {
      minX: Math.min(x, x + inwardX * passageLength) - 0.15,
      maxX: Math.max(x, x + inwardX * passageLength) + 0.15,
      minY: 13.1,
      maxY: 17.4,
      minZ: horizontalPassageZ - 2.6,
      maxZ: horizontalPassageZ + 2.6
    },
    {
      minX: x - 2.6,
      maxX: x + 2.6,
      minY: 13.1,
      maxY: 17.4,
      minZ: Math.min(z, z + inwardZ * passageLength) - 0.15,
      maxZ: Math.max(z, z + inwardZ * passageLength) + 0.15
    }
  ];

  // Piso contínuo na altura das passarelas. O corpo foi vazado por CSG,
  // mas esta laje mantém a circulação entre os dois muros adjacentes.
  cylinder(
    group,
    mats.stoneLight,
    radius - 0.7,
    0.42,
    x,
    13.2,
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

    walkthroughAxis = null,

    csgArrowSlits = false,

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

  let towerBody;

  const hasWalkthrough =
    walkthroughAxis === 'x' || walkthroughAxis === 'z';

  if (hasWalkthrough || csgArrowSlits) {
    const base = csgMesh(
      new THREE.BoxGeometry(width, height, depth),
      0,
      height / 2,
      0
    );
    const passageWidth = 5.2;
    const cutters = [];

    if (hasWalkthrough) {
      cutters.push(csgMesh(
        new THREE.BoxGeometry(
          walkthroughAxis === 'x' ? width + 2 : passageWidth,
          4.5,
          walkthroughAxis === 'z' ? depth + 2 : passageWidth
        ),
        0,
        15.25,
        0
      ));
    }

    if (csgArrowSlits) {
      // As seteiras atravessam toda a espessura da torre. Cada vazio e formado
      // por uma haste retangular e uma pequena cabeca semicircular.
      for (const bottomY of [6.05, 13.05]) {
        cutters.push(...createArchedCutters({
          throughAxis: 'z',
          x: 0,
          bottomY,
          z: 0,
          width: 0.58,
          height: 2.25,
          depth: depth + 2
        }));
      }
    }

    towerBody = subtractCSG(
      group,
      base,
      cutters,
      mats.stone,
      `${name} - corpo vazado por CSG`
    );

    if (hasWalkthrough) {
      towerBody.userData.collisionOpenings = [{
        minX: walkthroughAxis === 'x' ? -width / 2 - 1 : -passageWidth / 2,
        maxX: walkthroughAxis === 'x' ? width / 2 + 1 : passageWidth / 2,
        minY: 13.0,
        maxY: 17.5,
        minZ: walkthroughAxis === 'z' ? -depth / 2 - 1 : -passageWidth / 2,
        maxZ: walkthroughAxis === 'z' ? depth / 2 + 1 : passageWidth / 2
      }];

      const passageFloor = box(
        group,
        mats.stoneLight,
        walkthroughAxis === 'x' ? width + 0.5 : passageWidth - 0.3,
        0.42,
        walkthroughAxis === 'z' ? depth + 0.5 : passageWidth - 0.3,
        0,
        13.2,
        0
      );
      passageFloor.name = `${name} - piso da passagem superior`;
    }
  } else {
    towerBody = box(
      group,
      mats.stone,
      width,
      height,
      depth,
      0,
      height / 2,
      0
    );
  }


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

  if (!csgArrowSlits) {
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
  }


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
  height = 13,
  crenellationClearances = []
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

  createCSGWallBody(parent, mats.stone, {
    axis: 'x',
    fixed: z,
    start: x1,
    end: x2,
    height,
    thickness
  });


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
        1.1,

      clearances:
        crenellationClearances
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
        1.1,

      clearances:
        crenellationClearances
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
  height = 13,
  crenellationClearances = []
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

  createCSGWallBody(parent, mats.stone, {
    axis: 'z',
    fixed: x,
    start: z1,
    end: z2,
    height,
    thickness
  });


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
        1.1,

      clearances:
        crenellationClearances
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
        1.1,

      clearances:
        crenellationClearances
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
        -9,

      z:
        -0.5,

      width:
        towerWidth,

      depth:
        towerDepth,

      height:
        towerHeight,

      walkthroughAxis:
        'x',

      csgArrowSlits:
        true,

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
        9,

      z:
        -0.5,

      width:
        towerWidth,

      depth:
        towerDepth,

      height:
        towerHeight,

      walkthroughAxis:
        'x',

      csgArrowSlits:
        true,

      name:
        'Torre direita da portaria'
    }
  );


  // ==============================================================
  // BLOCO CENTRAL
  // ==============================================================

  const mainPortico = createCSGPortico(group, mats, {
    width: 23,
    height: 13,
    depth: 7,
    openingWidth,
    openingHeight,
    z: -0.3
  });
  // O corpo do pórtico permanece colidível para bloquear as paredes dos dois
  // lados. O vão central continua livre pela collisionOpening criada no CSG e
  // pelo corredor principal tratado no sistema de colisão.
  mainPortico.userData.noCollision = false;


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

  // A moldura segue o mesmo perfil curvo do vazio CSG. A antiga vergada
  // retangular escondia o arco quando a portaria era observada de fora.
  createArchedPortalTrim(group, mats, {
    openingWidth,
    openingHeight: openingHeight + 0.45,
    z: -3.98
  });


  // ==============================================================
  // PORTÃO PRINCIPAL
  // ==============================================================

  const doorZ =
    -1.25;


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

  // O portão é automático e não deve criar uma barreira invisível enquanto
  // as folhas ainda completam a animação. A moldura e o pórtico continuam
  // colidíveis; somente as duas folhas e seus detalhes são decorativos.
  for (const door of [left, right]) {
    door.panel.traverse(obj => {
      if (obj.isMesh) obj.userData.noCollision = true;
    });
  }


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
        step.userData.noCollision = true;

        if (axis === 'z') {
            box(parent, mats.stoneLight, wallThickness, h, stepLength, x - width / 2, h / 2, sz);
            box(parent, mats.stoneLight, wallThickness, h, stepLength, x + width / 2, h / 2, sz);
        } else {
            box(parent, mats.stoneLight, stepLength, h, wallThickness, sx, h / 2, z - width / 2);
            box(parent, mats.stoneLight, stepLength, h, wallThickness, sx, h / 2, z + width / 2);
        }
    }

    const slopeLength = Math.hypot(length, height);
    const rampMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const ramp = mesh(
        new THREE.BoxGeometry(
            axis === 'z' ? width - wallThickness * 2 : slopeLength,
            0.16,
            axis === 'z' ? slopeLength : width - wallThickness * 2
        ),
        rampMaterial,
        parent,
        x,
        height / 2,
        z
    );

    const direction = reverse ? 1 : -1;
    const angle = Math.atan2(height, length);
    ramp.rotation[axis === 'z' ? 'x' : 'z'] =
        axis === 'z' ? -direction * angle : direction * angle;
    ramp.castShadow = false;
    ramp.receiveShadow = false;
    ramp.userData.isRamp = true;
    ramp.userData.ramp = { axis, direction, x, z, width, length, height };
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

  createExternalAccess(root, mats);


  // ==============================================================
  // DIMENSÕES GERAIS
  // ==============================================================

  const HALF =
    42;

  const FRONT_CURTAIN_Z = -HALF;
  // As muralhas terminam exatamente nas faces externas das torres da
  // portaria (centros em +/-7.5 e largura 8), sem ponte ou vão intermediário.
  const GATE_RETURN_X = 11.5;

  // Recuo bem marcado na muralha lateral leste (direita em planta).
  const EAST_RECESS_X = 34;
  const EAST_RECESS_FRONT_Z = -28;
  const EAST_RECESS_BACK_Z = -12;
  const FRONT_CORNER_CLEARANCE = { min: -HALF - 8, max: -HALF + 8 };
  const BACK_CORNER_CLEARANCE = { min: HALF - 8, max: HALF + 8 };
  const MID_TOWER_CLEARANCE = { min: -5.5, max: 5.5 };
  const LEFT_GATEHOUSE_CLEARANCE = { min: -16, max: -10 };
  const RIGHT_GATEHOUSE_CLEARANCE = { min: 10, max: 16 };
  const WEST_STAIR_CLEARANCE = { min: 5.5, max: 12 };
  const L_FRONT_CLEARANCE = { min: EAST_RECESS_FRONT_Z - 3, max: EAST_RECESS_FRONT_Z + 3 };
  const L_BACK_CLEARANCE = { min: EAST_RECESS_BACK_Z - 3, max: EAST_RECESS_BACK_Z + 3 };
  const L_HORIZONTAL_CLEARANCE = { min: EAST_RECESS_X - 2, max: HALF + 2 };
  const L_VERTICAL_CLEARANCE = {
    min: EAST_RECESS_FRONT_Z - 2,
    max: EAST_RECESS_BACK_Z + 2
  };


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

    FRONT_CURTAIN_Z,

    -HALF,
    -GATE_RETURN_X,

    13,
    [FRONT_CORNER_CLEARANCE, LEFT_GATEHOUSE_CLEARANCE]
  );


  createWallX(
    root,
    mats,

    FRONT_CURTAIN_Z,

    GATE_RETURN_X,
    HALF,

    13,
    [RIGHT_GATEHOUSE_CLEARANCE, BACK_CORNER_CLEARANCE]
  );

  // Toda a fachada, a portaria e as aberturas das torres compartilham o
  // mesmo eixo. Não há retornos perpendiculares junto à entrada.

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
    HALF,

    13,
    [FRONT_CORNER_CLEARANCE, MID_TOWER_CLEARANCE, BACK_CORNER_CLEARANCE]
  );


  // ==============================================================
  // MURALHA OESTE
  // ==============================================================

  createWallZ(
    root,
    mats,
    -HALF,
    -HALF,
    HALF,
    13,
    [
      FRONT_CORNER_CLEARANCE,
      MID_TOWER_CLEARANCE,
      WEST_STAIR_CLEARANCE,
      BACK_CORNER_CLEARANCE
    ]
  );


  // ==============================================================
  // MURALHA LESTE
  // ==============================================================

  // Trecho reto desde a torre frontal até o início do recuo.
  createWallZ(
    root,
    mats,
    HALF,
    -HALF,
    EAST_RECESS_FRONT_Z,
    13,
    [FRONT_CORNER_CLEARANCE, L_FRONT_CLEARANCE]
  );

  // Primeira perna do L: sem ameias sobrepostas na quina.
  createWallX(
    root,
    mats,
    EAST_RECESS_FRONT_Z,
    EAST_RECESS_X,
    HALF,
    13,
    [L_HORIZONTAL_CLEARANCE]
  );

  // Fundo do recuo, paralelo à muralha lateral original.
  createWallZ(
    root,
    mats,
    EAST_RECESS_X,
    EAST_RECESS_FRONT_Z,
    EAST_RECESS_BACK_Z,
    13,
    [L_VERTICAL_CLEARANCE]
  );

  // Segunda perna do L e retorno ao alinhamento exterior, também limpa.
  createWallX(
    root,
    mats,
    EAST_RECESS_BACK_Z,
    EAST_RECESS_X,
    HALF,
    13,
    [L_HORIZONTAL_CLEARANCE]
  );

  // Continuação até a torre traseira. O piso superior de todos os trechos
  // permanece na mesma altura e se sobrepõe nas quinas.
  createWallZ(
    root,
    mats,
    HALF,
    EAST_RECESS_BACK_Z,
    HALF,
    13,
    [L_BACK_CLEARANCE, MID_TOWER_CLEARANCE, BACK_CORNER_CLEARANCE]
  );

  // Ameias organizadas somente na borda externa do recuo. O lado interno
  // permanece livre para circulação e para o desembarque da escada.
  for (const z of [-25.2, -21.4, -17.6, -14.2]) {
    const merlon = box(
      root,
      mats.stoneLight,
      1.1,
      1.8,
      1.6,
      EAST_RECESS_X + 2.35,
      14.15,
      z
    );
    merlon.name = 'Ameia organizada da borda externa do recuo em L';
  }

  for (const x of [36.2, 39.2]) {
    const merlon = box(
      root,
      mats.stoneLight,
      1.6,
      1.8,
      1.1,
      x,
      14.15,
      EAST_RECESS_FRONT_Z - 2.35
    );
    merlon.name = 'Ameia organizada da curva frontal do recuo em L';
  }


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
    FRONT_CURTAIN_Z,

    9,
    4.3
  );


  // Frente direita
  createTowerConnection(
    root,
    mats,

    37.5,
    FRONT_CURTAIN_Z,

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

      walkthroughAxis:
        'x',

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

      walkthroughAxis:
        'x',

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

      walkthroughAxis:
        'x',

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
    x: 29.0,
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
  // Liga a escada ao caminho do recuo e à sua perna transversal.
  // ==============================================================

  const eastWallLanding = box(
  root,
  mats.stoneLight,

  13.0,
  0.48,
  6.6,

  33.5,
  13.25,
  -7.8
);
  eastWallLanding.name = 'Patamar superior da escada leste';

  // Apoio maciço até o terreno, colocado após a chegada dos degraus para
  // sustentar visualmente o patamar sem bloquear a subida.
  const eastLandingSupport = box(
    root,
    mats.stoneDark,
    12.0,
    13.0,
    8.0,
    33.0,
    6.5,
    -7.8
  );
  eastLandingSupport.name = 'Apoio do patamar da escada leste';

  // Segundo acesso, no lado oeste, evita que metade da passarela dependa
  // de um único percurso e mantém todos os muros alcançáveis a pé.
  createStoneStair(
    root,
    mats,
    {
      x: -37.0,
      z: 20.0,
      width: 4.0,
      length: 18.0,
      height: 13.2,
      steps: 22,
      axis: 'z',
      reverse: false
    }
  );

  const westWallLanding = box(
    root,
    mats.stoneLight,
    8.2,
    0.48,
    6.6,
    -39.0,
    13.25,
    7.8
  );
  westWallLanding.name = 'Patamar superior da escada oeste';

  const westLandingSupport = box(
    root,
    mats.stoneDark,
    8.2,
    13.0,
    7.0,
    -39.0,
    6.5,
    7.8
  );
  westLandingSupport.name = 'Apoio do patamar da escada oeste';


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


// ================================================================
// OPERAÇÕES CSG
//
// As operações são executadas apenas durante a construção do cenário.
// Os cortadores nunca são adicionados à cena.
// ================================================================

function csgMesh(geometry, x, y, z, rotationX = 0, rotationY = 0, rotationZ = 0) {
  const obj = new THREE.Mesh(geometry);
  obj.position.set(x, y, z);
  obj.rotation.set(rotationX, rotationY, rotationZ);
  obj.matrixAutoUpdate = false;
  obj.updateMatrix();
  return obj;
}


function subtractCSG(parent, base, cutters, material, name) {
  let solid = CSG.fromMesh(base);

  for (const cutter of cutters) {
    solid = solid.subtract(CSG.fromMesh(cutter));
  }

  const result = CSG.toMesh(solid, new THREE.Matrix4());
  result.material = material;
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}


function createArchedCutters(cfg) {
  const {
    throughAxis,
    x,
    bottomY,
    z,
    width = 0.58,
    height = 2.25,
    depth = 8
  } = cfg;

  const radius = width / 2;
  const shaftHeight = height - radius;
  const shaftGeometry = throughAxis === 'z'
    ? new THREE.BoxGeometry(width, shaftHeight, depth)
    : new THREE.BoxGeometry(depth, shaftHeight, width);

  const shaft = csgMesh(
    shaftGeometry,
    x,
    bottomY + shaftHeight / 2,
    z
  );

  const arch = csgMesh(
    new THREE.CylinderGeometry(radius, radius, depth, 20),
    x,
    bottomY + shaftHeight,
    z,
    throughAxis === 'z' ? Math.PI / 2 : 0,
    0,
    throughAxis === 'x' ? Math.PI / 2 : 0
  );

  return [shaft, arch];
}


function createCSGWallBody(parent, material, cfg) {
  const { axis, fixed, start, end, height, thickness } = cfg;
  const length = end - start;
  const center = (start + end) / 2;
  const base = axis === 'x'
    ? csgMesh(new THREE.BoxGeometry(length, height, thickness), center, height / 2, fixed)
    : csgMesh(new THREE.BoxGeometry(thickness, height, length), fixed, height / 2, center);

  const cutters = [];
  const margin = 7;
  const spacing = 11;

  for (let value = start + margin; value <= end - margin; value += spacing) {
    cutters.push(...createArchedCutters({
      throughAxis: axis === 'x' ? 'z' : 'x',
      x: axis === 'x' ? value : fixed,
      bottomY: 5.6,
      z: axis === 'x' ? fixed : value,
      depth: thickness + 2
    }));
  }

  return subtractCSG(
    parent,
    base,
    cutters,
    material,
    `Muralha ${axis.toUpperCase()} com seteiras CSG`
  );
}


function createCSGPortico(parent, mats, cfg) {
  const {
    width,
    height,
    depth,
    openingWidth,
    openingHeight,
    z,
    name = 'Pórtico principal com arco CSG'
  } = cfg;
  const base = csgMesh(
    new THREE.BoxGeometry(width, height, depth),
    0,
    height / 2,
    z
  );
  const cutters = createArchedCutters({
    throughAxis: 'z',
    x: 0,
    bottomY: -0.05,
    z,
    width: openingWidth,
    height: openingHeight + 0.45,
    depth: depth + 2
  });

  const portico = subtractCSG(
    parent,
    base,
    cutters,
    mats.stone,
    name
  );
  portico.userData.collisionOpenings = [{
    minX: -openingWidth / 2,
    maxX: openingWidth / 2,
    minY: -0.1,
    maxY: openingHeight + 0.35,
    minZ: z - depth / 2 - 0.2,
    maxZ: z + depth / 2 + 0.2
  }];
  return portico;
}


function createArchedPortalTrim(parent, mats, cfg) {
  const {
    openingWidth,
    openingHeight,
    z,
    trim = 0.3,
    depth = 0.58
  } = cfg;
  const radius = openingWidth / 2;
  const springY = openingHeight - radius;
  const archRadius = radius + trim;

  const arch = mesh(
    new THREE.TorusGeometry(archRadius, trim, 8, 36, Math.PI),
    mats.stoneLight,
    parent,
    0,
    springY,
    z
  );
  arch.name = 'Adorno semicircular do portico principal';
  arch.userData.noCollision = true;

  for (const side of [-1, 1]) {
    const jamb = box(
      parent,
      mats.stoneLight,
      trim * 2,
      springY,
      depth,
      side * (radius + trim),
      springY / 2,
      z
    );
    jamb.name = 'Ombreira recuada do portico principal';
    jamb.userData.noCollision = true;
  }
}


function createRuinedPlatformWall(parent, mats) {
  const length = 13.2;
  const thickness = 0.82;
  const profile = [
    [-6.6, 1.25], [-5.75, 1.65], [-5.05, 2.35], [-4.3, 3.7],
    [-3.7, 3.25], [-3.05, 5.35], [-2.25, 6.85], [-1.45, 7.35],
    [-0.65, 6.55], [0.05, 5.15], [0.85, 5.7], [1.55, 4.15],
    [2.35, 4.55], [3.15, 3.0], [4.05, 3.55], [4.9, 2.15],
    [5.75, 2.45], [6.6, 1.3]
  ];

  const shape = new THREE.Shape();
  shape.moveTo(-length / 2, 0);
  shape.lineTo(length / 2, 0);
  for (let index = profile.length - 1; index >= 0; index--) {
    shape.lineTo(profile[index][0], profile[index][1]);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1
  });
  geometry.translate(0, 0, -thickness / 2);

  const wall = mesh(geometry, mats.stoneDark, parent, -6.2, 0.2, -70.5);
  wall.rotation.y = Math.PI / 2;
  wall.name = 'Muro lateral externo com perfil arruinado';

  // Pedras aparentes quebram a superficie plana sem invadir a trilha central.
  const faceStones = [
    { z: -65.2, y: 0.75, h: 0.42, d: 1.15, r: 0.035 },
    { z: -66.6, y: 1.15, h: 0.48, d: 1.0, r: -0.04 },
    { z: -67.8, y: 2.25, h: 0.52, d: 1.25, r: 0.025 },
    { z: -68.8, y: 4.0, h: 0.46, d: 0.85, r: -0.055 },
    { z: -70.0, y: 1.25, h: 0.5, d: 1.4, r: 0.035 },
    { z: -70.7, y: 5.15, h: 0.42, d: 0.8, r: -0.045 },
    { z: -72.0, y: 2.5, h: 0.48, d: 1.15, r: 0.05 },
    { z: -73.3, y: 1.15, h: 0.5, d: 1.35, r: -0.035 },
    { z: -74.3, y: 2.35, h: 0.44, d: 0.85, r: 0.045 },
    { z: -75.5, y: 0.85, h: 0.46, d: 1.15, r: -0.03 }
  ];

  for (const [index, stone] of faceStones.entries()) {
    const block = box(
      parent,
      index % 3 === 0 ? mats.stoneLight : mats.stone,
      0.2,
      stone.h,
      stone.d,
      -5.73,
      stone.y,
      stone.z
    );
    block.rotation.x = stone.r;
    block.name = 'Pedra exposta no muro arruinado';
    block.userData.noCollision = true;
  }

  const rubble = [
    { x: -5.65, z: -64.5, w: 0.8, h: 0.42, d: 0.95, ry: 0.35 },
    { x: -6.65, z: -66.0, w: 0.72, h: 0.5, d: 0.85, ry: -0.25 },
    { x: -5.55, z: -71.8, w: 0.95, h: 0.46, d: 0.72, ry: 0.5 },
    { x: -6.55, z: -74.7, w: 0.8, h: 0.4, d: 1.0, ry: -0.4 },
    { x: -5.6, z: -76.5, w: 0.7, h: 0.52, d: 0.82, ry: 0.2 }
  ];

  for (const part of rubble) {
    const stone = box(
      parent,
      mats.stoneDark,
      part.w,
      part.h,
      part.d,
      part.x,
      0.3,
      part.z
    );
    stone.rotation.y = part.ry;
    stone.rotation.z = part.ry * 0.18;
    stone.name = 'Entulho junto ao muro arruinado';
    stone.userData.noCollision = true;
  }
}


function createHorizontalSurface(parent, material, points, y, name) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], -points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], -points[i][1]);
  }
  shape.closePath();

  const surface = mesh(new THREE.ShapeGeometry(shape), material, parent, 0, y, 0);
  surface.rotation.x = -Math.PI / 2;
  surface.name = name;
  surface.userData.noCollision = true;
  return surface;
}


function createCourtyardGround(parent, mats) {
  // Faces internas das muralhas de espessura 6:
  // x = +/-39, frente = -39 e fundo = 39. No lado leste, o contorno
  // acompanha o recuo em L e exclui completamente a area externa a ele.
  const west = -39;
  const east = 39;
  const front = -39;
  const back = 39;
  const recessInnerX = 36;
  const recessFrontZ = -31;
  const recessBackZ = -9;
  const footprint = [
    [west, front],
    [east, front],
    [east, recessFrontZ],
    [recessInnerX, recessFrontZ],
    [recessInnerX, recessBackZ],
    [east, recessBackZ],
    [east, back],
    [west, back]
  ];

  const groundMaterial = mats.grass.clone();
  groundMaterial.side = THREE.DoubleSide;

  const ground = createHorizontalSurface(
    parent,
    groundMaterial,
    footprint,
    0.015,
    'Terreno interno recortado pela projecao das muralhas'
  );
  ground.renderOrder = 1;

  // O sistema de colisao trabalha com caixas delimitadoras. Tres caixas
  // transparentes reproduzem a mesma forma concava sem sustentar o jogador
  // sobre o vazio do recuo em L.
  const colliderMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const colliderParts = [
    {
      minX: west,
      maxX: recessInnerX,
      minZ: front,
      maxZ: back
    },
    {
      minX: recessInnerX,
      maxX: east,
      minZ: front,
      maxZ: recessFrontZ
    },
    {
      minX: recessInnerX,
      maxX: east,
      minZ: recessBackZ,
      maxZ: back
    }
  ];

  for (const [index, part] of colliderParts.entries()) {
    const collider = box(
      parent,
      colliderMaterial,
      part.maxX - part.minX,
      0.5,
      part.maxZ - part.minZ,
      (part.minX + part.maxX) / 2,
      -0.24,
      (part.minZ + part.maxZ) / 2
    );
    collider.name = `Colisor do terreno interno ${index + 1}`;
    collider.castShadow = false;
    collider.receiveShadow = false;
    collider.userData.grassSupport = true;
  }

  return ground;
}


function createExternalAccess(parent, mats) {
  const water = mesh(
    new THREE.PlaneGeometry(360, 360),
    mats.water,
    parent,
    0,
    -1,
    0
  );
  water.rotation.x = -Math.PI / 2;
  water.name = 'Plano-base de água';
  water.userData.noCollision = true;

  // O piso segue a projecao interna do castelo, inclusive o recuo em L.
  // Assim nenhuma faixa de grama ultrapassa as muralhas sobre a agua.
  createCourtyardGround(parent, mats);

  const gateFloor = box(parent, mats.stoneLight, 7, 0.48, 15, 0, -0.11, -38.5);
  gateFloor.name = 'Piso contínuo sob o pórtico principal';

  // Plataforma longa e estreita que parte do pórtico.
  const platformBase = box(parent, mats.stoneDark, 15, 1.1, 34, 0, -0.45, -62.5);
  platformBase.name = 'Base de pedra da plataforma externa';

  const platformGrass = box(parent, mats.grassDark, 14.4, 0.22, 33.4, 0, 0.10, -62.5);
  platformGrass.name = 'Vegetação da plataforma externa';
  platformGrass.userData.noCollision = false;
  platformGrass.userData.grassSupport = true;

  createHorizontalSurface(parent, mats.sand, [
    [-2.8, -45.8], [2.8, -45.8], [2.35, -56], [2.75, -66],
    [2.25, -79.1], [-2.25, -79.1], [-2.65, -66], [-2.3, -56]
  ], 0.225, 'Trilha de areia da plataforma externa');

  // Muro lateral arruinado: fino, irregular e fora da faixa caminhável.
  // A silhueta fragmentada reproduz a ruína da referência sem criar um
  // bloqueio transversal artificial no meio da plataforma.
  createRuinedPlatformWall(parent, mats);

  // Pequena ponte sobre um vão de água antes da ilha terminal.
  const bridgeLength = 13.4;
  const bridge = box(parent, mats.wood, 5.2, 0.38, bridgeLength, 0, 0.18, -84.7);
  bridge.name = 'Ponte da plataforma externa';

  // Colisor único e contínuo, sobreposto à plataforma e à ilha. Isso evita
  // que pequenas frestas entre geometrias façam a câmera cair no vazio.
  const bridgeCollider = box(
    parent,
    new THREE.MeshBasicMaterial({ visible: false }),
    5.0,
    0.24,
    bridgeLength + 0.8,
    0,
    0.20,
    -84.7
  );
  bridgeCollider.castShadow = false;
  bridgeCollider.receiveShadow = false;
  bridgeCollider.name = 'Colisor contínuo da ponte externa';

  for (const x of [-2.3, 2.3]) {
    const rail = box(parent, mats.woodDark, 0.22, 0.65, bridgeLength, x, 0.58, -84.7);
    rail.name = 'Guarda-corpo da ponte externa';
  }

  // Ilha oval terminal, separada da plataforma pelo vão da ponte.
  const islandBase = cylinder(parent, mats.stoneDark, 13.5, 1.1, 0, -0.45, -99.5, 48);
  islandBase.scale.z = 0.74;
  islandBase.name = 'Base de pedra da ilha externa';

  const islandGrass = cylinder(parent, mats.grassDark, 13, 0.24, 0, 0.11, -99.5, 48);
  islandGrass.scale.z = 0.72;
  islandGrass.name = 'Vegetação da ilha externa';
  islandGrass.userData.noCollision = false;
  islandGrass.userData.grassSupport = true;

  createHorizontalSurface(parent, mats.sand, [
    [-2.2, -89.6], [2.2, -89.6], [3.0, -94], [4.8, -99],
    [3.1, -104], [1.4, -108], [-1.4, -108], [-3.0, -104],
    [-4.8, -99], [-2.9, -94]
  ], 0.245, 'Trilha de areia da ilha externa');
}
