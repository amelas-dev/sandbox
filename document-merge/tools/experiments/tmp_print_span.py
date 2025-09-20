import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('                            <span className="block')
print(repr(text[start:start+250]))