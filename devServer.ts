import html from './src/mainview/index.html';

Bun.serve({
  routes: {
    "/": html
  }
})

console.log("Dev server running at http://localhost:3000");