import BlobStream from 'blob-stream';
import PDFRenderer from './renderer';
import StyleSheet from './stylesheet';
import { createInstance } from './elements';
import Font from './font';
import { version } from '../package.json';

const View = 'VIEW';
const Text = 'TEXT';
const Link = 'LINK';
const Page = 'PAGE';
const Note = 'NOTE';
const Image = 'IMAGE';
const Document = 'DOCUMENT';
const Canvas = 'CANVAS';

const pdf = input => {
  const container = createInstance({ type: 'ROOT' });
  const mountNode = PDFRenderer.createContainer(container);

  if (input) updateContainer(input);

  function callOnRender(params = {}) {
    if (container.document.props.onRender) {
      const layoutData = container.document.getLayoutData();
      container.document.props.onRender({ ...params, layoutData });
    }
  }

  function isDirty() {
    return container.isDirty;
  }

  function updateContainer(doc) {
    PDFRenderer.updateContainer(doc, mountNode, null);
  }

  async function toBlob(options) {
    await container.render(options);

    const stream = container.instance.pipe(BlobStream());

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        try {
          const blob = stream.toBlob('application/pdf');

          callOnRender({ blob });

          resolve(blob);
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  async function toBuffer(options) {
    await container.render(options);

    callOnRender();

    return container.instance;
  }

  function toString(options) {
    let result = '';
    container.render(options);

    return new Promise((resolve, reject) => {
      try {
        container.instance.on('data', function(buffer) {
          result += buffer;
        });

        container.instance.on('end', function() {
          callOnRender({ string: result });
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  return {
    isDirty,
    container,
    updateContainer,
    toBuffer,
    toBlob,
    toString,
  };
};

export {
  version,
  PDFRenderer,
  View,
  Text,
  Link,
  Page,
  Font,
  Note,
  Image,
  Document,
  Canvas,
  StyleSheet,
  createInstance,
  pdf,
};
