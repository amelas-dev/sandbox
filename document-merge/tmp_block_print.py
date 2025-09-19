import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('                            <span className="block whitespace-pre-wrap break-words">')
end = text.index('</span>', start)
# find next closing after that
end = text.index('</span>', end + len('</span>'))
block = text[start:end + len('</span>')]
print(block)