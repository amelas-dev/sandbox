import pathlib
text = pathlib.Path('src/components/importer/DatasetImportDialog.tsx').read_text()
span_block = """
                            <span className="block max-h-20 overflow-auto whitespace-pre-wrap break-words">
                              {text || <span className="text-slate-400">—</span>}
                            </span>
""".strip("\n")
print(text.find(span_block))