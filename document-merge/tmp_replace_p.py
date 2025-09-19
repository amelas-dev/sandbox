import pathlib
path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text(encoding='utf-8')
start = text.index('                <p>\n')
end = text.index('                </p>', start) + len('                </p>')
new_block = "                <p>\n                  {dataset.fields.length} fields \u2022 {dataset.rows.length} rows\n                  {dataset.sourceMeta?.name ? ` \u2022 ${dataset.sourceMeta.name}` : ''}\n                  {dataset.sourceMeta?.size ? ` \u2022 ${formatFileSize(dataset.sourceMeta.size)}` : ''}\n                </p>"
text = text[:start] + new_block + text[end:]
path.write_text(text, encoding='utf-8')