import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { autoOrient } from './autoOrient';

export function parseStlArrayBuffer(arrayBuffer) {
  let geometry = new STLLoader().parse(arrayBuffer);
  return autoOrient(geometry);
}

export function loadStlFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(parseStlArrayBuffer(e.target.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
