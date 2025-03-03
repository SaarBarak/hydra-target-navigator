Below is a sample README.md for your hydra-target-goto extension:

---

# hydra-target-goto

Hydra-target-goto is a VS Code extension that enhances your workflow when working with Hydra configuration files and Python modules. It allows you to quickly jump to the definition of Hydra targets in YAML files and also provides a command to copy Python targets as Hydra configuration snippets.

## Features

- **Go-to Definition:**  
  Jump directly from a Hydra target (e.g. `_target_: src.models.isar.IsarClassifier`) in a YAML file to the corresponding Python source code.

- **Hover Documentation:**  
  View docstrings and documentation previews when hovering over Hydra target references.

- **Copy Target as Hydra:**  
  Right-click on a Python class or function and select "Copy Target as Hydra" to generate a Hydra configuration snippet with a fully-qualified target and a list of parameters extracted from the target’s signature.

## Requirements

- VS Code version 1.97.0 or higher.
- The extension expects Python projects organized with standard module structures.
- Ensure that the Python files contain proper class/function definitions with signatures (ideally with type annotations) for accurate parameter extraction.

## Extension Settings

This extension does not currently contribute any custom settings. However, future releases might include configuration options to customize behavior.

## Known Issues

- The signature extractor may not detect complex signatures or unconventional formatting.
- Hover documentation relies on the presence of triple-quoted docstrings directly after the symbol definition.
- If the workspace structure is non-standard, the target resolution may fail.

## Release Notes

### 1.0.0

- Initial release with go-to definition for Hydra targets in YAML files and hover documentation.

### 1.1.0

- Added "Copy Target as Hydra" command to generate Hydra configuration snippets from Python targets.
- Improved signature extraction for annotated parameters.

---

## Following Extension Guidelines

Be sure to check out the [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) for best practices when building VS Code extensions.

## Working with Markdown

Use Visual Studio Code's Markdown editor for editing this README. Here are some useful shortcuts:
- **Split Editor:** `Cmd+\` on macOS or `Ctrl+\` on Windows/Linux.
- **Toggle Preview:** `Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows/Linux.
- **Markdown Snippets:** Press `Ctrl+Space` to see a list of Markdown snippets.

## For More Information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy using hydra-target-goto!**

---

Feel free to adjust this README to fit any additional details or updates you make to your extension.Below is a sample README.md for your hydra-target-goto extension:

---

# hydra-target-goto

Hydra-target-goto is a VS Code extension that enhances your workflow when working with Hydra configuration files and Python modules. It allows you to quickly jump to the definition of Hydra targets in YAML files and also provides a command to copy Python targets as Hydra configuration snippets.

## Features

- **Go-to Definition:**  
  Jump directly from a Hydra target (e.g. `_target_: src.models.isar.IsarClassifier`) in a YAML file to the corresponding Python source code.

- **Hover Documentation:**  
  View docstrings and documentation previews when hovering over Hydra target references.

- **Copy Target as Hydra:**  
  Right-click on a Python class or function and select "Copy Target as Hydra" to generate a Hydra configuration snippet with a fully-qualified target and a list of parameters extracted from the target’s signature.


## Requirements

- VS Code version 1.97.0 or higher.
- The extension expects Python projects organized with standard module structures.
- Ensure that the Python files contain proper class/function definitions with signatures (ideally with type annotations) for accurate parameter extraction.

## Extension Settings

This extension does not currently contribute any custom settings. However, future releases might include configuration options to customize behavior.

## Known Issues

- The signature extractor may not detect complex signatures or unconventional formatting.
- Hover documentation relies on the presence of triple-quoted docstrings directly after the symbol definition.
- If the workspace structure is non-standard, the target resolution may fail.

## Release Notes

### 1.0.0

- Initial release with go-to definition for Hydra targets in YAML files and hover documentation.

### 1.1.0

- Added "Copy Target as Hydra" command to generate Hydra configuration snippets from Python targets.
- Improved signature extraction for annotated parameters.

---

## Following Extension Guidelines

Be sure to check out the [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) for best practices when building VS Code extensions.

## Working with Markdown

Use Visual Studio Code's Markdown editor for editing this README. Here are some useful shortcuts:
- **Split Editor:** `Cmd+\` on macOS or `Ctrl+\` on Windows/Linux.
- **Toggle Preview:** `Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows/Linux.
- **Markdown Snippets:** Press `Ctrl+Space` to see a list of Markdown snippets.

## For More Information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy using hydra-target-goto!**

---

Feel free to adjust this README to fit any additional details or updates you make to your extension.