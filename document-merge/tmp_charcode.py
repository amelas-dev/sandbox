import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
char = text[text.index('text || <span className="text-slate-400">') + len('text || <span className="text-slate-400">')]
print(ord(char))