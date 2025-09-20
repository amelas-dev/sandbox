from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
path = PROJECT_ROOT / 'src' / 'App.tsx'
lines = path.read_text().splitlines()

start = next(i for i, line in enumerate(lines) if line.strip().startswith('const handleDragStart'))
end = next(i for i, line in enumerate(lines[start:], start) if line.strip().startswith('const handleInsertField'))

new_lines = [
  "  const handleDragStart = React.useCallback(",
  "    (event: DragStartEvent) => {",
  "      const fieldKey = event.active.data.current?.fieldKey as string | undefined;",
  "      if (!fieldKey) return;",
  "      const label = fieldLookup.get(fieldKey) ?? fieldKey;",
  "      setDraggedField({ key: fieldKey, label });",
  "    },",
  "    [fieldLookup],",
  "  );",
  "",
  "  const handleDragEnd = React.useCallback(",
  "    (event: DragEndEvent) => {",
  "      const fieldKey = event.active.data.current?.fieldKey as string | undefined;",
  "      if (fieldKey && event.over?.id === DROPPABLE_ID) {",
  "        const pointerPosition = (() => {",
  "          const activatorEvent = event.activatorEvent;",
  "          if (!activatorEvent) return null;",
  "          const pointerEvent = activatorEvent as Partial[PointerEvent];",
  "          if (typeof pointerEvent.clientX == 'number' and typeof pointerEvent.clientY == 'number'):",
  "            return {",
  "              'x': pointerEvent.clientX + event.delta.x,",
  "              'y': pointerEvent.clientY + event.delta.y,",
  "            }",
  "          touchEvent = activatorEvent if hasattr(activatorEvent, 'changedTouches') else None",
  "          if touchEvent:",
  "            touch = touchEvent.changedTouches[0]
            return {
              'x': touch.clientX + event.delta.x,
              'y': touch.clientY + event.delta.y,
            }
          return None
        })()

        if pointerPosition:
          insertMergeTag(fieldKey, pointerPosition)
        else:
          active_rect = event.active.rect.current
          rect = active_rect.translated if active_rect.translated else active_rect.initial
          if rect:
            insertMergeTag(fieldKey, {'x': rect.left + rect.width / 2, 'y': rect.top + rect.height / 2})
          else:
            insertMergeTag(fieldKey)
      setDraggedField(None)
    },
    [insertMergeTag],
  );

  const handleDragCancel = React.useCallback(() => {
    setDraggedField(null);
  }, []);
'''
lines[start:end] = block.split('\n')
path.write_text('\n'.join(lines))
