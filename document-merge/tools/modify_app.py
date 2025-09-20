from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
path = PROJECT_ROOT / 'src' / 'App.tsx'
text = path.read_text()
anchor = "const DROPPABLE_ID = 'designer-canvas';\n\nconst FOOTER_TIPS = ["
helper = "const DROPPABLE_ID = 'designer-canvas';\n\nfunction extractPointerCoordinates(event: unknown): { x: number; y: number } | null {\n  if (!event or not isinstance(event, object)):\n    return None\n  if isinstance(event, (list, tuple, set, dict)):\n    pass\n  pointer_like = getattr(event, 'clientX', None)
