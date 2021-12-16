# babel-transform-editor-jsx

## ⚠️ Experimental plugin ahead ⚠️

This repo contains a [babeljs](https://babeljs.io/)
plugin that will transform Reactjs components into [Editorjs](https://editorjs.io/) Block tool.

Take for example the following React component:

```js
import React from "react";

export const TITLE = "Image";
export const ICON =
  '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>';

const MyComponent = ({ editorContext, blockState, setBlockState }) => {
  // do what ever you want to do here with editorContext, blockState, setBlockState.
  return <div>My Tool</div>;
};

export default MyComponent;
```

The result after transpilation:

```js
import { render, unmountComponentAtNode } from "react-dom";
import React from "react";

const MyComponent = (props) => {
  return /*#__PURE__*/ React.createElement("div", null, "My Tool");
};

export default class MyComponentBlock {
  root = null;
  blockState = null;
  editorContext = null;

  static get toolbox() {
    return {
      title: "Image",
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
    };
  }

  constructor(editorContext) {
    this.editorContext = editorContext;
    this.root = document.createElement("div");
    this.setBlockState = this.setBlockState.bind(this);
  }

  setBlockState = (newState) => {
    this.blockState = newState;
  };
  render = () => {
    render(
      /*#__PURE__*/ React.createElement(MyComponent, {
        editorContext: this.editorContext,
        blockState: this.blockState,
        setBlockState: this.setBlockState,
      }),
      this.root
    );
    return this.root;
  };
  save = () => {
    return this.blockState;
  };
  destroy = () => {
    unmountComponentAtNode(this.root);
  };
}
```

Basically it wraps any React component with the [Editorjs class definition](https://editorjs.io/the-first-plugin#render-and-save) and it will handle creating the host dom node, mount and unmounting the component if and only if its name ends with `.block.js`

### Updating component state:

The plugin will create the following members on the class and will pass them as props to the component:

1. `editorContext`: is the [API object](https://editorjs.io/access-api) that Editorjs passes to the tool constructor.
2. `blockState`: a property on the tool instance that holds the tool data that will be ultimately returned by the save method automatically.
3. `setBlockState`: a setter for `blockState` mentioned in point #2

### Notes:

- `TITLE` and `ICON` must be exported as `const` in **UPPERCASE** in order for them to be captured by the plugin and used as toolbox configuration.

## License

[MIT](LICENSE).
