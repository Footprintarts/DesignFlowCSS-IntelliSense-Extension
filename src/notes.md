## Working

```js
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Load utility classes from JSON
function getUtilityClasses(): {
  [key: string]: { description: string, styles?: { [key: string]: string } },
} {
  const filePath = path.join(__dirname, "..", "utilities.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}

export function activate(context: vscode.ExtensionContext) {
  const utilitiesPath = path.join(context.extensionPath, "utilities.json");
  const utilities = JSON.parse(fs.readFileSync(utilitiesPath, "utf8"));

  const provider = vscode.languages.registerCompletionItemProvider(
    { language: "html", scheme: "file" },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const line = document.lineAt(position).text;
        const linePrefix = line.substr(0, position.character);

        // Ensure the class attribute completion is triggered correctly
        if (linePrefix.includes('class="')) {
          console.log(`Line Prefix: ${linePrefix}`);

          // Provide completion items for each class in utilities
          return Object.keys(utilities).map((key) => {
            const item = new vscode.CompletionItem(
              key,
              vscode.CompletionItemKind.Text
            );
            item.detail = utilities[key].description;

            if (utilities[key].styles) {
              const styles = Object.entries(utilities[key].styles)
                .map(([prop, value]) => `${prop}: ${value}`)
                .join("; ");
              item.documentation = new vscode.MarkdownString(
                `**Description:** ${utilities[key].description}\n\n**Styles:**\n\`\`\`\n${styles}\n\`\`\``
              );
            }

            return item;
          });
        }

        // Return an empty array if the class attribute is not found or the position is incorrect
        return [];
      },
    },
    '"' // Trigger completion when typing inside quotes for class attribute
  );

  console.log(
    'Congratulations, your extension "designflowcss-intellisense" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "designflowcss-intellisense.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from DesignFlowCss IntelliSense!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
```
