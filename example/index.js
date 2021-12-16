const path = require("path");
const { transformFileSync } = require("@babel/core");

const result = transformFileSync(
  path.resolve(__dirname, "Component.block.js"),
  {
    plugins: [
      ["@babel/plugin-transform-react-jsx"],
      [path.resolve("dist", "index.cjs")],
    ],
  }
);

console.log(result.code);
