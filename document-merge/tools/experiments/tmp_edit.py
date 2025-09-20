# -*- coding: utf-8 -*-
import pathlib

path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text()

old_import = "import { ScrollArea } from '@/components/ui/scroll-area';"
new_import = "import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';"
if old_import not in text:
    raise SystemExit('Import statement not found')
text = text.replace(old_import, new_import, 1)

old_table_open = "            <ScrollArea className=\"max-h-64\">\n              <table className=\"w-full border-collapse text-left text-xs\">"
new_table_open = "            <ScrollArea className=\"max-h-64\">\n              <div className=\"min-w-max\">\n                <table className=\"w-full border-collapse text-left text-xs\">"
if old_table_open not in text:
    raise SystemExit('Table open block not found')
text = text.replace(old_table_open, new_table_open, 1)

old_table_close = "                </tbody>\n              </table>\n            </ScrollArea>"
new_table_close = "                </tbody>\n              </table>\n              </div>\n              <ScrollBar orientation=\"horizontal\" />\n            </ScrollArea>"
if old_table_close not in text:
    raise SystemExit('Table close block not found')
text = text.replace(old_table_close, new_table_close, 1)

old_class = "block max-h-20 overflow-auto whitespace-pre-wrap break-words"
if old_class not in text:
    raise SystemExit('Old cell class not found')
text = text.replace(old_class, "block whitespace-pre-wrap break-words", 1)

start_expr = text.index('{text || <span className="text-slate-400">')
end_expr = text.index('}', start_expr) + 1
old_expression = text[start_expr:end_expr]
new_expression = "{text ? (\n                              <span className=\"block whitespace-pre-wrap break-words\">{text}</span>\n                            ) : (\n                              <span className=\"text-slate-400\">—</span>\n                            )}"
text = text.replace(old_expression, new_expression, 1)

path.write_text(text)