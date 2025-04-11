import { Draggable } from 'react-rnd';

declare module 'react-rnd' {
  interface Rnd {
    getDraggable(): Draggable;
  }
}