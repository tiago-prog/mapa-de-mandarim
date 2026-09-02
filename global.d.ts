/**
 * NativeWind processes global.css at build time. TypeScript does not need
 * runtime exports from this side-effect stylesheet, but it must know that the
 * module exists so the root layout can import it safely.
 */
declare module "*.css";
