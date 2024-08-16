import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Load utility classes from JSON
function getUtilityClasses(): {
  [key: string]: { description: string; styles?: { [key: string]: string } };
} {
  const filePath = path.join(__dirname, "..", "utilities.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}

export function activate(context: vscode.ExtensionContext) {
  const utilitiesPath = path.join(context.extensionPath, "utilities.json");
  const utilities = JSON.parse(fs.readFileSync(utilitiesPath, "utf8"));

  // Completion Provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { language: "html", scheme: "file" },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const line = document.lineAt(position).text;
        const linePrefix = line.substr(0, position.character);

        if (linePrefix.includes('class="')) {
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

        return [];
      },
    },
    '"' // Trigger completion when typing inside quotes for class attribute
  );

  // Hover Provider Function

  const hoverProvider = vscode.languages.registerHoverProvider(
    { language: "html", scheme: "file" },
    {
      provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.Hover> {
        // Get the range of the class attribute
        const range = document.getWordRangeAtPosition(
          position,
          /class="[^"]*"/
        );

        if (range) {
          const classAttributeText = document.getText(range);
          const classNameMatches = classAttributeText.match(/class="([^"]*)"/);

          if (classNameMatches) {
            // Extract and refine class names
            const classNames = classNameMatches[1]
              .split(/\s+/) // Split on whitespace
              .map((cls) => cls.trim()) // Trim spaces
              .filter((cls) => cls.length > 0); // Filter out empty class names

            // Find the class name under the cursor
            const classNameAtPosition = classNames.find((className) => {
              // Check if the position is within the class name
              const classStart = classAttributeText.indexOf(className);
              const classEnd = classStart + className.length;
              return (
                position.character >= range.start.character + classStart &&
                position.character <= range.start.character + classEnd
              );
            });

            if (classNameAtPosition) {
              let hoverMessage = "";

              // Handle custom values for dynamic classes
              if (classNameAtPosition.startsWith("m-")) {
                const value = classNameAtPosition.split("-")[1];
                const marginValue = parseValue(value);
                hoverMessage = `**Margin:** ${marginValue.value} (${marginValue.remEquivalent})`;
              }
              // padding
              else if (classNameAtPosition.startsWith("p-")) {
                const value = classNameAtPosition.split("-")[1];
                const paddingValue = parseValue(value);
                hoverMessage = `**Padding:** ${paddingValue.value} (${paddingValue.remEquivalent})`;
              }
              // padding-left
              else if (classNameAtPosition.startsWith("pl-")) {
                const value = classNameAtPosition.split("-")[1];
                const paddingValue = parseValue(value);
                hoverMessage = `**Padding Left:** ${paddingValue.value} (${paddingValue.remEquivalent})`;
              }
              // padding-right
              else if (classNameAtPosition.startsWith("pr-")) {
                const value = classNameAtPosition.split("-")[1];
                const paddingValue = parseValue(value);
                hoverMessage = `**Padding Right:** ${paddingValue.value} (${paddingValue.remEquivalent})`;
              }

              // Rectangle-shape
              else if (classNameAtPosition.startsWith("rect:")) {
                const values = classNameAtPosition.split(":")[1].split(",");
                const [width, height, color] = values;
                const widthValue = parseValue(width);
                const heightValue = parseValue(height);
                hoverMessage =
                  `**Rectangle Width:** ${widthValue.value} (${widthValue.remEquivalent})\n` +
                  `**Rectangle Height:** ${heightValue.value} (${heightValue.remEquivalent})\n` +
                  `**Background Color:** ${color}`;
              }

              // Square
              else if (classNameAtPosition.startsWith("sq:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                const sizeValue = parseValue(size);
                hoverMessage =
                  `**Square Size:** ${sizeValue.value} (${sizeValue.remEquivalent})\n` +
                  `**Background Color:** ${color}`;
              }

              // Circle
              else if (classNameAtPosition.startsWith("circle:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                const sizeValue = parseValue(size);
                hoverMessage =
                  `**Circle Diameter:** ${sizeValue.value} (${sizeValue.remEquivalent})\n` +
                  `**Background Color:** ${color}`;
              }
              // Line-Bottom
              else if (classNameAtPosition.startsWith("lineb:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                hoverMessage =
                  `**Line Bottom Size:** ${size}\n` +
                  `**Line Bottom Color:** ${color}`;
              }
              // Line-Left
              else if (classNameAtPosition.startsWith("linel:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                hoverMessage =
                  `**Line Left Size:** ${size}\n` +
                  `**Line Left Color:** ${color}`;
              }
              // Lineright
              else if (classNameAtPosition.startsWith("liner:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                hoverMessage =
                  `**Line Right Size:** ${size}\n` +
                  `**Line Right Color:** ${color}`;
              }
              // Line-top
              else if (classNameAtPosition.startsWith("linet:")) {
                const [size, color] = classNameAtPosition
                  .split(":")[1]
                  .split(",");
                hoverMessage =
                  `**Line Top Size:** ${size}\n` +
                  `**Line Top Color:** ${color}`;
              } else if (classNameAtPosition.startsWith("align-text:")) {
                const value = classNameAtPosition.split(":")[1];
                hoverMessage = `**Text Align:** ${value}`;
              } else if (classNameAtPosition.startsWith("animate-spin:")) {
                const value = classNameAtPosition.split(":")[1];
                hoverMessage = `**Spin Animation Speed:** ${value}`;
              }

              // line-height-size
              else if (classNameAtPosition.startsWith("lhsz-")) {
                const value = classNameAtPosition.split("-")[1];
                const paddingValue = parseValue(value);
                hoverMessage = `**Line Height Size:** ${paddingValue.value} (${paddingValue.remEquivalent})`;
              }
              // gap
              else if (classNameAtPosition.startsWith("gap-")) {
                const value = classNameAtPosition.split("-")[1];
                const paddingValue = parseValue(value);
                hoverMessage = `**Gap Size:** ${paddingValue.value} (${paddingValue.remEquivalent})`;
              }
              // radius
              else if (classNameAtPosition.startsWith("radius-")) {
                const value = classNameAtPosition.split("-")[1];
                const extractedValue = parseValue(value);
                hoverMessage = `**Border Radius:** ${extractedValue.value} (${extractedValue.remEquivalent})`;
              }
              // margin-bottom
              else if (classNameAtPosition.startsWith("mb-")) {
                const value = classNameAtPosition.split("-")[1];
                const extractedValue = parseValue(value);
                hoverMessage = `**Margin Bottom:** ${extractedValue.value} (${extractedValue.remEquivalent})  (${extractedValue.remEquivalent})`;
              }
              // margin-bottom
              else if (classNameAtPosition.startsWith("ml-")) {
                const value = classNameAtPosition.split("-")[1];
                const extractedValue = parseValue(value);
                hoverMessage = `**Margin Left:** ${extractedValue.value} (${extractedValue.remEquivalent})  (${extractedValue.remEquivalent})`;
              }
              // margin-right
              else if (classNameAtPosition.startsWith("mr-")) {
                const value = classNameAtPosition.split("-")[1];
                const extractedValue = parseValue(value);
                hoverMessage = `**Margin Right:** ${extractedValue.value} (${extractedValue.remEquivalent})  (${extractedValue.remEquivalent})`;
              }
              // margin-top
              else if (classNameAtPosition.startsWith("mt-")) {
                const value = classNameAtPosition.split("-")[1];
                const extractedValue = parseValue(value);
                hoverMessage = `**Margin Top:** ${extractedValue.value} (${extractedValue.remEquivalent})  (${extractedValue.remEquivalent})`;
              }
              // background-color
              else if (classNameAtPosition.startsWith("bgc-")) {
                const value = classNameAtPosition.split("-")[1];
                const mvalue = parseValue(value);
                hoverMessage = `**BackGround Color:** ${mvalue.value}`;
              }
              // height
              else if (classNameAtPosition.startsWith("h-")) {
                const value = classNameAtPosition.split("-")[1];
                const heightValue = parseValue(value);
                hoverMessage = `**Height:** ${heightValue.value} (${heightValue.remEquivalent})`;
              } else if (classNameAtPosition.startsWith("w-")) {
                const value = classNameAtPosition.split("-")[1];
                const widthValue = parseValue(value);
                hoverMessage = `**Width:** ${widthValue.value} (${widthValue.remEquivalent})`;
              } else if (classNameAtPosition.startsWith("bgcv-")) {
                const value = classNameAtPosition.split("-")[1];
                hoverMessage = `**Background Cover:** ${value}`;
              } else if (classNameAtPosition.startsWith("bgpos-")) {
                const value = classNameAtPosition.split("-")[1];
                hoverMessage = `**Background Position:** ${value}`;
              } else if (classNameAtPosition.startsWith("decoration-")) {
                const value = classNameAtPosition.split("-")[1];
                hoverMessage = `**Text Decoration:** ${value}`;
              } else if (classNameAtPosition.startsWith("shadow:")) {
                const value = classNameAtPosition.split(":")[1];
                const [x, y, blur, color] = value.split(",");
                hoverMessage = `**Shadow:**\nPosition X: ${x}\nPosition Y: ${y}\nBlur: ${blur}\nColor: ${color}`;
              } else if (utilities[classNameAtPosition]) {
                const { description, styles } = utilities[classNameAtPosition];
                hoverMessage = `**Description:** ${description}`;

                if (styles) {
                  const styleDetails = Object.entries(styles)
                    .map(([prop, value]) => `${prop}: ${value}`)
                    .join("; ");
                  hoverMessage += `\n\n**Styles:**\n\`\`\`\n${styleDetails}\n\`\`\``;
                }
              }

              if (hoverMessage) {
                return new vscode.Hover(
                  new vscode.MarkdownString(hoverMessage)
                );
              }
            }
          }
        }

        return undefined;
      },
    }
  );

  // Function to parse pixel values and convert them to rem units
  function parseValue(value: string) {
    const pxValue = parseFloat(value.replace("px", ""));
    const remValue = pxToRemConverter(16, pxValue);
    return {
      value: `${pxValue}px`,
      remEquivalent: `${remValue}rem`,
    };
  }

  // Function to convert px to rem
  function pxToRemConverter(baseFontSize: number, pxValue: number): number {
    return pxValue / baseFontSize;
  }

  context.subscriptions.push(completionProvider, hoverProvider);

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
