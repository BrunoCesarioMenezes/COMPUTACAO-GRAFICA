import * as THREE from 'three';
const doorWorldPosition = new THREE.Vector3();
// Atualiza a animação das portas
export function updateDoors(doors, camera, isOrbitMode) {
    for (const door of doors) {
        if (isOrbitMode) {
            door.target = door.manualOpen ? 1 : 0;
        } else {
            door.pivot.getWorldPosition(doorWorldPosition);
            const distance = camera.position.distanceTo(doorWorldPosition);
            door.target = distance <= door.triggerDistance ? 1 : 0;
        }

        door.progress = THREE.MathUtils.lerp(door.progress, door.target, 0.05);
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
      else {
        door.manualOpen = !door.manualOpen;
      }

      return true;
    }
  }

  return false;
}
