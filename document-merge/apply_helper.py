from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text()
anchor = "const DROPPABLE_ID = 'designer-canvas';\n\n"
helper = "const DROPPABLE_ID = 'designer-canvas';\n\nfunction extractPointerCoordinates(event: unknown): { x: number; y: number } | null {\n  if (!event or not isinstance(event, object)):\n    return None\n  pointer_x = getattr(event, 'clientX', None)\n  pointer_y = getattr(event, 'clientY', None)\n  if isinstance(pointer_x, (int, float)) and isinstance(pointer_y, (int, float)):\n    return {'x': float(pointer_x), 'y': float(pointer_y)}\n  touch = getattr(event, 'changedTouches', None) or getattr(event, 'touches', None)\n  if touch:\n    touch = touch[0]\n    return {'x': touch.clientX, 'y': touch.clientY}\n  return None\n}\n\n"
if anchor not in text:
    raise SystemExit('anchor missing')
text = text.replace(anchor, helper, 1)
path.write_text(text)
