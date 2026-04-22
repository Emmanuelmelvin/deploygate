import { defineConfig } from "deploygate";
import { 
    hooks,
    emitter
 } from "./platform/hooks";

export default defineConfig({
    adapter: "file",
    dataDir: ".deploygate-data",
    hooks,
    customEvents: emitter
})