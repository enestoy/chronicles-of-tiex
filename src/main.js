import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-ext-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-ext-500.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-ext-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-ext-600.css';
import './styles.css';
import { Game } from './core/Game.js';

try { new Game(); }
catch (error) {
  console.error('Unable to start Velmora:', error);
  document.querySelector('#app').innerHTML = '<div class="fatal"><h1>Velmora is not visible yet.</h1><p>This world needs a desktop browser with WebGL 2 support. Turn on hardware acceleration in your browser and try again.</p><button class="secondary-button" onclick="location.reload()">Try again</button><small>Recommended controls: keyboard and mouse.</small></div>';
}
