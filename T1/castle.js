import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

// ================================================================
// CASTELO DE BODIAM - MODELAGEM DO AMBIENTE
// Toda a geometria é construída com primitivas do Three.js.
// Não há modelos externos/importados.
// ================================================================

const COLORS = {
  stone: 'rgb(132, 126, 112)',
  stone2: 'rgb(151, 144, 126)',
  stoneDark: 'rgb(100, 95, 84)',
  stoneVeryDark: 'rgb(55, 53, 48)',
  wood: 'rgb(86, 53, 30)',
  woodDark: 'rgb(48, 31, 20)',
  iron: 'rgb(45, 45, 42)',
  grass: 'rgb(74, 104, 63)'
};


// ================================================================
// FUNÇÕES AUXILIARES
// ================================================================

function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const obj = new THREE.Mesh(geometry, material);

  obj.position.set(x, y, z);

  obj.castShadow = true;
  obj.receiveShadow = true;

  parent.add(obj);

  return obj;
}


function box(parent, material, w, h, d, x, y, z) {
  return mesh(
    new THREE.BoxGeometry(w, h, d),
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


function cone(
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
    new THREE.ConeGeometry(
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
    stone: setDefaultMaterial(COLORS.stone),
    stone2: setDefaultMaterial(COLORS.stone2),
    stoneDark: setDefaultMaterial(COLORS.stoneDark),
    stoneVeryDark: setDefaultMaterial(COLORS.stoneVeryDark),

    wood: setDefaultMaterial(COLORS.wood),
    woodDark: setDefaultMaterial(COLORS.woodDark),

    iron: setDefaultMaterial(COLORS.iron),

    grass: setDefaultMaterial(COLORS.grass)
  };
}


// ================================================================
// DETALHES DE PEDRA
// ================================================================

function addStoneBand(parent, mat, x, y, z, w, d) {
  box(
    parent,
    mat,
    w,
    0.45,
    d,
    x,
    y,
    z
  );
}


// ================================================================
// SETEIRAS
// ================================================================

function addArrowSlit(
  parent,
  mats,
  x,
  y,
  z,
  rotY = 0,
  scale = 1
) {
  const group = new THREE.Group();

  group.position.set(x, y, z);
  group.rotation.y = rotY;

  parent.add(group);

  // Parte vertical
  box(
    group,
    mats.stoneVeryDark,
    0.34 * scale,
    2.2 * scale,
    0.12,
    0,
    0,
    0
  );

  // Parte horizontal
  box(
    group,
    mats.stoneVeryDark,
    1.0 * scale,
    0.25 * scale,
    0.13,
    0,
    0.15 * scale,
    0.01
  );
}


// ================================================================
// JANELAS
// ================================================================

function addNarrowWindow(
  parent,
  mats,
  x,
  y,
  z,
  rotY = 0
) {
  const g = new THREE.Group();

  g.position.set(x, y, z);
  g.rotation.y = rotY;

  parent.add(g);

  // Interior escuro
  box(
    g,
    mats.stoneVeryDark,
    1.15,
    2.0,
    0.12,
    0,
    0,
    0
  );

  // Moldura superior
  box(
    g,
    mats.stone2,
    1.55,
    0.22,
    0.24,
    0,
    1.12,
    0
  );

  // Moldura inferior
  box(
    g,
    mats.stone2,
    1.55,
    0.22,
    0.24,
    0,
    -1.12,
    0
  );

  // Moldura esquerda
  box(
    g,
    mats.stone2,
    0.22,
    2.45,
    0.24,
    -0.77,
    0,
    0
  );

  // Moldura direita
  box(
    g,
    mats.stone2,
    0.22,
    2.45,
    0.24,
    0.77,
    0,
    0
  );
}


// ================================================================
// AMEIAS RETAS
// ================================================================

function createCrenellationsLine(parent, mat, cfg) {

  const {
    axis,
    fixed,
    start,
    end,
    y,
    outward,
    thickness = 1.7,
    merlon = 2.15,
    gap = 1.6
  } = cfg;

  const step = merlon + gap;

  for (let p = start; p <= end; p += step) {

    if (axis === 'x') {

      box(
        parent,
        mat,
        merlon,
        2.2,
        thickness,
        p,
        y,
        fixed + outward
      );

    } else {

      box(
        parent,
        mat,
        thickness,
        2.2,
        merlon,
        fixed + outward,
        y,
        p
      );
    }
  }
}


// ================================================================
// AMEIAS CIRCULARES DAS TORRES
// ================================================================

function createTowerCrenellations(
  parent,
  mat,
  cx,
  cz,
  radius,
  y,
  count = 14
) {

  for (let i = 0; i < count; i++) {

    const a =
      i * Math.PI * 2 / count;

    const block = box(
      parent,
      mat,

      2.15,
      2.35,
      1.7,

      cx + Math.cos(a) * radius,
      y,
      cz + Math.sin(a) * radius
    );

    block.rotation.y = -a;
  }
}


// ================================================================
// TORRES CIRCULARES
// ================================================================

function createRoundTower(
  parent,
  mats,
  x,
  z,
  opts = {}
) {

  const r =
    opts.radius ?? 8.5;

  // Torres principais mais altas.
  const h =
    opts.height ?? 25;

  const group =
    new THREE.Group();

  group.name =
    opts.name ?? 'Torre circular';

  parent.add(group);


  // ------------------------------------------------
  // CORPO PRINCIPAL
  // ------------------------------------------------

  cylinder(
    group,
    mats.stone,
    r,
    h,
    x,
    h / 2,
    z,
    36
  );


  // ------------------------------------------------
  // FAIXAS HORIZONTAIS
  // ------------------------------------------------

  cylinder(
    group,
    mats.stoneDark,
    r + 0.18,
    0.5,
    x,
    6.0,
    z,
    36
  );

  cylinder(
    group,
    mats.stoneDark,
    r + 0.18,
    0.5,
    x,
    13.0,
    z,
    36
  );

  cylinder(
    group,
    mats.stoneDark,
    r + 0.18,
    0.5,
    x,
    19.5,
    z,
    36
  );


  // ------------------------------------------------
  // CORNIJA SUPERIOR
  // ------------------------------------------------

  cylinder(
    group,
    mats.stone2,
    r + 0.45,
    0.65,
    x,
    h - 1.0,
    z,
    36
  );


  // ------------------------------------------------
  // PLATAFORMA SUPERIOR
  // ------------------------------------------------

  cylinder(
    group,
    mats.stone2,
    r + 0.65,
    0.65,
    x,
    h - 0.25,
    z,
    36
  );


  // ------------------------------------------------
  // AMEIAS
  // ------------------------------------------------

  createTowerCrenellations(
    group,
    mats.stone2,
    x,
    z,
    r + 0.15,
    h + 1.15,
    14
  );


  // ------------------------------------------------
  // SETEIRAS
  // ------------------------------------------------

  const levels = [
    7.0,
    14.0,
    20.5
  ];

  for (const yy of levels) {

    // Frente
    addArrowSlit(
      group,
      mats,
      x,
      yy,
      z - r - 0.03,
      0,
      1
    );

    // Traseira
    addArrowSlit(
      group,
      mats,
      x,
      yy,
      z + r + 0.03,
      Math.PI,
      1
    );

    // Esquerda
    addArrowSlit(
      group,
      mats,
      x - r - 0.03,
      yy,
      z,
      Math.PI / 2,
      1
    );

    // Direita
    addArrowSlit(
      group,
      mats,
      x + r + 0.03,
      yy,
      z,
      -Math.PI / 2,
      1
    );
  }


  // ------------------------------------------------
  // CONTRAFORTES NA BASE
  // ------------------------------------------------

  for (let i = 0; i < 8; i++) {

    const a =
      i * Math.PI / 4;

    const bx =
      x +
      Math.cos(a) *
      (r + 0.3);

    const bz =
      z +
      Math.sin(a) *
      (r + 0.3);

    const buttress = box(
      group,
      mats.stoneDark,

      1.25,
      3.1,
      1.1,

      bx,
      1.55,
      bz
    );

    buttress.rotation.y = -a;
  }

  return group;
}


// ================================================================
// TORRES INTERMEDIÁRIAS
// ================================================================

function createSquareMidTower(
  parent,
  mats,
  x,
  z,
  rotation = 0,
  name = 'Torre intermediária'
) {

  const g =
    new THREE.Group();

  g.name = name;

  g.position.set(
    x,
    0,
    z
  );

  g.rotation.y =
    rotation;

  parent.add(g);


  // Corpo
  box(
    g,
    mats.stone,

    10.5,
    21,
    7.5,

    0,
    10.5,
    0
  );


  // Faixas
  addStoneBand(
    g,
    mats.stoneDark,
    0,
    5.0,
    -3.9,
    10.9,
    0.45
  );

  addStoneBand(
    g,
    mats.stoneDark,
    0,
    10.6,
    -3.9,
    10.9,
    0.45
  );

  addStoneBand(
    g,
    mats.stoneDark,
    0,
    16.0,
    -3.9,
    10.9,
    0.45
  );


  // Plataforma superior
  box(
    g,
    mats.stone2,

    11.2,
    0.65,
    8.2,

    0,
    20.7,
    0
  );


  // Ameias da frente
  createCrenellationsLine(
    g,
    mats.stone2,
    {
      axis: 'x',
      fixed: -3.65,
      start: -4.6,
      end: 4.6,
      y: 22.05,
      outward: 0,
      thickness: 1.3,
      merlon: 1.8,
      gap: 1.35
    }
  );


  // Ameias traseiras
  createCrenellationsLine(
    g,
    mats.stone2,
    {
      axis: 'x',
      fixed: 3.65,
      start: -4.6,
      end: 4.6,
      y: 22.05,
      outward: 0,
      thickness: 1.3,
      merlon: 1.8,
      gap: 1.35
    }
  );


  // Seteiras
  addArrowSlit(
    g,
    mats,
    -2.4,
    7.0,
    -3.82,
    0,
    0.9
  );

  addArrowSlit(
    g,
    mats,
    2.4,
    7.0,
    -3.82,
    0,
    0.9
  );

  addArrowSlit(
    g,
    mats,
    -2.4,
    13.5,
    -3.82,
    0,
    0.9
  );

  addArrowSlit(
    g,
    mats,
    2.4,
    13.5,
    -3.82,
    0,
    0.9
  );

  addArrowSlit(
    g,
    mats,
    0,
    18.0,
    -3.82,
    0,
    0.9
  );


  return g;
}


// ================================================================
// MURALHAS HORIZONTAIS
// ================================================================

function createCurtainWallX(
  parent,
  mats,
  z,
  x1,
  x2,
  gate = null
) {

  const h = 13.5;
  const t = 3.2;

  const length =
    x2 - x1;

  const center =
    (x1 + x2) / 2;


  // ------------------------------------------------
  // CORPO DA MURALHA
  // ------------------------------------------------

  if (!gate) {

    box(
      parent,
      mats.stone,

      length,
      h,
      t,

      center,
      h / 2,
      z
    );

  } else {

    // Lado esquerdo do portão
    const leftLen =
      gate.x -
      gate.width / 2 -
      x1;

    // Início do lado direito
    const rightStart =
      gate.x +
      gate.width / 2;

    const rightLen =
      x2 -
      rightStart;


    box(
      parent,
      mats.stone,

      leftLen,
      h,
      t,

      x1 + leftLen / 2,
      h / 2,
      z
    );


    box(
      parent,
      mats.stone,

      rightLen,
      h,
      t,

      rightStart +
      rightLen / 2,

      h / 2,
      z
    );


    // Parte acima do portão
    box(
      parent,
      mats.stone,

      gate.width,
      h - gate.height,
      t,

      gate.x,

      gate.height +
      (h - gate.height) / 2,

      z
    );
  }


  // ------------------------------------------------
  // FAIXAS HORIZONTAIS
  // ------------------------------------------------

  addStoneBand(
    parent,
    mats.stoneDark,
    center,
    4.5,
    z,
    length,
    t + 0.25
  );

  addStoneBand(
    parent,
    mats.stoneDark,
    center,
    9.0,
    z,
    length,
    t + 0.25
  );


  // ------------------------------------------------
  // CAMINHO SUPERIOR
  // ------------------------------------------------

  box(
    parent,
    mats.stone2,

    length + 0.7,
    0.55,
    t + 0.8,

    center,
    h + 0.22,
    z
  );


  // ------------------------------------------------
  // AMEIAS
  //
  // CORREÇÃO IMPORTANTE:
  // aqui usamos parent, e NÃO "g".
  // ------------------------------------------------

  createCrenellationsLine(
    parent,
    mats.stone2,
    {
      axis: 'x',
      fixed: z,
      start: x1 + 1.4,
      end: x2 - 1.4,
      y: h + 1.55,
      outward: -t / 2 + 0.8
    }
  );


  createCrenellationsLine(
    parent,
    mats.stone2,
    {
      axis: 'x',
      fixed: z,
      start: x1 + 1.4,
      end: x2 - 1.4,
      y: h + 1.55,
      outward: t / 2 - 0.8
    }
  );


  // ------------------------------------------------
  // SETEIRAS
  // ------------------------------------------------

  const outwardSign =
    z < 0 ? -1 : 1;

  for (
    let x = x1 + 7;
    x < x2 - 5;
    x += 11
  ) {

    if (
      gate &&
      Math.abs(x - gate.x) <
      gate.width
    ) {
      continue;
    }

    addArrowSlit(
      parent,
      mats,
      x,
      7.4,

      z +
      outwardSign *
      (t / 2 + 0.03),

      outwardSign < 0
        ? 0
        : Math.PI,

      0.8
    );
  }
}


// ================================================================
// MURALHAS VERTICAIS
// ================================================================

function createCurtainWallZ(
  parent,
  mats,
  x,
  z1,
  z2
) {

  const h = 13.5;
  const t = 3.2;

  const length =
    z2 - z1;

  const center =
    (z1 + z2) / 2;


  // Corpo
  box(
    parent,
    mats.stone,

    t,
    h,
    length,

    x,
    h / 2,
    center
  );


  // Faixas
  box(
    parent,
    mats.stoneDark,

    t + 0.25,
    0.45,
    length,

    x,
    4.5,
    center
  );

  box(
    parent,
    mats.stoneDark,

    t + 0.25,
    0.45,
    length,

    x,
    9.0,
    center
  );


  // Caminho superior
  box(
    parent,
    mats.stone2,

    t + 0.8,
    0.55,
    length + 0.7,

    x,
    h + 0.22,
    center
  );


  // Ameias
  createCrenellationsLine(
    parent,
    mats.stone2,
    {
      axis: 'z',
      fixed: x,
      start: z1 + 1.4,
      end: z2 - 1.4,
      y: h + 1.55,
      outward: -t / 2 + 0.8
    }
  );

  createCrenellationsLine(
    parent,
    mats.stone2,
    {
      axis: 'z',
      fixed: x,
      start: z1 + 1.4,
      end: z2 - 1.4,
      y: h + 1.55,
      outward: t / 2 - 0.8
    }
  );


  // Seteiras
  const outwardSign =
    x < 0 ? -1 : 1;

  for (
    let z = z1 + 7;
    z < z2 - 5;
    z += 11
  ) {

    addArrowSlit(
      parent,
      mats,

      x +
      outwardSign *
      (t / 2 + 0.03),

      7.4,
      z,

      outwardSign < 0
        ? Math.PI / 2
        : -Math.PI / 2,

      0.8
    );
  }
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

    openAngle = Math.PI / 2,

    triggerDistance = 8
  } = cfg;


  // ------------------------------------------------
  // PIVÔ
  // ------------------------------------------------

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

  parent.add(pivot);


  // ------------------------------------------------
  // POSIÇÃO DA FOLHA
  // ------------------------------------------------

  const direction =
    hinge === 'left'
      ? 1
      : -1;


  const panel = box(
    pivot,
    mats.wood,

    width,
    height,
    0.42,

    direction *
    width / 2,

    0,
    0
  );

  panel.name = name;


  // ------------------------------------------------
  // DETALHES DA FACE EXTERNA
  //
  // O exterior frontal do castelo está em -Z.
  // Por isso usamos valores negativos.
  // ------------------------------------------------

  for (
    const yy of [
      -height * 0.30,
      0,
      height * 0.30
    ]
  ) {

    box(
      panel,
      mats.woodDark,

      width * 0.92,
      0.22,
      0.10,

      0,
      yy,
      -0.26
    );
  }


  // Ferragem vertical
  box(
    panel,
    mats.iron,

    0.15,
    height * 0.82,
    0.08,

    -direction *
    width * 0.28,

    0,
    -0.28
  );


  // ------------------------------------------------
  // POSIÇÃO PARA DETECÇÃO DA PORTA
  // ------------------------------------------------

  const worldTrigger =
    new THREE.Vector3(
      x,
      y,
      z
    );


  return {

    name,

    pivot,
    panel,

    closedAngle: 0,

    openAngle:
      direction *
      openAngle,

    progress: 0,
    target: 0,

    triggerDistance,

    triggerPosition:
      worldTrigger,

    manualOpen: false
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

  const g =
    new THREE.Group();

  g.name =
    'Portaria principal';

  parent.add(g);


  // ==============================================================
  // DIMENSÕES DO PORTÃO
  // ==============================================================

  const openingW = 7.2;
  const openingH = 8.0;


  // ==============================================================
  // CORPO CENTRAL
  // ==============================================================

  // Gatehouse mais alto para acompanhar a nova escala das torres.
  box(
    g,
    mats.stoneDark,

    19,
    21.5,
    8.5,

    0,
    10.75,
    -43.0
  );


  // ==============================================================
  // PASSAGEM CENTRAL
  // ==============================================================

  // Bloco esquerdo
  box(
    g,
    mats.stone,

    5.3,
    openingH,
    9.2,

    -(openingW / 2 + 2.65),
    openingH / 2,
    -43.0
  );


  // Bloco direito
  box(
    g,
    mats.stone,

    5.3,
    openingH,
    9.2,

    +(openingW / 2 + 2.65),
    openingH / 2,
    -43.0
  );


  // Parte superior do portal
  box(
    g,
    mats.stone,

    openingW,
    13.5,
    9.2,

    0,
    openingH + 6.75,
    -43.0
  );


  // ==============================================================
  // TORRES FRONTAIS DO GATEHOUSE
  // ==============================================================

  createRoundTower(
    g,
    mats,
    -10.0,
    -43.8,
    {
      radius: 5.6,
      height: 23,
      name:
        'Torre do portão esquerda'
    }
  );


  createRoundTower(
    g,
    mats,
    10.0,
    -43.8,
    {
      radius: 5.6,
      height: 23,
      name:
        'Torre do portão direita'
    }
  );


  // ==============================================================
  // MOLDURA DO PORTAL
  // ==============================================================

  box(
    g,
    mats.stone2,

    openingW + 1.0,
    0.55,
    0.6,

    0,
    openingH + 0.2,
    -47.63
  );


  box(
    g,
    mats.stone2,

    0.55,
    openingH,
    0.6,

    -(openingW / 2 + 0.25),
    openingH / 2,
    -47.63
  );


  box(
    g,
    mats.stone2,

    0.55,
    openingH,
    0.6,

    +(openingW / 2 + 0.25),
    openingH / 2,
    -47.63
  );


  // ==============================================================
  // PORTCULLIS DECORATIVO
  // ==============================================================

  for (
    let x = -2.8;
    x <= 2.8;
    x += 1.4
  ) {

    box(
      g,
      mats.iron,

      0.12,
      4.2,
      0.12,

      x,
      14.0,
      -47.25
    );
  }


  for (
    let y = 12.3;
    y <= 15.7;
    y += 1.1
  ) {

    box(
      g,
      mats.iron,

      6.1,
      0.12,
      0.12,

      0,
      y,
      -47.25
    );
  }


  // ==============================================================
  // JANELAS SUPERIORES
  // ==============================================================

  addNarrowWindow(
    g,
    mats,
    -3.2,
    15.8,
    -47.32,
    0
  );

  addNarrowWindow(
    g,
    mats,
    3.2,
    15.8,
    -47.32,
    0
  );


  // ==============================================================
  // AMEIAS DO CORPO CENTRAL
  // ==============================================================

  createCrenellationsLine(
    g,
    mats.stone2,
    {
      axis: 'x',

      fixed: -46.5,

      start: -7.5,
      end: 7.5,

      y: 22.8,

      outward: 0,

      thickness: 1.6,
      merlon: 2.0,
      gap: 1.4
    }
  );


  // ==============================================================
  // PORTA PRINCIPAL
  // ==============================================================
  //
  // Cada pivô fica na lateral do vão.
  //
  // Isso evita o problema anterior em que as duas folhas
  // giravam pelo centro da passagem.
  // ==============================================================


  // ------------------------------------------------
  // FOLHA ESQUERDA
  // ------------------------------------------------

  const left =
    createDoor(
      g,
      mats,
      {

        x:
          -openingW / 2,

        y:
          4.0,

        z:
          -47.2,

        width:
          openingW / 2,

        height:
          7.7,

        hinge:
          'left',

        openAngle:
          Math.PI / 2,

        name:
          'Porta principal - folha esquerda',

        triggerDistance:
          10
      }
    );


  // ------------------------------------------------
  // FOLHA DIREITA
  // ------------------------------------------------

  const right =
    createDoor(
      g,
      mats,
      {

        x:
          openingW / 2,

        y:
          4.0,

        z:
          -47.2,

        width:
          openingW / 2,

        height:
          7.7,

        hinge:
          'right',

        openAngle:
          Math.PI / 2,

        name:
          'Porta principal - folha direita',

        triggerDistance:
          10
      }
    );


  // As duas folhas pertencem ao mesmo portão.
  left.groupId =
    'mainGate';

  right.groupId =
    'mainGate';


  doors.push(
    left,
    right
  );


  return g;
}


// ================================================================
// ESCADAS
// ================================================================

function createStoneStair(
  parent,
  mats,
  cfg
) {

  const {

    x,
    z,

    width = 4,

    length = 10,

    height = 7,

    steps = 14,

    axis = 'z',

    reverse = false

  } = cfg;


  const depth =
    length / steps;


  for (
    let i = 0;
    i < steps;
    i++
  ) {

    // ------------------------------------------------
    // CORREÇÃO DO SENTIDO DAS ESCADAS
    // ------------------------------------------------

    const index =
      reverse
        ? i + 1
        : steps - i;


    const h =
      height *
      index /
      steps;


    const offset =
      -length / 2 +
      depth *
      (i + 0.5);


    const sx =
      axis === 'x'
        ? x + offset
        : x;


    const sz =
      axis === 'z'
        ? z + offset
        : z;


    box(
      parent,
      mats.stone2,

      axis === 'z'
        ? width
        : depth,

      h,

      axis === 'z'
        ? depth
        : width,

      sx,

      h / 2,

      sz
    );
  }
}


// ================================================================
// CONSTRUÇÕES INTERNAS
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

    w,
    d,
    h,

    name,

    doorOn = 'south',

    stairSide = 'east'

  } = cfg;


  const g =
    new THREE.Group();

  g.name =
    name;

  parent.add(g);


  const t =
    1.15;

  const doorW =
    3.2;

  const doorH =
    4.4;


  const southZ =
    z - d / 2;

  const northZ =
    z + d / 2;


  // ==============================================================
  // PAREDE FRONTAL COM VÃO REAL
  // ==============================================================

  if (
    doorOn === 'south'
  ) {

    // Parte esquerda
    box(
      g,
      mats.stoneDark,

      (w - doorW) / 2,
      h,
      t,

      x -
      (w + doorW) / 4,

      h / 2,

      southZ
    );


    // Parte direita
    box(
      g,
      mats.stoneDark,

      (w - doorW) / 2,
      h,
      t,

      x +
      (w + doorW) / 4,

      h / 2,

      southZ
    );


    // Parte acima da porta
    box(
      g,
      mats.stoneDark,

      doorW,
      h - doorH,
      t,

      x,

      doorH +
      (h - doorH) / 2,

      southZ
    );

  } else {

    box(
      g,
      mats.stoneDark,

      w,
      h,
      t,

      x,
      h / 2,
      southZ
    );
  }


  // ==============================================================
  // PAREDE TRASEIRA
  // ==============================================================

  box(
    g,
    mats.stoneDark,

    w,
    h,
    t,

    x,
    h / 2,
    northZ
  );


  // ==============================================================
  // PAREDES LATERAIS
  // ==============================================================

  box(
    g,
    mats.stoneDark,

    t,
    h,
    d,

    x - w / 2,
    h / 2,
    z
  );


  box(
    g,
    mats.stoneDark,

    t,
    h,
    d,

    x + w / 2,
    h / 2,
    z
  );


  // ==============================================================
  // FAIXAS HORIZONTAIS
  // ==============================================================

  box(
    g,
    mats.stone2,

    w + 0.5,
    0.4,
    t + 0.3,

    x,
    3.3,
    southZ
  );


  box(
    g,
    mats.stone2,

    w + 0.5,
    0.4,
    t + 0.3,

    x,
    6.4,
    southZ
  );


  // ==============================================================
  // LAJE SUPERIOR
  // ==============================================================

  box(
    g,
    mats.stone2,

    w - 0.5,
    0.65,
    d - 0.5,

    x,
    h + 0.32,
    z
  );


  // ==============================================================
  // AMEIAS
  // ==============================================================

  createCrenellationsLine(
    g,
    mats.stone2,
    {

      axis: 'x',

      fixed:
        southZ,

      start:
        x -
        w / 2 +
        1.2,

      end:
        x +
        w / 2 -
        1.2,

      y:
        h + 1.55,

      outward:
        0.4,

      thickness:
        1.0,

      merlon:
        1.7,

      gap:
        1.3
    }
  );


  createCrenellationsLine(
    g,
    mats.stone2,
    {

      axis: 'x',

      fixed:
        northZ,

      start:
        x -
        w / 2 +
        1.2,

      end:
        x +
        w / 2 -
        1.2,

      y:
        h + 1.55,

      outward:
        -0.4,

      thickness:
        1.0,

      merlon:
        1.7,

      gap:
        1.3
    }
  );


  // ==============================================================
  // JANELAS
  // ==============================================================

  addNarrowWindow(
    g,
    mats,

    x -
    w * 0.25,

    h * 0.63,

    southZ -
    t / 2 -
    0.02,

    0
  );


  addNarrowWindow(
    g,
    mats,

    x +
    w * 0.25,

    h * 0.63,

    southZ -
    t / 2 -
    0.02,

    0
  );


  // ==============================================================
  // PORTA INTERNA
  //
  // CORREÇÃO:
  // x representa a DOBRADIÇA e não o centro da porta.
  // ==============================================================

  const doorZ =
    southZ -
    t / 2 -
    0.16;


  doors.push(

    createDoor(
      g,
      mats,
      {

        // Pivô na lateral esquerda do vão
        x:
          x -
          doorW / 2,

        y:
          doorH / 2,

        z:
          doorZ,

        width:
          doorW,

        height:
          doorH,

        hinge:
          'left',

        name:
          `${name} - porta`,

        triggerDistance:
          7
      }
    )
  );


  // ==============================================================
  // ESCADA EXTERNA
  // ==============================================================

  const stairX =
    stairSide === 'east'

      ? x +
        w / 2 +
        4.5

      : x -
        w / 2 -
        4.5;


  createStoneStair(
    g,
    mats,
    {

      x:
        stairX,

      z,

      width:
        3.8,

      length:
        9,

      height:
        h + 0.65,

      steps:
        14,

      axis:
        'x',

      reverse:
        stairSide === 'west'
    }
  );


  return g;
}


// ================================================================
// DETALHES DO PÁTIO
// ================================================================

function createCourtyardDetails(
  parent,
  mats
) {

  // ==============================================================
  // POÇO
  // ==============================================================

  cylinder(
    parent,
    mats.stoneDark,

    4.2,
    1.45,

    0,
    0.72,
    5,

    28
  );


  cylinder(
    parent,
    mats.stoneVeryDark,

    3.3,
    0.5,

    0,
    1.55,
    5,

    28
  );


  // Suporte esquerdo
  box(
    parent,
    mats.woodDark,

    0.45,
    5.4,
    0.45,

    -3.2,
    3.7,
    5
  );


  // Suporte direito
  box(
    parent,
    mats.woodDark,

    0.45,
    5.4,
    0.45,

    3.2,
    3.7,
    5
  );


  // Viga superior
  box(
    parent,
    mats.woodDark,

    7.0,
    0.42,
    0.42,

    0,
    6.0,
    5
  );


  // Eixo
  const wellAxle =
    cylinder(
      parent,
      mats.wood,

      0.28,
      5.8,

      0,
      5.25,
      5,

      16
    );

  wellAxle.rotation.z =
    Math.PI / 2;


  // ==============================================================
  // BARRIS
  // ==============================================================

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const barrel =
      cylinder(
        parent,
        mats.wood,

        1.0,
        2.2,

        -26 +
        i * 2.3,

        1.0,
        22,

        18
      );

    barrel.rotation.z =
      Math.PI / 2;
  }
}


// ================================================================
// CRIAÇÃO DO CASTELO
// ================================================================

export function createCastle(scene) {

  const root =
    new THREE.Group();

  root.name =
    'Castelo de Bodiam - Modelagem';

  scene.add(root);


  const mats =
    createMaterials();

  const doors = [];


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
  // DIMENSÃO PRINCIPAL
  // ==============================================================

  const HALF = 42;


  // ==============================================================
  // MURALHAS
  //
  // Frente = -Z
  // ==============================================================


  // Frente
  createCurtainWallX(
    root,
    mats,

    -HALF,

    -34,
    34,

    {
      x: 0,
      width: 8,
      height: 8
    }
  );


  // Fundo
  createCurtainWallX(
    root,
    mats,

    HALF,

    -34,
    34
  );


  // Esquerda
  createCurtainWallZ(
    root,
    mats,

    -HALF,

    -34,
    34
  );


  // Direita
  createCurtainWallZ(
    root,
    mats,

    HALF,

    -34,
    34
  );


  // ==============================================================
  // QUATRO GRANDES TORRES DE CANTO
  // ==============================================================

  createRoundTower(
    root,
    mats,

    -HALF,
    -HALF,

    {
      height: 25,
      name:
        'Torre sudoeste'
    }
  );


  createRoundTower(
    root,
    mats,

    HALF,
    -HALF,

    {
      height: 25,
      name:
        'Torre sudeste'
    }
  );


  createRoundTower(
    root,
    mats,

    -HALF,
    HALF,

    {
      height: 25,
      name:
        'Torre noroeste'
    }
  );


  createRoundTower(
    root,
    mats,

    HALF,
    HALF,

    {
      height: 25,
      name:
        'Torre nordeste'
    }
  );


  // ==============================================================
  // TORRES INTERMEDIÁRIAS
  // ==============================================================

  createSquareMidTower(
    root,
    mats,

    -HALF,
    0,

    Math.PI / 2,

    'Torre lateral oeste'
  );


  createSquareMidTower(
    root,
    mats,

    HALF,
    0,

    -Math.PI / 2,

    'Torre lateral leste'
  );


  createSquareMidTower(
    root,
    mats,

    0,
    HALF,

    Math.PI,

    'Torre traseira'
  );


  // ==============================================================
  // PORTARIA PRINCIPAL
  // ==============================================================

  createGatehouse(
    root,
    mats,
    doors
  );


  // ==============================================================
  // CONSTRUÇÃO INTERNA OESTE
  // ==============================================================

  createInternalBuilding(
    root,
    mats,
    doors,
    {

      x:
        -20,

      z:
        11,

      w:
        23,

      d:
        17,

      h:
        9.5,

      name:
        'Construção interna oeste',

      stairSide:
        'east'
    }
  );


  // ==============================================================
  // CONSTRUÇÃO INTERNA LESTE
  // ==============================================================

  createInternalBuilding(
    root,
    mats,
    doors,
    {

      x:
        20,

      z:
        15,

      w:
        21,

      d:
        19,

      h:
        10.5,

      name:
        'Construção interna leste',

      stairSide:
        'west'
    }
  );


  // ==============================================================
  // ESCADA DE ACESSO À MURALHA
  // ==============================================================

  createStoneStair(
    root,
    mats,
    {

      x:
        29,

      z:
        -26,

      width:
        4.5,

      length:
        17,

      height:
        13.8,

      steps:
        20,

      axis:
        'z'
    }
  );


  // ==============================================================
  // PLATAFORMA DA ESCADA
  // ==============================================================

  box(
    root,
    mats.stone2,

    6.5,
    0.6,
    7.5,

    29,
    13.6,
    -34.5
  );


  // ==============================================================
  // DETALHES DO PÁTIO
  // ==============================================================

  createCourtyardDetails(
    root,
    mats
  );


  // ==============================================================
  // LAJES DO PÁTIO
  // ==============================================================

  for (
    let x = -12;
    x <= 12;
    x += 6
  ) {

    for (
      let z = -12;
      z <= 12;
      z += 6
    ) {

      box(
        root,
        mats.stone2,

        4.2,
        0.12,
        4.2,

        x,
        0.06,
        z
      );
    }
  }


  // ==============================================================
  // RETORNO
  // ==============================================================

  return {
    root,
    doors,
    materials: mats
  };
}