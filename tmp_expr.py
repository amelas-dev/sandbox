import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('{text || <span className="text-slate-400">')
expr = text[start:text.index('}', start)+1]
print(repr(expr))