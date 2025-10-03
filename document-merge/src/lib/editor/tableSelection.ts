import type { Editor } from '@tiptap/react';
import { CellSelection, TableMap, findTable, selectionCell } from '@tiptap/pm/tables';
import type { Rect } from '@tiptap/pm/tables';

export type TableSelectionScope = 'table' | 'row' | 'column' | 'cell';

function resolveTargetRect(scope: TableSelectionScope, base: Rect, map: TableMap): Rect {
  switch (scope) {
    case 'table':
      return { left: 0, right: map.width, top: 0, bottom: map.height };
    case 'row':
      return { left: 0, right: map.width, top: base.top, bottom: base.bottom };
    case 'column':
      return { left: base.left, right: base.right, top: 0, bottom: map.height };
    case 'cell':
    default:
      return base;
  }
}

export function applyTableSelection(editor: Editor, scope: TableSelectionScope): boolean {
  return editor
    .chain()
    .focus()
    .command(({ state, dispatch, tr }) => {
      const table = findTable(state.selection.$from);
      if (!table) {
        return false;
      }

      const map = TableMap.get(table.node);
      const $cell = selectionCell(state);
      if (!$cell) {
        return false;
      }

      const cellPos = $cell.pos - table.start;
      const baseRect = map.findCell(cellPos);
      const targetRect = resolveTargetRect(scope, baseRect, map);

      const anchor = table.start + map.positionAt(targetRect.top, targetRect.left, table.node);
      const head = table.start + map.positionAt(targetRect.bottom - 1, targetRect.right - 1, table.node);

      if (dispatch) {
        const selection = CellSelection.create(tr.doc, anchor, head);
        tr.setSelection(selection).scrollIntoView();
      }

      return true;
    })
    .run();
}
