let googleMapsPromise = null;

export function loadGoogleMaps(apiKey) {
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      // Kalau sudah ada script, langsung resolve
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.onload = () => resolve(window.google);
        existingScript.onerror = reject;
        return;
      }

      // Inject script Google Maps
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.gomaps.pro/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return googleMapsPromise;
}
