import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('<span className="text-slate-400">')
segment = text[start:start+60]
print(repr(segment))