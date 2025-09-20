import pathlib
path = pathlib.Path('src/components/importer/DatasetImportDialog.tsx')
text = path.read_text()
text = text.replace('<span className="text-slate-400">�</span>', '<span className="text-slate-400">—</span>')
text = text.replace('                <table className="w-full border-collapse text-left text-xs">\n                <thead', '                <table className="w-full border-collapse text-left text-xs">\n                  <thead')
text = text.replace('\n                </tbody>', '\n                  </tbody>')
text = text.replace('\n              </table>\n              </div>', '\n                </table>\n              </div>')
path.write_text(text, encoding='utf-8')