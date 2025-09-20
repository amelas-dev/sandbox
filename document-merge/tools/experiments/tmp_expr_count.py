import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
expr = '{text || <span className="text-slate-400">—</span>}'
print(len(expr))
print(expr.encode('utf-8'))
print(text.count(expr))