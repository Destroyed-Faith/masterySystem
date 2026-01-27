/**
 * Script to check if the Artifact Builder window exists
 * Run this in the Foundry VTT console (F12)
 */

(function checkArtifactBuilder() {
  console.log("=== Artifact Builder Check ===");
  
  // Method 1: Check ui.windows (Foundry VTT standard way)
  const windowById = ui.windows?.find((app) => app.id === 'artifact-builder');
  
  if (windowById) {
    console.log("✓ Artifact Builder window found via ui.windows");
    console.log("  - ID:", windowById.id);
    console.log("  - Rendered:", windowById.rendered);
    console.log("  - Visible:", windowById.visible);
    console.log("  - Element:", windowById.element);
    return windowById;
  }
  
  // Method 2: Check DOM element directly
  const domElement = document.querySelector('#artifact-builder');
  if (domElement) {
    console.log("✓ Artifact Builder DOM element found");
    console.log("  - Element:", domElement);
    console.log("  - Visible:", domElement.style.display !== 'none');
    return domElement;
  }
  
  // Method 3: Check all windows for artifact-builder class
  const windowsWithClass = Array.from(document.querySelectorAll('.artifact-builder'));
  if (windowsWithClass.length > 0) {
    console.log(`✓ Found ${windowsWithClass.length} element(s) with 'artifact-builder' class`);
    windowsWithClass.forEach((el, idx) => {
      console.log(`  [${idx}] Element:`, el);
    });
    return windowsWithClass;
  }
  
  // Method 4: Check all applications
  const allApps = Object.values(ui.windows || {});
  const artifactApps = allApps.filter((app) => 
    app.constructor?.name === 'ArtifactBuilder' || 
    app.id === 'artifact-builder'
  );
  
  if (artifactApps.length > 0) {
    console.log(`✓ Found ${artifactApps.length} ArtifactBuilder application(s)`);
    artifactApps.forEach((app, idx) => {
      console.log(`  [${idx}] App:`, app);
      console.log(`      - ID: ${app.id}`);
      console.log(`      - Rendered: ${app.rendered}`);
    });
    return artifactApps;
  }
  
  console.log("✗ Artifact Builder window not found");
  return null;
})();

