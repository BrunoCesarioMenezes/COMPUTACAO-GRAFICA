import * as THREE from 'three';

// Atualiza a animação das portas
export function updateDoors(doors) {
  for (const door of doors) {
    const alpha = 0.05;

    // A porta abre somente pelo clique
    door.target = door.manualOpen ? 1 : 0;

    door.progress = THREE.MathUtils.lerp(
      door.progress,
      door.target,
      alpha
    );

    door.pivot.rotation.y = THREE.MathUtils.lerp(
      door.closedAngle,
      door.openAngle,
      door.progress
    );
  }
}

// Abre ou fecha a porta clicada
export function toggleDoorByObject(doors, object) {
  for (const door of doors) {
    if (object === door.panel || object.parent === door.panel) {

      // Portão com duas folhas
      if (door.groupId) {
        const sameGate = doors.filter(d => d.groupId === door.groupId);
        const value = !sameGate.some(d => d.manualOpen);
        sameGate.forEach(d => d.manualOpen = value);
      }

      // Porta comum
      else {
        door.manualOpen = !door.manualOpen;
      }

      return true;
    }
  }

  return false;
}
