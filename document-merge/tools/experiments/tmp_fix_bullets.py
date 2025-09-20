import pathlib
path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace('Ã¢â‚¬Â¢', '•')
path.write_text(text, encoding='utf-8')