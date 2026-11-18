const PREVENT_DEFAULT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, buttons: new Set(), moved: false };
  const positionFromEvent = (event) => {
    const bounds = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    mouse.y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    mouse.moved = true;
  };
  const onKeyDown = (event) => {
    if (!held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
    if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
  };
  const onKeyUp = (event) => held.delete(event.code);
  const onBlur = () => { held.clear(); mouse.buttons.clear(); };
  const onPointerMove = (event) => positionFromEvent(event);
  const onPointerDown = (event) => { positionFromEvent(event); mouse.buttons.add(event.button); canvas.setPointerCapture?.(event.pointerId); };
  const onPointerUp = (event) => { positionFromEvent(event); mouse.buttons.delete(event.button); };
  const onContextMenu = (event) => event.preventDefault();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', onContextMenu);

  return {
    reset: () => { held.clear(); pressed.clear(); mouse.buttons.clear(); },
    isDown: (code) => held.has(code),
    wasPressed: (code) => pressed.has(code),
    anyPressed: (...codes) => codes.some((code) => pressed.has(code)),
    mousePosition: () => mouse,
    mouseDown: (button = 0) => mouse.buttons.has(button),
    endFrame: () => { pressed.clear(); mouse.moved = false; },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    },
  };
}
