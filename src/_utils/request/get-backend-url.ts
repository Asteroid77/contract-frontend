export const getBackendURL = () => {
  const host = window.location.hostname
  return import.meta.env.VITE_BACKEND_SERVER_URL
    ? `${import.meta.env.VITE_BACKEND_SERVER_URL}`
    : `https://${host}:${import.meta.env.VITE_BACKEND_SERVER_PORT || 8080}`
}
