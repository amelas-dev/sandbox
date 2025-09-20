import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
start = text.index('{dataset.fields.length} fields')
end = text.index('            </div>', start)
print(text[start:end])