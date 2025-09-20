import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('                          <td')
segment = text[start:start+350]
print(repr(segment))