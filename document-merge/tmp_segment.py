import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('\n                          )}') + len('\n                          )}')
segment = text[start:start+40]
print(repr(segment))