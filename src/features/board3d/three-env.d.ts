/* A three.js típusai nem részei a csomagnak, és a projekt csak a `three`
   csomagot telepíti (@types/three nélkül). A 3D nézet ezért típus nélkül
   használja - a geometria és az útvonal logikája a típusos layout.ts-ben van. */
declare module 'three';
declare module 'three/examples/jsm/controls/OrbitControls.js';
declare module 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
