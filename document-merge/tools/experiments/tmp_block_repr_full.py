import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('                            <span className="block whitespace-pre-wrap break-words">')
end = text.find('</span>', start)
end = text.find('</span>', end + len('</span>'))
end = text.find('</span>', end + len('</span>'))
block = text[start:end + len('</span>')]
print(repr(block))