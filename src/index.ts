const generate = require("@babel/generator").default;

interface templateFactoryArgs {
  componentIdentifier: string;
  code: string;
}

const blockTemplateFactory = ({ componentIdentifier, toolbox, code }) => `
import {render, unmountComponentAtNode} from "react-dom";

${code}

export default class ${componentIdentifier}Block {
  root = null;
  blockState = null;
  editorContext = null

  static get toolbox() {
    return ${toolbox};
  }

  constructor(editorContext){
    this.editorContext = editorContext;
    this.root = document.createElement("div");
    this.setBlockState = this.setBlockState.bind(this);
  }

  setBlockState = (newState)=>{
    this.blockState = newState;
  };

  render = () =>{
    render(<${componentIdentifier} editorContext={this.editorContext} blockState={this.blockState} setBlockState={this.setBlockState} />, this.root);
    return this.root;
  }

  save = () =>{
    return this.blockState;
  }

  destroy = ()=>{
    unmountComponentAtNode(this.root);
  }
}
`;

module.exports = function transformEditorJSBlock(babel) {
  const t = babel.types;
  return {
    visitor: {
      Program: {
        enter(path, _state) {
          const { filename } = this.file.opts;

          if (!filename.includes(".block.")) return;

          if (!this.wrapped) {
            const defaultExportPath = path.get("body").find((child) => {
              if (!t.isDeclaration(child)) return false;

              return t.isExportDefaultDeclaration(child);
            });

            if (!defaultExportPath) return;

            const declaration = defaultExportPath.node.declaration;
            let componentIdentifier = null;

            if (t.isIdentifier(declaration)) {
              componentIdentifier = declaration.name;
              defaultExportPath.remove();
            } else if (t.isFunctionDeclaration(declaration)) {
              if (t.isIdentifier(declaration.id)) {
                componentIdentifier = declaration.id.name;
              } else {
                const id =
                  path.scope.generateUidIdentifier("AnonymousComponent");
                componentIdentifier = id.name;
                declaration.id = id;
              }
              defaultExportPath.replaceWith(declaration);
            } else if (
              t.isAssignmentExpression(declaration) &&
              t.isArrowFunctionExpression(declaration.right)
            ) {
              componentIdentifier = declaration.left.name;
              defaultExportPath.replaceWith(
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.identifier(componentIdentifier),

                    declaration.right
                  ),
                ])
              );
            } else if (t.isArrowFunctionExpression(declaration)) {
              const id = path.scope.generateUidIdentifier("AnonymousComponent");
              componentIdentifier = id.name;
              defaultExportPath.replaceWith(
                t.variableDeclaration("const", [
                  t.variableDeclarator(id, declaration),
                ])
              );
            }

            const toolbox = {};

            path.get("body").find((child) => {
              if (!t.isExportNamedDeclaration(child)) return false;

              if (child.node.declaration.kind !== "const") {
                return false;
              }

              child.node.declaration.declarations.forEach((d) => {
                if (d.id.name === "TITLE" || d.id.name === "ICON") {
                  toolbox[d.id.name.toLowerCase()] = d.init.value;
                  child.remove();
                }
              });
            });

            const toolboxNode = t.objectExpression(
              Object.entries(toolbox).map(([k, v]) => {
                return t.ObjectProperty(t.identifier(k), t.stringLiteral(v));
              })
            );

            path.replaceWith(
              babel.parse(
                blockTemplateFactory({
                  componentIdentifier: componentIdentifier,
                  code: generate(path.node).code,
                  toolbox: generate(toolboxNode).code,
                }),
                {
                  plugins: ["@babel/plugin-transform-react-jsx"],
                }
              ).program
            );

            this.wrapped = true;
          }
        },
      },
    },
  };
};
