import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text(encoding='utf-8')
snippet = text.split('{dataset.fields.length} fields ')[1][:10]
print(repr(snippet))