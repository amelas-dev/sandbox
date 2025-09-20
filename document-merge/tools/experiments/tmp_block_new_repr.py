import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('\n                          {text ? (\n')
end = text.index('\n                          )}', start) + len('\n                          )}')
block = text[start:end]
print(repr(block))