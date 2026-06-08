declare module '*.css' {
  const content: string;
  export default content;
}

interface Window {
  electrobun?: {
    window?: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}