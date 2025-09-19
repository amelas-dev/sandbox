# -*- coding: utf-8 -*-
import pathlib

path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text()

start = text.index('                            <span className="block whitespace-pre-wrap break-words">')
end = start
for _ in range(3):
    end = text.find('</span>', end + 1)
if end == -1:
    raise SystemExit('Failed to locate closing span block')
block_end = end + len('</span>')
new_block = "                          {text ? (\n                            <span className=\"block whitespace-pre-wrap break-words\">{text}</span>\n                          ) : (\n                            <span className=\"text-slate-400\">—</span>\n                          )}"
text = text[:start] + new_block + text[block_end:]

path.write_text(text)