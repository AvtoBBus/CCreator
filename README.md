# 🧩 CCreator

**A file and directory structure generator based on text descriptions** for Visual Studio Code.

![version](https://img.shields.io/badge/version-1.2.0-blue)

---

## 📖 About

This extension allows you to quickly generate a folder and file hierarchy from a simple text string.  
Just describe your project structure, and the tool will create it right inside your workspace.

Great for:
- Fast prototyping
- Component template generation
- Creating initial project structures (React, Vue, Svelte, Angular, Node.js, etc.)

---

## 🚀 Features

- **Target Folder Selection** – Interactive navigation through existing folders with an option to create and name a new folder.
- **Framework Support** – Out-of-the-box templates for Svelte, React, Vue, and Angular.
- **Flexible Component Configuration**:
  - Script language selection (`ts` / `js`)
  - Style preprocessor selection (`scss` / `less` / `css`)
  - Component type selection for React (`class` / `function`)
- **Boilerplate Generation** – Files are generated with predefined boilerplate code tailored to your selected framework rather than being empty.
- **Compact Syntax** – Describe nested folders and multiple files in a concise text format.
- **Instant Creation** – All directories and files are recursively created in under a second.
- **Auto-Updates** – The extension checks for new releases on GitHub. When a new version is detected, the `.vsix` file is automatically downloaded and opened via the built-in VS Code API, prompting you to confirm and complete the installation manually.

---

## 🧭 Structure Description Format

The structure string consists of **elements** separated by colons `:`.

- **Folders** are wrapped in angle brackets `<...>`.
- Inside a folder, specify the **name**, then a vertical bar `|`, followed by its contents (files and nested subfolders).
- **Files** are written as plain names without special wrapping characters.
- Nesting is arbitrary – you can create as many levels as needed.

### Examples
1. Creates a folder named `src` containing two files: `index.js` and `style.css`.
   ```
   <src|index.js:style.css>
   ```
2. Creates a `components` folder with two Svelte files, and a `utils` folder with a `helpers.js` file.
   ```
   <components|Header.svelte:Footer.svelte>:<utils|helpers.js>
   ```
   Alternatively, you can write:
   ```
   <components|[Header,Footer].svelte>:<utils|helpers.js>
   ```
The result will be exactly the same.

3. Creates a `project` folder, with a nested `src` folder (containing `main.js`) and a `tests` folder (containing `test.js`).
   ```
   <project|<src|main.js>:<tests|test.js>>
   ```

> 💡 If you omit a file extension, it will be appended automatically based on your selected framework and settings.

---

## 🔧 How to Use

1. **Open the Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`).

### Choose from available commands:

#### Create File and Folder Structure for Component
2. Run the command:  
`Create File and Folder Structure for Component`
3. **Select or create a folder** where the structure should be generated.
- If subfolders exist in the current directory, they will be listed for selection.
- If no subfolders exist, you will be prompted to enter a new folder name.
- You can press `Enter` without making a selection to generate the structure directly in the root workspace.
4. **Select a saved preset or one from your recent history** to bypass configuring settings from scratch.
5. **Select a framework**: Svelte, React, Vue, or Angular.
6. **Configure the component** options based on your framework:
- For Svelte/Vue: select the script language (`ts` / `js`) and styles (`scss` / `less` / `css`).
- For React: select the component type (`class` / `function`) and script language.
- For Angular: no additional configuration is required.
7. **Enter the structure string** (using the format described above).
8. Press `Enter` – your structure will be generated instantly, complete with boilerplate code!

#### Edit User Templates
2. Run the command:  
`Edit User Templates`
3. **Select or create a folder**, then add a template following these guidelines:
- Specify a template name.
- Enter the target structure string.
- Map boilerplate content to files using this flexible system:
   * Use a specific filename (e.g., `Comp.svelte`) to apply content exclusively to that file.
   * Use an extension mask (e.g., `*.ts`) to apply boilerplate to all `.ts` files (unless overridden by a specific filename rule).
   * Any files left unmapped will fallback to default system templates.
4. Click `Save all to VS Code settings`. Your custom preset is now ready to use from the folder generation workflow!

---

## 📦 Installation

### From a VSIX File (Recommended for teams)

1. Download the latest `*.vsix` file from the [Releases section](https://github.com/AvtoBBus/CCreator/releases).
2. Open the Extensions view in VS Code (`Ctrl+Shift+X`).
3. Click the views action button (three dots `···`) in the top-right corner → `Install from VSIX...`.
4. Select the downloaded file.

### Auto-Updates

The extension automatically checks for newer versions on every VS Code startup. If an update is available:

1. The `.vsix` file will be downloaded to a temporary directory.
2. VS Code will open the file using the built-in `vscode.open` command.
3. You will be prompted to confirm the installation – simply click **Install**.
4. We recommend reloading the window once the installation completes to apply changes.

**Advantage:** This method works entirely through native VS Code mechanisms and does not require the `code` CLI command to be available in your system `PATH`.

---

## 🛠 Development and Building

If you want to contribute or modify the extension:

```bash
git clone https://github.com/AvtoBBus/CCreator.git
cd CCreator
npm install
npm run watch   # compile in watch mode
```

To package the extension into a `.vsix` bundle:

```bash
npm install -g @vscode/vsce
vsce package
```

---

## 🤝 Contributing

- If you encounter a bug, please open an [issue](https://github.com/AvtoBBus/CCreator/issues) or submit a pull request.
- For feature requests or improvement ideas, share them in the [discussions tab](https://github.com/AvtoBBus/CCreator/discussions/1)! We are always open to your feedback and suggestions.

---

**Enjoy lightning-fast structure generation!** 🚀


