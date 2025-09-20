import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('{text || <span className="text-slate-400">')
end = text.index('}', start) + 1
expr = text[start:end]
print(expr)
for ch in expr:
    print(ord(ch))