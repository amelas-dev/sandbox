import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('<ScrollArea className="max-h-64">')
segment = text[start:start+200]
print(repr(segment))