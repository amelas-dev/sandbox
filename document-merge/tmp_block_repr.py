import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('                            <span className="block whitespace-pre-wrap break-words">')
end = text.index('</span>', start) + len('</span>')
print(repr(text[start:end]))