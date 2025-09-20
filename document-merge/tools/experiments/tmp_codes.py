import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
span_block = text[text.index('<span className="block max-h-20'):text.index('<span className="block max-h-20')+120]
print([ord(ch) for ch in span_block])