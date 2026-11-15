const STORAGE_KEY = "laboratorio-creativo:v1";

// Adapter local para la V1. La interfaz load/save permite reemplazarlo por
// Supabase en el futuro sin cambiar los componentes de la aplicación.
export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWorkspace(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}
