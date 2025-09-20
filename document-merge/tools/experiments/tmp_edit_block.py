# -*- coding: utf-8 -*-
import pathlib

path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text()

old_block = "                            <span className=\"block whitespace-pre-wrap break-words\">\n                              {text ? (\n                              <span className=\"block whitespace-pre-wrap break-words\">{text}</span>\n                            ) : (\n                              <span className=\"text-slate-400\">-</span>\n                            )}\n                            </span>"
new_block = "                          {text ? (\n                            <span className=\"block whitespace-pre-wrap break-words\">{text}</span>\n                          ) : (\n                            <span className=\"text-slate-400\">—</span>\n                          )}"
if old_block not in text:
    raise SystemExit('Old block not found')
text = text.replace(old_block, new_block, 1)

path.write_text(text)