import {defineConfig} from 'vite'

export default defineConfig(({command}) => {
    if (command === 'build') {
        return {
            base: "./",
            build: {
                outDir: "../app/public/puzzle",
                emptyOutDir: true,
            },
        }
    }
    return {
        base: "./"
    }
});