import * as THREE from 'three';

// Atualiza somente a animação das portas.
// Não depende de sistema de player ou colisão.
export function updateDoors(doors, cameraPosition) {
  for (const door of doors) {
    const alpha = 0.05;
    const distance = door.triggerPosition.distanceTo(cameraPosition);
    const nearCamera = distance <= door.triggerDistance;
    door.target = (nearCamera || door.manualOpen) ? 1 : 0;

    // Interpolação exponencial suave e independente do FPS.
    door.progress = THREE.MathUtils.lerp(door.progress, door.target, alpha);
    door.pivot.rotation.y = THREE.MathUtils.lerp(
      door.closedAngle,
      door.openAngle,
      door.progress
    );
  }
}

// Permite clicar numa folha e alternar manualmente a porta.
// Útil para demonstrar a animação durante a apresentação.
export function toggleDoorByObject(doors, object) {
  for (const door of doors) {
    if (object === door.panel || object.parent === door.panel) {
      if (door.groupId) {
        const sameGate = doors.filter(d => d.groupId === door.groupId);
        const value = !sameGate.some(d => d.manualOpen);
        sameGate.forEach(d => d.manualOpen = value);
      } else {
        door.manualOpen = !door.manualOpen;
      }
      return true;
    }
  }
  return false;
}
