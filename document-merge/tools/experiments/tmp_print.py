import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
marker = '<ScrollArea className="max-h-64">'
idx = text.index(marker)
snippet = text[idx:idx+200]
print(repr(snippet))