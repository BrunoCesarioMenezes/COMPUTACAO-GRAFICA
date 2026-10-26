// ================================================================
// HUD - mensagens rápidas na tela
//
// Usado pelos módulos de chaves, portal e inimigos para avisar o
// jogador de eventos (chave coletada, portal aberto etc.).
// ================================================================

let toastElement = null;
let hideTimer = null;

function getToastElement() {
  if (toastElement) return toastElement;

  toastElement = document.createElement('div');

  Object.assign(toastElement.style, {
    position: 'fixed',
    top: '22%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 22px',
    background: 'rgba(15, 15, 18, 0.82)',
    color: '#ffe9a8',
    fontFamily: 'Arial, sans-serif',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 210, 110, 0.35)',
    zIndex: '1001',
    userSelect: 'none',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.25s'
  });

  document.body.appendChild(toastElement);
  return toastElement;
}

export function showMessage(text, duration = 1.8) {
  const el = getToastElement();

  el.textContent = text;
  el.style.opacity = '1';

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { el.style.opacity = '0'; }, duration * 1000);
}
