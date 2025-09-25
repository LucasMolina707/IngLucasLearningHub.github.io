const fs = require('fs');
const path = require('path');

// --- Configuración ---
const rootDir = '.';
const outputFile = 'nav.json';
// Archivos específicos a excluir de la navegación.
const skipFiles = ['404.html', '.google3d179aab9710cc23.html'];
// Directorios a ignorar por completo durante el escaneo.
const skipDirs = ['node_modules', 'assets', 'galeria', 'multimedia', '.Plantillas'];

// --- Lógica ---
console.log('Iniciando escaneo de archivos para generar nav.json...');

/**
 * Capitaliza la primera letra de cada palabra y elimina guiones/subrayados.
 * Ejemplo: 'politicas-privacidad' -> 'Politicas Privacidad'
 * @param {string} text - El texto a formatear.
 * @returns {string} El texto formateado.
 */
function formatLabel(text) {
  return text
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Escanea directorios recursivamente para encontrar archivos .html.
 * @param {string} dir - El directorio desde el cual empezar a escanear.
 * @returns {Array<{href: string, label: string, isProject: boolean}>} Lista de archivos encontrados.
 */
function scanFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      // Si es un directorio, y no está en la lista de exclusión, escanearlo.
      if (!skipDirs.includes(file)) {
        results = results.concat(scanFiles(fullPath));
      }
    } else if (file.endsWith('.html') && !skipFiles.includes(file)) {
      // Si es un archivo .html y no está en la lista de exclusión.
      const isProject = (dir !== rootDir);
      const href = '/' + path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const label = formatLabel(path.basename(file, '.html'));

      results.push({ href, label, isProject });
    }
  });

  return results;
}

try {
  const allFiles = scanFiles(rootDir);

  const pages = allFiles
    .filter(f => !f.isProject)
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  const projects = allFiles
    .filter(f => f.isProject)
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  // Asegurarse de que la página de inicio (index.html) aparezca primero si existe.
  pages.sort((a, b) => {
    if (a.href.endsWith('/index.html')) return -1;
    if (b.href.endsWith('/index.html')) return 1;
    return 0;
  });

  const navData = {
    pages,
    projects,
  };

  fs.writeFileSync(outputFile, JSON.stringify(navData, null, 2));
  console.log(`✅ Archivo ${outputFile} generado con éxito.`);
  console.log(`   - ${pages.length} páginas encontradas.`);
  console.log(`   - ${projects.length} proyectos encontrados.`);

} catch (error) {
  console.error('❌ Error al generar el archivo de navegación:', error);
}