/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  // adicione mais variáveis de ambiente aqui se necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}